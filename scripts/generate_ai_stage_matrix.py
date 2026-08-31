#!/usr/bin/env python3
from __future__ import annotations
import argparse,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
REGISTRY=ROOT/'docs/docs/development/workflow/AI_STAGE_REGISTRY.json'
OUTPUT=ROOT/'docs/docs/development/DOMAIN_LIFECYCLE_MATRIX.md'
LANES=['design','backend','admin','mobile','integration','acceptance']
STATUSES={'done','ready','active','todo','blocked','recovery','na'}
REQUIRED_MARKERS=["import registry from './workflow/AI_STAGE_REGISTRY.json'",'<table class="ai-stage-table">','v-for="obj in registry.objects"','v-for="[lane] in lanes"']
def parse_stage(v):
    if not isinstance(v,list) or len(v)<3 or len(v)>5: raise ValueError(f'invalid stage tuple: {v!r}')
    d={'id':v[0],'label':v[1],'status':v[2]}
    if len(v)>=4 and v[3]: d['href']=v[3]
    if len(v)==5 and v[4]: d['blocked_by']=v[4]
    return d
def validate(data):
    if data.get('version')!=1: raise ValueError('AI_STAGE_REGISTRY version must be 1')
    if data.get('lanes')!=LANES: raise ValueError(f'lanes must be exactly {LANES}')
    ids=set(); domains=set(); ready=0
    for obj in data.get('objects',[]):
        oid=obj.get('id'); kind=obj.get('kind')
        if not oid or oid in ids: raise ValueError(f'duplicate/empty object id: {oid!r}')
        if kind not in {'system','domain','feature'}: raise ValueError(f'invalid object kind: {kind!r}')
        ids.add(oid)
        if kind=='domain': domains.add(oid)
        for lane in LANES:
            for raw in obj.get(lane,[]):
                st=parse_stage(raw)
                if st['status'] not in STATUSES: raise ValueError(f"invalid status: {st['status']}")
                if st['status']=='blocked' and not st.get('blocked_by'): raise ValueError(f"blocked stage missing blocked_by: {st['id']}")
                ready += st['status']=='ready'
        nxt=parse_stage(obj['next'])
        if nxt['status'] not in STATUSES: raise ValueError(f"invalid next status: {nxt['status']}")
    for obj in data.get('objects',[]):
        if obj['kind']=='feature' and obj.get('parent') not in domains: raise ValueError(f"feature {obj['id']} parent must be an existing domain")
    if data.get('snapshot_status')=='grounded' and ready==0: raise ValueError('grounded registry has no READY stage')
def validate_renderer():
    text=OUTPUT.read_text(encoding='utf-8') if OUTPUT.exists() else ''
    missing=[m for m in REQUIRED_MARKERS if m not in text]
    if missing: raise ValueError(f'matrix renderer missing markers: {missing}')
def main():
    p=argparse.ArgumentParser(); p.add_argument('--check',action='store_true'); p.add_argument('--write',action='store_true'); a=p.parse_args()
    data=json.loads(REGISTRY.read_text(encoding='utf-8')); validate(data); validate_renderer()
    if a.write: print('AI stage matrix uses live Registry rendering; no static row rewrite required.')
    print(f"AI stage matrix: PASS ({data['snapshot_status']}, {len(data['objects'])} objects)")
    return 0
if __name__=='__main__': raise SystemExit(main())
