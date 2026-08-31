"""Validate ZH-LAO Executable Spec artifacts without third-party dependencies.

This checker is a structural/traceability gate. It never declares a business Gate PASS.
During the 1.0 -> 1.1 migration it can read the legacy empty/adopted_domains registry,
but all newly adopted canonical specs use the scope-aware 1.1 format.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SPECS = ROOT / "docs" / "docs" / "development" / "specs"
SCOPE_TYPES = {"domain": "domains", "feature": "features", "system": "system"}
SCOPE_ID_RE = re.compile(r"^[a-z][a-z0-9-]*$")
REQ_ID_RE = re.compile(
    r"^(?:[A-Z][A-Z0-9]*-(?:CORE|UC|API|PUB|SEC|CON|STATE|DB|RBAC)-\d{3}|SYS-\d{3})$"
)

def load_json(path: Path, errors: list[str]) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"{path.relative_to(ROOT)}: invalid JSON ({exc})")
        return None

def expect(value: Any, kind: type, label: str, errors: list[str]) -> bool:
    if not isinstance(value, kind):
        errors.append(f"{label}: expected {kind.__name__}")
        return False
    return True

def scope_key(scope_type: str, scope_id: str) -> str:
    return f"{scope_type}:{scope_id}"

def canonical_path(scope_type: str, scope_id: str) -> Path:
    return SPECS / SCOPE_TYPES[scope_type] / f"{scope_id}.spec.json"

def evidence_path(scope_type: str, scope_id: str) -> Path:
    return SPECS / "evidence" / SCOPE_TYPES[scope_type] / f"{scope_id}.evidence.json"

def check_reference(ref: Any, label: str, errors: list[str]) -> None:
    if not expect(ref, dict, label, errors):
        return
    path = ref.get("path")
    if not isinstance(path, str) or not path:
        errors.append(f"{label}.path: required non-empty repository path")
        return
    p = Path(path)
    if p.is_absolute() or ".." in p.parts:
        errors.append(f"{label}.path: must be repository-relative and non-traversing")
    elif not (ROOT / p).is_file():
        errors.append(f"{label}.path: target does not exist: {path}")
    if "kind" in ref and ref["kind"] not in {
        "markdown", "http", "public", "db", "event", "state_machine", "schema", "code", "test"
    }:
        errors.append(f"{label}.kind: unsupported kind")

def collect_ids(items: Any, key: str, label: str, errors: list[str]) -> set[str]:
    result: set[str] = set()
    if not expect(items, list, label, errors):
        return result
    for i, item in enumerate(items):
        if not isinstance(item, dict) or not isinstance(item.get(key), str) or not item[key]:
            errors.append(f"{label}[{i}].{key}: required non-empty string")
            continue
        value = item[key]
        if value in result:
            errors.append(f"{label}[{i}].{key}: duplicate ID {value}")
        result.add(value)
    return result

def check_canonical(scope_type: str, scope_id: str, spec: Any, errors: list[str]) -> set[str]:
    rel = canonical_path(scope_type, scope_id).relative_to(ROOT)
    label = str(rel)
    if not expect(spec, dict, label, errors):
        return set()
    if spec.get("artifact_type") != "canonical_spec" or spec.get("schema_version") != "1.1":
        errors.append(f"{label}: requires artifact_type=canonical_spec and schema_version=1.1")
    if spec.get("scope_type") != scope_type or spec.get("scope_id") != scope_id:
        errors.append(f"{label}: scope_type/scope_id must match registry")
    if scope_type not in SCOPE_TYPES or not SCOPE_ID_RE.fullmatch(scope_id):
        errors.append(f"{label}: invalid scope")

    req_ids = collect_ids(spec.get("requirements"), "id", f"{label}.requirements", errors)
    uc_ids = collect_ids(spec.get("use_cases"), "id", f"{label}.use_cases", errors)
    scenario_ids = collect_ids(spec.get("acceptance_scenarios"), "id", f"{label}.acceptance_scenarios", errors)
    machine_ids = collect_ids(spec.get("state_machines"), "id", f"{label}.state_machines", errors)

    req_by_id = {x.get("id"): x for x in spec.get("requirements", []) if isinstance(x, dict)}
    uc_by_id = {x.get("id"): x for x in spec.get("use_cases", []) if isinstance(x, dict)}
    scenario_by_id = {x.get("id"): x for x in spec.get("acceptance_scenarios", []) if isinstance(x, dict)}
    machine_by_id = {x.get("id"): x for x in spec.get("state_machines", []) if isinstance(x, dict)}

    for i, req in enumerate(spec.get("requirements", []) if isinstance(spec.get("requirements"), list) else []):
        item = f"{label}.requirements[{i}]"
        if not isinstance(req, dict):
            errors.append(f"{item}: expected object")
            continue
        rid = req.get("id")
        if not isinstance(rid, str) or not REQ_ID_RE.fullmatch(rid):
            errors.append(f"{item}.id: invalid Requirement ID")
        if req.get("status") not in {"baseline", "frozen", "designing", "deferred", "superseded"}:
            errors.append(f"{item}.status: invalid or missing")
        if not isinstance(req.get("statement"), str) or not req["statement"].strip():
            errors.append(f"{item}.statement: required non-empty normative statement")

        auth = req.get("authority_refs")
        if not isinstance(auth, list) or not auth:
            errors.append(f"{item}.authority_refs: at least one authority required")
        else:
            for n, r in enumerate(auth):
                check_reference(r, f"{item}.authority_refs[{n}]", errors)

        contracts = req.get("contract_refs")
        if not isinstance(contracts, list) or not contracts:
            errors.append(f"{item}.contract_refs: at least one contract reference required")
        else:
            for n, r in enumerate(contracts):
                check_reference(r, f"{item}.contract_refs[{n}]", errors)

        for field, known in (
            ("use_case_ids", uc_ids),
            ("acceptance_scenario_ids", scenario_ids),
            ("state_machine_ids", machine_ids),
        ):
            values = req.get(field)
            if not isinstance(values, list):
                errors.append(f"{item}.{field}: expected list")
                continue
            if field != "state_machine_ids" and not values:
                errors.append(f"{item}.{field}: non-empty list required")
            for value in values:
                if value not in known:
                    errors.append(f"{item}.{field}: unknown reference {value}")

    for i, uc in enumerate(spec.get("use_cases", []) if isinstance(spec.get("use_cases"), list) else []):
        item = f"{label}.use_cases[{i}]"
        if not isinstance(uc, dict):
            errors.append(f"{item}: expected object")
            continue
        for text_field in ("name", "actor"):
            if not isinstance(uc.get(text_field), str) or not uc[text_field].strip():
                errors.append(f"{item}.{text_field}: required non-empty string")
        values = uc.get("requirement_ids")
        if not isinstance(values, list) or not values:
            errors.append(f"{item}.requirement_ids: non-empty list required")
        else:
            for rid in values:
                if rid not in req_ids:
                    errors.append(f"{item}.requirement_ids: unknown requirement {rid}")
        refs = uc.get("contract_refs")
        if not isinstance(refs, list) or not refs:
            errors.append(f"{item}.contract_refs: non-empty list required")
        else:
            for n, r in enumerate(refs):
                check_reference(r, f"{item}.contract_refs[{n}]", errors)

    for i, scenario in enumerate(spec.get("acceptance_scenarios", []) if isinstance(spec.get("acceptance_scenarios"), list) else []):
        item = f"{label}.acceptance_scenarios[{i}]"
        if not isinstance(scenario, dict):
            errors.append(f"{item}: expected object")
            continue
        for field in ("given", "when", "then"):
            if not isinstance(scenario.get(field), str) or not scenario[field].strip():
                errors.append(f"{item}.{field}: required non-empty Given/When/Then")
        for field, known in (("requirement_ids", req_ids), ("use_case_ids", uc_ids)):
            values = scenario.get(field)
            if not isinstance(values, list) or not values:
                errors.append(f"{item}.{field}: non-empty list required")
            else:
                for value in values:
                    if value not in known:
                        errors.append(f"{item}.{field}: unknown reference {value}")

    for i, machine in enumerate(spec.get("state_machines", []) if isinstance(spec.get("state_machines"), list) else []):
        item = f"{label}.state_machines[{i}]"
        if not isinstance(machine, dict):
            errors.append(f"{item}: expected object")
            continue
        states = machine.get("states")
        if not isinstance(states, list) or not states or not all(isinstance(s, str) and s for s in states):
            errors.append(f"{item}.states: non-empty string list required")
            states = []
        if machine.get("initial_state") not in states:
            errors.append(f"{item}.initial_state: must be declared")
        terminal = machine.get("terminal_states")
        if not isinstance(terminal, list) or any(s not in states for s in terminal):
            errors.append(f"{item}.terminal_states: declared-state list required")
        transitions = machine.get("transitions")
        if not isinstance(transitions, list) or not transitions:
            errors.append(f"{item}.transitions: non-empty list required")
        else:
            for n, transition in enumerate(transitions):
                if not isinstance(transition, dict):
                    errors.append(f"{item}.transitions[{n}]: expected object")
                    continue
                if transition.get("from") not in states or transition.get("to") not in states:
                    errors.append(f"{item}.transitions[{n}]: from/to must be declared states")
                if not isinstance(transition.get("guard"), str) or not transition["guard"].strip():
                    errors.append(f"{item}.transitions[{n}].guard: required")
        values = machine.get("requirement_ids")
        if not isinstance(values, list) or not values:
            errors.append(f"{item}.requirement_ids: non-empty list required")
        else:
            for rid in values:
                if rid not in req_ids:
                    errors.append(f"{item}.requirement_ids: unknown requirement {rid}")

    for rid, req in req_by_id.items():
        if not isinstance(rid, str):
            continue
        for uid in req.get("use_case_ids", []) if isinstance(req.get("use_case_ids"), list) else []:
            target = uc_by_id.get(uid)
            if isinstance(target, dict) and rid not in target.get("requirement_ids", []):
                errors.append(f"{label}: {rid} -> {uid} is not bidirectional")
        for sid in req.get("acceptance_scenario_ids", []) if isinstance(req.get("acceptance_scenario_ids"), list) else []:
            target = scenario_by_id.get(sid)
            if isinstance(target, dict) and rid not in target.get("requirement_ids", []):
                errors.append(f"{label}: {rid} -> {sid} is not bidirectional")
        for mid in req.get("state_machine_ids", []) if isinstance(req.get("state_machine_ids"), list) else []:
            target = machine_by_id.get(mid)
            if isinstance(target, dict) and rid not in target.get("requirement_ids", []):
                errors.append(f"{label}: {rid} -> {mid} is not bidirectional")
    return req_ids

def check_evidence(
    scope_type: str,
    scope_id: str,
    source_path: Path,
    req_ids: set[str],
    evidence: Any,
    errors: list[str],
    require_evidence: bool,
) -> None:
    path = evidence_path(scope_type, scope_id)
    label = str(path.relative_to(ROOT))
    if evidence is None:
        if require_evidence:
            errors.append(f"{label}: required for --require-evidence")
        return
    if not expect(evidence, dict, label, errors):
        return
    if (
        evidence.get("artifact_type") != "derived_evidence"
        or evidence.get("schema_version") != "1.1"
        or evidence.get("scope_type") != scope_type
        or evidence.get("scope_id") != scope_id
    ):
        errors.append(f"{label}: invalid artifact_type/schema_version/scope")
    expected_source = str(source_path.relative_to(ROOT)).replace("\\", "/")
    if evidence.get("source_spec") != expected_source:
        errors.append(f"{label}.source_spec: must equal {expected_source}")
    digest = hashlib.sha256(source_path.read_bytes()).hexdigest()
    if evidence.get("source_spec_sha256") != digest:
        errors.append(f"{label}.source_spec_sha256: SPEC_DRIFT")

    covered: set[str] = set()
    for i, item in enumerate(evidence.get("requirements", []) if isinstance(evidence.get("requirements"), list) else []):
        entry = f"{label}.requirements[{i}]"
        if not isinstance(item, dict) or item.get("id") not in req_ids:
            errors.append(f"{entry}.id: must reference canonical requirement")
            continue
        rid = item["id"]
        if rid in covered:
            errors.append(f"{entry}.id: duplicate evidence {rid}")
        covered.add(rid)
        for field in ("implementation_refs", "test_refs"):
            values = item.get(field)
            if not isinstance(values, list) or not values:
                errors.append(f"{entry}.{field}: non-empty list required")
            else:
                for n, r in enumerate(values):
                    check_reference(r, f"{entry}.{field}[{n}]", errors)
        if not isinstance(item.get("check_ids"), list) or not item["check_ids"]:
            errors.append(f"{entry}.check_ids: non-empty list required")

    checks: set[str] = set()
    for i, check in enumerate(evidence.get("gate_checks", []) if isinstance(evidence.get("gate_checks"), list) else []):
        entry = f"{label}.gate_checks[{i}]"
        if not isinstance(check, dict) or not isinstance(check.get("id"), str) or not check["id"]:
            errors.append(f"{entry}.id: required")
            continue
        if check["id"] in checks:
            errors.append(f"{entry}.id: duplicate")
        checks.add(check["id"])
        for field in ("command", "commit", "artifact"):
            if not isinstance(check.get(field), str) or not check[field].strip():
                errors.append(f"{entry}.{field}: required execution evidence")
        if check.get("exit_code") != 0:
            errors.append(f"{entry}.exit_code: must be 0")

    for i, item in enumerate(evidence.get("requirements", []) if isinstance(evidence.get("requirements"), list) else []):
        if isinstance(item, dict) and isinstance(item.get("check_ids"), list):
            for check_id in item["check_ids"]:
                if check_id not in checks:
                    errors.append(f"{label}.requirements[{i}].check_ids: unknown check {check_id}")

    if require_evidence and covered != req_ids:
        missing = sorted(req_ids - covered)
        extra = sorted(covered - req_ids)
        errors.append(f"{label}: evidence coverage mismatch; missing={missing}, extra={extra}")

def read_registry(errors: list[str]) -> list[tuple[str, str]]:
    index = load_json(SPECS / "index.json", errors)
    if not isinstance(index, dict):
        return []
    version = index.get("schema_version")
    result: list[tuple[str, str]] = []

    if version == "1.1":
        adopted = index.get("adopted_scopes")
        if not isinstance(adopted, list):
            errors.append("specs/index.json: adopted_scopes must be a list")
            return []
        for i, entry in enumerate(adopted):
            if not isinstance(entry, dict):
                errors.append(f"specs/index.json.adopted_scopes[{i}]: expected object")
                continue
            st = entry.get("scope_type")
            sid = entry.get("scope_id")
            if st not in SCOPE_TYPES or not isinstance(sid, str) or not SCOPE_ID_RE.fullmatch(sid):
                errors.append(f"specs/index.json.adopted_scopes[{i}]: invalid scope")
                continue
            result.append((st, sid))
    elif version == "1.0":
        adopted = index.get("adopted_domains")
        if not isinstance(adopted, list) or not all(isinstance(d, str) and SCOPE_ID_RE.fullmatch(d) for d in adopted):
            errors.append("specs/index.json: legacy adopted_domains must be lowercase-kebab-case list")
            return []
        result = [("domain", d) for d in adopted]
    else:
        errors.append("specs/index.json: schema_version must be 1.1 (or legacy 1.0 during migration)")
        return []

    keys = [scope_key(*s) for s in result]
    if len(keys) != len(set(keys)):
        errors.append("specs/index.json: adopted scopes contain duplicates")
    return result

def parse_scope(raw: str, parser: argparse.ArgumentParser) -> tuple[str, str]:
    if ":" not in raw:
        parser.error("--scope must be <domain|feature|system>:<scope-id>")
    st, sid = raw.split(":", 1)
    if st not in SCOPE_TYPES or not SCOPE_ID_RE.fullmatch(sid):
        parser.error("--scope must be <domain|feature|system>:<lowercase-kebab-id>")
    return st, sid

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--scope", help="validate exactly one adopted scope, e.g. domain:content")
    parser.add_argument("--domain", help="compatibility alias for --scope domain:<id>")
    parser.add_argument("--require-evidence", action="store_true")
    args = parser.parse_args()
    if args.scope and args.domain:
        parser.error("use either --scope or --domain, not both")

    errors: list[str] = []
    adopted = read_registry(errors)
    selected: list[tuple[str, str]]
    if args.scope:
        selected = [parse_scope(args.scope, parser)]
    elif args.domain:
        if not SCOPE_ID_RE.fullmatch(args.domain):
            parser.error("--domain requires lowercase-kebab id")
        selected = [("domain", args.domain)]
    else:
        selected = adopted

    adopted_keys = {scope_key(*s) for s in adopted}
    for scope in selected:
        if scope_key(*scope) not in adopted_keys:
            errors.append(f"specs/index.json: requested scope is not adopted: {scope_key(*scope)}")

    for st, sid in selected:
        source = canonical_path(st, sid)
        if not source.is_file():
            errors.append(f"{source.relative_to(ROOT)}: missing canonical spec")
            continue
        spec = load_json(source, errors)
        req_ids = check_canonical(st, sid, spec, errors)
        ev_path = evidence_path(st, sid)
        evidence = load_json(ev_path, errors) if ev_path.is_file() else None
        check_evidence(st, sid, source, req_ids, evidence, errors, args.require_evidence)

    if errors:
        print("EXECUTABLE_SPEC_CHECK = FAIL")
        for error in errors:
            print(f"  x {error}")
        return 1
    print("EXECUTABLE_SPEC_CHECK = PASS")
    print(f"adopted scopes checked: {len(selected)}")
    if not selected:
        print("coverage: no existing scope is claimed as adopted")
    return 0

if __name__ == "__main__":
    sys.exit(main())
