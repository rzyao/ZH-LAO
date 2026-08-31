"""Structural and traceability checker for ZH-LAO executable specs."""
from __future__ import annotations
import argparse, hashlib, json, re, sys
from pathlib import Path
from typing import Any

ROOT=Path(__file__).resolve().parents[1]
SPECS=ROOT/"docs/docs/development/specs"
SCOPE_DIR={"domain":"domains","feature":"features","system":"system"}
SID=re.compile(r"^[a-z][a-z0-9-]*$")
RID=re.compile(r"^(?:[A-Z][A-Z0-9]*-(?:CORE|UC|API|PUB|SEC|CON|STATE|DB|RBAC)-\d{3}|SYS-\d{3})$")

def load(p:Path,e:list[str])->Any:
    try:return json.loads(p.read_text("utf-8"))
    except Exception as x:e.append(f"{p.relative_to(ROOT)}: invalid JSON ({x})");return None

def cpath(t:str,i:str)->Path:return SPECS/SCOPE_DIR[t]/f"{i}.spec.json"
def epath(t:str,i:str)->Path:return SPECS/"evidence"/SCOPE_DIR[t]/f"{i}.evidence.json"

def refs(spec:dict[str,Any],label:str,e:list[str])->dict[str,dict[str,Any]]:
    r=spec.get("references",{})
    if not isinstance(r,dict):e.append(f"{label}.references: expected object");return {}
    for k,v in r.items():
        if not isinstance(k,str) or not k or not isinstance(v,dict):e.append(f"{label}.references: invalid entry {k}");continue
        check_ref(v,{},f"{label}.references.{k}",e,False)
    return r

def check_ref(v:Any,registry:dict[str,dict[str,Any]],label:str,e:list[str],allow_alias:bool=True)->None:
    if isinstance(v,str) and allow_alias:
        if v not in registry:e.append(f"{label}: unknown reference alias {v}")
        return
    if not isinstance(v,dict):e.append(f"{label}: expected reference object or alias");return
    p=v.get("path")
    if not isinstance(p,str) or not p:e.append(f"{label}.path: required");return
    q=Path(p)
    if q.is_absolute() or ".." in q.parts:e.append(f"{label}.path: invalid repository path")
    elif not (ROOT/q).is_file():e.append(f"{label}.path: target missing: {p}")

def ids(items:Any,key:str,label:str,e:list[str])->set[str]:
    if not isinstance(items,list):e.append(f"{label}: expected list");return set()
    out:set[str]=set()
    for n,x in enumerate(items):
        if not isinstance(x,dict) or not isinstance(x.get(key),str) or not x[key]:e.append(f"{label}[{n}].{key}: required");continue
        if x[key] in out:e.append(f"{label}[{n}].{key}: duplicate {x[key]}")
        out.add(x[key])
    return out

def links(values:Any,known:set[str],label:str,e:list[str],nonempty:bool=True)->None:
    if not isinstance(values,list):e.append(f"{label}: expected list");return
    if nonempty and not values:e.append(f"{label}: non-empty list required")
    for v in values:
        if v not in known:e.append(f"{label}: unknown {v}")

