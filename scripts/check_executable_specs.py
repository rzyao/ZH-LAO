"""Validate ZH-LAO V2 Executable Spec artifacts without third-party dependencies.

This is a structural/traceability gate. It intentionally does not declare a Domain
Gate PASS: test, contract, architecture and database commands remain independent
inputs recorded as derived evidence and evaluated by the existing Gate process.
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
SPECS = ROOT / "docs" / "docs" / "development" / "v2" / "specs"
ID_RE = re.compile(r"^(?:[A-Z][A-Z0-9]*-(?:CORE|UC|API|PUB|SEC|CON|STATE|DB|RBAC)|SYS)-\d{3}$")
DOMAIN_RE = re.compile(r"^[a-z][a-z0-9-]*$")


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


def check_reference(ref: Any, label: str, errors: list[str]) -> None:
    if not expect(ref, dict, label, errors):
        return
    path = ref.get("path")
    if not isinstance(path, str) or not path:
        errors.append(f"{label}.path: required non-empty repository path")
        return
    if Path(path).is_absolute() or ".." in Path(path).parts:
        errors.append(f"{label}.path: must be a repository-relative non-traversing path")
    elif not (ROOT / path).is_file():
        errors.append(f"{label}.path: target does not exist: {path}")
    if "kind" in ref and ref["kind"] not in {"markdown", "http", "public", "db", "event", "state_machine", "schema", "code", "test"}:
        errors.append(f"{label}.kind: unsupported kind")


def ids(items: Any, key: str, label: str, errors: list[str]) -> set[str]:
    result: set[str] = set()
    if not expect(items, list, label, errors):
        return result
    for i, item in enumerate(items):
        if not isinstance(item, dict) or not isinstance(item.get(key), str):
            errors.append(f"{label}[{i}].{key}: required string")
        elif item[key] in result:
            errors.append(f"{label}[{i}].{key}: duplicate ID {item[key]}")
        else:
            result.add(item[key])
    return result


def check_canonical(domain: str, spec: Any, errors: list[str]) -> set[str]:
    label = f"specs/{domain}.spec.json"
    if not expect(spec, dict, label, errors):
        return set()
    if spec.get("artifact_type") != "canonical_spec" or spec.get("schema_version") != "1.0":
        errors.append(f"{label}: requires artifact_type=canonical_spec and schema_version=1.0")
    if spec.get("domain") != domain or not DOMAIN_RE.fullmatch(domain):
        errors.append(f"{label}.domain: must equal index domain and be lowercase kebab-case")

    requirement_ids = ids(spec.get("requirements"), "id", f"{label}.requirements", errors)
    use_case_ids = ids(spec.get("use_cases"), "id", f"{label}.use_cases", errors)
    scenario_ids = ids(spec.get("acceptance_scenarios"), "id", f"{label}.acceptance_scenarios", errors)
    machine_ids = ids(spec.get("state_machines"), "id", f"{label}.state_machines", errors)

    for i, req in enumerate(spec.get("requirements", []) if isinstance(spec.get("requirements"), list) else []):
        item = f"{label}.requirements[{i}]"
        if not isinstance(req, dict):
            continue
        rid = req.get("id")
        if not isinstance(rid, str) or not ID_RE.fullmatch(rid):
            errors.append(f"{item}.id: must match <DOMAIN>-<AREA>-<NNN> or SYS-<NNN>")
        if req.get("status") not in {"baseline", "frozen", "designing", "deferred", "superseded"}:
            errors.append(f"{item}.status: invalid or missing")
        if not isinstance(req.get("statement"), str) or not req["statement"].strip():
            errors.append(f"{item}.statement: required non-empty normative statement")
        refs = req.get("authority_refs")
        if not isinstance(refs, list) or not refs:
            errors.append(f"{item}.authority_refs: at least one authoritative reference required")
        else:
            for n, ref in enumerate(refs):
                check_reference(ref, f"{item}.authority_refs[{n}]", errors)
        for field, known in (("use_case_ids", use_case_ids), ("contract_ids", None), ("acceptance_scenario_ids", scenario_ids), ("state_machine_ids", machine_ids)):
            values = req.get(field, [])
            if not isinstance(values, list):
                errors.append(f"{item}.{field}: expected list")
            elif known is not None:
                for value in values:
                    if value not in known:
                        errors.append(f"{item}.{field}: unknown reference {value}")

    contract_ids: set[str] = set()
    for i, uc in enumerate(spec.get("use_cases", []) if isinstance(spec.get("use_cases"), list) else []):
        item = f"{label}.use_cases[{i}]"
        if not isinstance(uc, dict):
            continue
        reqs = uc.get("requirement_ids")
        if not isinstance(reqs, list) or not reqs:
            errors.append(f"{item}.requirement_ids: non-empty list required")
        elif any(r not in requirement_ids for r in reqs):
            errors.append(f"{item}.requirement_ids: references unknown requirement")
        refs = uc.get("contract_refs")
        if not isinstance(refs, list) or not refs:
            errors.append(f"{item}.contract_refs: non-empty list required")
        else:
            for n, ref in enumerate(refs):
                check_reference(ref, f"{item}.contract_refs[{n}]", errors)
                if isinstance(ref, dict) and isinstance(ref.get("id"), str):
                    contract_ids.add(ref["id"])

    for i, scenario in enumerate(spec.get("acceptance_scenarios", []) if isinstance(spec.get("acceptance_scenarios"), list) else []):
        item = f"{label}.acceptance_scenarios[{i}]"
        if not isinstance(scenario, dict):
            continue
        for field in ("given", "when", "then"):
            if not isinstance(scenario.get(field), str) or not scenario[field].strip():
                errors.append(f"{item}.{field}: required non-empty Given/When/Then field")
        for field, known in (("requirement_ids", requirement_ids), ("use_case_ids", use_case_ids)):
            values = scenario.get(field)
            if not isinstance(values, list) or not values:
                errors.append(f"{item}.{field}: non-empty list required")
            elif any(value not in known for value in values):
                errors.append(f"{item}.{field}: references unknown ID")

    for i, machine in enumerate(spec.get("state_machines", []) if isinstance(spec.get("state_machines"), list) else []):
        item = f"{label}.state_machines[{i}]"
        if not isinstance(machine, dict):
            continue
        states = machine.get("states")
        if not isinstance(states, list) or len(states) < 1 or not all(isinstance(s, str) and s for s in states):
            errors.append(f"{item}.states: non-empty string list required")
            states = []
        if machine.get("initial_state") not in states:
            errors.append(f"{item}.initial_state: must be a declared state")
        terminal = machine.get("terminal_states")
        if not isinstance(terminal, list) or any(state not in states for state in terminal):
            errors.append(f"{item}.terminal_states: declared-state list required")
        transitions = machine.get("transitions")
        if not isinstance(transitions, list) or not transitions:
            errors.append(f"{item}.transitions: non-empty list required")
        else:
            for n, transition in enumerate(transitions):
                if not isinstance(transition, dict) or transition.get("from") not in states or transition.get("to") not in states:
                    errors.append(f"{item}.transitions[{n}]: from/to must be declared states")
        reqs = machine.get("requirement_ids")
        if not isinstance(reqs, list) or not reqs or any(r not in requirement_ids for r in reqs):
            errors.append(f"{item}.requirement_ids: non-empty known requirement list required")

    return requirement_ids


def check_evidence(domain: str, canonical_path: Path, requirement_ids: set[str], evidence: Any, errors: list[str], require_evidence: bool) -> None:
    label = f"specs/evidence/{domain}.evidence.json"
    if evidence is None:
        if require_evidence:
            errors.append(f"{label}: required for --require-evidence")
        return
    if not expect(evidence, dict, label, errors):
        return
    if evidence.get("artifact_type") != "derived_evidence" or evidence.get("schema_version") != "1.0" or evidence.get("domain") != domain:
        errors.append(f"{label}: invalid artifact_type, schema_version, or domain")
    expected_source = f"docs/docs/development/v2/specs/{domain}.spec.json"
    if evidence.get("source_spec") != expected_source:
        errors.append(f"{label}.source_spec: must equal {expected_source}")
    digest = hashlib.sha256(canonical_path.read_bytes()).hexdigest()
    if evidence.get("source_spec_sha256") != digest:
        errors.append(f"{label}.source_spec_sha256: SPEC_DRIFT (does not match canonical spec)")
    covered: set[str] = set()
    for i, item in enumerate(evidence.get("requirements", []) if isinstance(evidence.get("requirements"), list) else []):
        entry = f"{label}.requirements[{i}]"
        if not isinstance(item, dict) or item.get("id") not in requirement_ids:
            errors.append(f"{entry}.id: must reference a canonical requirement")
            continue
        covered.add(item["id"])
        for field in ("implementation_refs", "test_refs", "check_ids"):
            values = item.get(field)
            if not isinstance(values, list) or not values:
                errors.append(f"{entry}.{field}: non-empty list required")
            elif field.endswith("refs"):
                for n, ref in enumerate(values):
                    check_reference(ref, f"{entry}.{field}[{n}]", errors)
    if require_evidence and covered != requirement_ids:
        errors.append(f"{label}: evidence must cover every canonical requirement")
    check_ids: set[str] = set()
    for i, check in enumerate(evidence.get("gate_checks", []) if isinstance(evidence.get("gate_checks"), list) else []):
        entry = f"{label}.gate_checks[{i}]"
        if not isinstance(check, dict) or not isinstance(check.get("id"), str):
            errors.append(f"{entry}.id: required string")
            continue
        check_ids.add(check["id"])
        for field in ("command", "commit", "artifact"):
            if not isinstance(check.get(field), str) or not check[field].strip():
                errors.append(f"{entry}.{field}: required non-empty execution evidence")
        if check.get("exit_code") != 0:
            errors.append(f"{entry}.exit_code: must be 0; a declared PASS is not evidence")
    for i, item in enumerate(evidence.get("requirements", []) if isinstance(evidence.get("requirements"), list) else []):
        if isinstance(item, dict) and isinstance(item.get("check_ids"), list):
            for cid in item["check_ids"]:
                if cid not in check_ids:
                    errors.append(f"{label}.requirements[{i}].check_ids: unknown check {cid}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--domain", help="validate exactly one adopted domain")
    parser.add_argument("--require-evidence", action="store_true", help="fail if derived evidence is absent or incomplete")
    args = parser.parse_args()
    errors: list[str] = []
    index = load_json(SPECS / "index.json", errors)
    adopted = index.get("adopted_domains") if isinstance(index, dict) else None
    if not isinstance(adopted, list) or not all(isinstance(d, str) and DOMAIN_RE.fullmatch(d) for d in adopted):
        errors.append("specs/index.json: adopted_domains must be a lowercase-kebab-case list")
        adopted = []
    if len(set(adopted)) != len(adopted):
        errors.append("specs/index.json: adopted_domains contains duplicates")
    domains = [args.domain] if args.domain else adopted
    if args.domain and args.domain not in adopted:
        errors.append(f"specs/index.json: requested domain is not adopted: {args.domain}")
    for domain in domains:
        canonical_path = SPECS / f"{domain}.spec.json"
        spec = load_json(canonical_path, errors) if canonical_path.is_file() else None
        if spec is None:
            errors.append(f"specs/{domain}.spec.json: missing canonical spec")
            continue
        requirement_ids = check_canonical(domain, spec, errors)
        evidence_path = SPECS / "evidence" / f"{domain}.evidence.json"
        evidence = load_json(evidence_path, errors) if evidence_path.is_file() else None
        check_evidence(domain, canonical_path, requirement_ids, evidence, errors, args.require_evidence)
    if errors:
        print("EXECUTABLE_SPEC_CHECK = FAIL")
        for error in errors:
            print(f"  x {error}")
        return 1
    print("EXECUTABLE_SPEC_CHECK = PASS")
    print(f"adopted domains checked: {len(domains)}")
    if not domains:
        print("coverage: no existing domain is claimed as adopted")
    return 0


if __name__ == "__main__":
    sys.exit(main())