def check_spec(t:str,i:str,s:Any,e:list[str])->set[str]:
    p=cpath(t,i); label=str(p.relative_to(ROOT))
    if not isinstance(s,dict):e.append(f"{label}: expected object");return set()
    if (s.get("artifact_type"),s.get("schema_version"),s.get("scope_type"),s.get("scope_id"))!=("canonical_spec","1.1",t,i):
        e.append(f"{label}: artifact/schema/scope mismatch")
    registry=refs(s,label,e)
    rs,us,ss,ms=(ids(s.get(k), "id", f"{label}.{k}", e) for k in ("requirements","use_cases","acceptance_scenarios","state_machines"))
    rb={x.get("id"):x for x in s.get("requirements",[]) if isinstance(x,dict)}
    ub={x.get("id"):x for x in s.get("use_cases",[]) if isinstance(x,dict)}
    sb={x.get("id"):x for x in s.get("acceptance_scenarios",[]) if isinstance(x,dict)}
    mb={x.get("id"):x for x in s.get("state_machines",[]) if isinstance(x,dict)}

    for n,r in enumerate(s.get("requirements",[])):
        q=f"{label}.requirements[{n}]"
        if not isinstance(r,dict):continue
        if not isinstance(r.get("id"),str) or not RID.fullmatch(r["id"]):e.append(f"{q}.id: invalid Requirement ID")
        if r.get("status") not in {"baseline","frozen","designing","deferred","superseded"}:e.append(f"{q}.status: invalid")
        if not isinstance(r.get("statement"),str) or not r["statement"].strip():e.append(f"{q}.statement: required")
        for f in ("authority_refs","contract_refs"):
            a=r.get(f)
            if not isinstance(a,list) or not a:e.append(f"{q}.{f}: non-empty list required")
            else:
                for z,v in enumerate(a):check_ref(v,registry,f"{q}.{f}[{z}]",e)
        links(r.get("use_case_ids"),us,f"{q}.use_case_ids",e)
        links(r.get("acceptance_scenario_ids"),ss,f"{q}.acceptance_scenario_ids",e)
        links(r.get("state_machine_ids"),ms,f"{q}.state_machine_ids",e,False)

    for n,u in enumerate(s.get("use_cases",[])):
        q=f"{label}.use_cases[{n}]"
        if not isinstance(u,dict):continue
        for f in ("name","actor"):
            if not isinstance(u.get(f),str) or not u[f].strip():e.append(f"{q}.{f}: required")
        links(u.get("requirement_ids"),rs,f"{q}.requirement_ids",e)
        a=u.get("contract_refs")
        if not isinstance(a,list) or not a:e.append(f"{q}.contract_refs: non-empty list required")
        else:
            for z,v in enumerate(a):check_ref(v,registry,f"{q}.contract_refs[{z}]",e)

    for n,a in enumerate(s.get("acceptance_scenarios",[])):
        q=f"{label}.acceptance_scenarios[{n}]"
        if not isinstance(a,dict):continue
        links(a.get("requirement_ids"),rs,f"{q}.requirement_ids",e)
        links(a.get("use_case_ids"),us,f"{q}.use_case_ids",e)
        for f in ("given","when","then"):
            if not isinstance(a.get(f),str) or not a[f].strip():e.append(f"{q}.{f}: required")

    for n,m in enumerate(s.get("state_machines",[])):
        q=f"{label}.state_machines[{n}]"
        if not isinstance(m,dict):continue
        st=m.get("states")
        if not isinstance(st,list) or not st:e.append(f"{q}.states: non-empty list required");st=[]
        if m.get("initial_state") not in st:e.append(f"{q}.initial_state: undeclared")
        if not isinstance(m.get("terminal_states"),list) or any(x not in st for x in m.get("terminal_states",[])):e.append(f"{q}.terminal_states: invalid")
        tr=m.get("transitions")
        if not isinstance(tr,list) or not tr:e.append(f"{q}.transitions: non-empty list required")
        else:
            for z,x in enumerate(tr):
                if not isinstance(x,dict) or x.get("from") not in st or x.get("to") not in st or not isinstance(x.get("guard"),str) or not x.get("guard","").strip():
                    e.append(f"{q}.transitions[{z}]: invalid from/to/guard")
        links(m.get("requirement_ids"),rs,f"{q}.requirement_ids",e)

    for rid,r in rb.items():
        for uid in r.get("use_case_ids",[]):
            if rid not in ub.get(uid,{}).get("requirement_ids",[]):e.append(f"{label}: {rid}->{uid} not bidirectional")
        for sid in r.get("acceptance_scenario_ids",[]):
            if rid not in sb.get(sid,{}).get("requirement_ids",[]):e.append(f"{label}: {rid}->{sid} not bidirectional")
        for mid in r.get("state_machine_ids",[]):
            if rid not in mb.get(mid,{}).get("requirement_ids",[]):e.append(f"{label}: {rid}->{mid} not bidirectional")
    return rs

def check_evidence(t:str,i:str,source:Path,rs:set[str],ev:Any,e:list[str],required:bool)->None:
    p=epath(t,i);label=str(p.relative_to(ROOT))
    if ev is None:
        if required:e.append(f"{label}: required for --require-evidence")
        return
    if not isinstance(ev,dict):e.append(f"{label}: expected object");return
    if (ev.get("artifact_type"),ev.get("schema_version"),ev.get("scope_type"),ev.get("scope_id"))!=("derived_evidence","1.1",t,i):e.append(f"{label}: artifact/schema/scope mismatch")
    rel=str(source.relative_to(ROOT)).replace("\\","/")
    if ev.get("source_spec")!=rel:e.append(f"{label}.source_spec: mismatch")
    if ev.get("source_spec_sha256")!=hashlib.sha256(source.read_bytes()).hexdigest():e.append(f"{label}.source_spec_sha256: SPEC_DRIFT")
    covered:set[str]=set();checks:set[str]=set()
    for n,c in enumerate(ev.get("gate_checks",[]) if isinstance(ev.get("gate_checks"),list) else []):
        if not isinstance(c,dict) or not isinstance(c.get("id"),str):e.append(f"{label}.gate_checks[{n}]: invalid");continue
        checks.add(c["id"])
        if c.get("exit_code")!=0:e.append(f"{label}.gate_checks[{n}].exit_code: must be 0")
        for f in ("command","commit","artifact"):
            if not isinstance(c.get(f),str) or not c[f].strip():e.append(f"{label}.gate_checks[{n}].{f}: required")
    for n,x in enumerate(ev.get("requirements",[]) if isinstance(ev.get("requirements"),list) else []):
        q=f"{label}.requirements[{n}]"
        if not isinstance(x,dict) or x.get("id") not in rs:e.append(f"{q}.id: unknown");continue
        covered.add(x["id"])
        for f in ("implementation_refs","test_refs"):
            a=x.get(f)
            if not isinstance(a,list) or not a:e.append(f"{q}.{f}: non-empty list required")
            else:
                for z,v in enumerate(a):check_ref(v,{},f"{q}.{f}[{z}]",e,False)
        if not isinstance(x.get("check_ids"),list) or not x["check_ids"]:e.append(f"{q}.check_ids: required")
        else:
            for c in x["check_ids"]:
                if c not in checks:e.append(f"{q}.check_ids: unknown {c}")
    if required and covered!=rs:e.append(f"{label}: evidence coverage mismatch; missing={sorted(rs-covered)}")

def registry(e:list[str])->list[tuple[str,str]]:
    x=load(SPECS/"index.json",e)
    if not isinstance(x,dict):return []
    if x.get("schema_version")=="1.1":
        a=x.get("adopted_scopes")
        if not isinstance(a,list):e.append("specs/index.json: adopted_scopes must be list");return []
        out=[]
        for n,v in enumerate(a):
            if not isinstance(v,dict) or v.get("scope_type") not in SCOPE_DIR or not isinstance(v.get("scope_id"),str) or not SID.fullmatch(v["scope_id"]):
                e.append(f"specs/index.json.adopted_scopes[{n}]: invalid");continue
            out.append((v["scope_type"],v["scope_id"]))
    elif x.get("schema_version")=="1.0":
        a=x.get("adopted_domains")
        if not isinstance(a,list) or not all(isinstance(v,str) and SID.fullmatch(v) for v in a):e.append("specs/index.json: invalid legacy adopted_domains");return []
        out=[("domain",v) for v in a]
    else:e.append("specs/index.json: unsupported schema_version");return []
    if len(out)!=len(set(out)):e.append("specs/index.json: duplicate adopted scope")
    return out

def main()->int:
    ap=argparse.ArgumentParser();ap.add_argument("--scope");ap.add_argument("--domain");ap.add_argument("--require-evidence",action="store_true");a=ap.parse_args()
    if a.scope and a.domain:ap.error("use either --scope or --domain")
    e:list[str]=[];ad=registry(e)
    if a.scope:
        try:t,i=a.scope.split(":",1)
        except ValueError:ap.error("--scope must be type:id")
        if t not in SCOPE_DIR or not SID.fullmatch(i):ap.error("--scope must be domain|feature|system:<lowercase-id>")
        sel=[(t,i)]
    elif a.domain:
        if not SID.fullmatch(a.domain):ap.error("--domain requires lowercase id")
        sel=[("domain",a.domain)]
    else:sel=ad
    for x in sel:
        if x not in ad:e.append(f"specs/index.json: requested scope not adopted: {x[0]}:{x[1]}")
    for t,i in sel:
        p=cpath(t,i)
        if not p.is_file():e.append(f"{p.relative_to(ROOT)}: missing canonical spec");continue
        rs=check_spec(t,i,load(p,e),e)
        ep=epath(t,i);ev=load(ep,e) if ep.is_file() else None
        check_evidence(t,i,p,rs,ev,e,a.require_evidence)
    if e:
        print("EXECUTABLE_SPEC_CHECK = FAIL")
        for x in e:print("  x",x)
        return 1
    print("EXECUTABLE_SPEC_CHECK = PASS");print(f"adopted scopes checked: {len(sel)}")
    if not sel:print("coverage: no existing scope is claimed as adopted")
    return 0

if __name__=="__main__":sys.exit(main())
