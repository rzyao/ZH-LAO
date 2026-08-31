#!/usr/bin/env python3
from __future__ import annotations
import argparse,json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
REGISTRY=ROOT/'docs/docs/development/workflow/AI_STAGE_REGISTRY.json'
INVENTORY=ROOT/'docs/docs/development/workflow/FEATURE_INVENTORY.json'
OUTPUT=ROOT/'docs/docs/development/DOMAIN_LIFECYCLE_MATRIX.md'
FEATURES_DIR=ROOT/'docs/docs/features'

LANES=['design','backend','admin','mobile','integration','acceptance']
STATUSES={'done','ready','active','todo','blocked','recovery','deferred','na'}
PORTFOLIO={'active','planned','deferred','unresolved'}
INVENTORY_COLUMNS=['id','label','parent','primary_domain','participating_domains','portfolio_status','surfaces','decision_blocker','delivered_lanes']
REQUIRED_MARKERS=[
    "import registry from './workflow/AI_STAGE_REGISTRY.json'",
    "import inventory from './workflow/FEATURE_INVENTORY.json'",
    '<table class="ai-stage-table">',
    'v-for="obj in objects"',
    "deferred: ['⏸', 'deferred']",
    "const featureDesignHref = (featureId) => `/features/${featureId}/`",
    '— 不适用'
]

def parse_stage(v):
    if not isinstance(v,list) or len(v)<3 or len(v)>5:
        raise ValueError(f'invalid stage tuple: {v!r}')
    d={'id':v[0],'label':v[1],'status':v[2]}
    if len(v)>=4 and v[3]: d['href']=v[3]
    if len(v)==5 and v[4]: d['blocked_by']=v[4]
    return d

def validate_registry(data):
    if data.get('version')!=1:
        raise ValueError('AI_STAGE_REGISTRY version must be 1')
    if data.get('lanes')!=LANES:
        raise ValueError(f'lanes must be exactly {LANES}')
    ids=set(); parent_ids=set(); domains=set(); ready=0; detailed_features=set()
    for obj in data.get('objects',[]):
        oid=obj.get('id'); kind=obj.get('kind')
        if not oid or oid in ids:
            raise ValueError(f'duplicate/empty object id: {oid!r}')
        if kind not in {'system','domain','feature'}:
            raise ValueError(f'invalid object kind: {kind!r}')
        ids.add(oid)
        if kind in {'system','domain'}: parent_ids.add(oid)
        if kind=='domain': domains.add(oid)
        if kind=='feature': detailed_features.add(oid)
        for lane in LANES:
            for raw in obj.get(lane,[]):
                st=parse_stage(raw)
                if st['status'] not in STATUSES:
                    raise ValueError(f"invalid status: {st['status']}")
                if st['status']=='blocked' and not st.get('blocked_by'):
                    raise ValueError(f"blocked stage missing blocked_by: {st['id']}")
                ready += st['status']=='ready'
        nxt=parse_stage(obj['next'])
        if nxt['status'] not in STATUSES:
            raise ValueError(f"invalid next status: {nxt['status']}")
        if nxt['status']=='blocked' and not nxt.get('blocked_by'):
            raise ValueError(f"blocked next missing blocked_by: {nxt['id']}")
    if data.get('snapshot_status')=='grounded' and ready==0:
        raise ValueError('grounded registry has no READY stage')
    return parent_ids,domains,detailed_features,ready

def validate_inventory(data,parent_ids,domains,detailed_features):
    if data.get('version')!=1:
        raise ValueError('FEATURE_INVENTORY version must be 1')
    if data.get('columns')!=INVENTORY_COLUMNS:
        raise ValueError(f'inventory columns must be exactly {INVENTORY_COLUMNS}')
    ids=set(); counts={k:0 for k in PORTFOLIO}
    for row in data.get('features',[]):
        if not isinstance(row,list) or len(row)!=len(INVENTORY_COLUMNS):
            raise ValueError(f'invalid feature row: {row!r}')
        f=dict(zip(INVENTORY_COLUMNS,row))
        fid=f['id']
        if not fid or fid in ids:
            raise ValueError(f'duplicate/empty feature id: {fid!r}')
        ids.add(fid)
        if f['parent'] not in parent_ids:
            raise ValueError(f"feature {fid} parent is unknown: {f['parent']!r}")
        if f['primary_domain'] is not None and f['primary_domain'] not in domains:
            raise ValueError(f"feature {fid} primary_domain is unknown: {f['primary_domain']!r}")
        for p in f['participating_domains']:
            if p not in domains:
                raise ValueError(f'feature {fid} has unknown participating domain: {p!r}')
        if f['portfolio_status'] not in PORTFOLIO:
            raise ValueError(f"feature {fid} invalid portfolio_status: {f['portfolio_status']!r}")
        counts[f['portfolio_status']]+=1
        for surface in f['surfaces']:
            if surface not in {'admin','mobile','integration','acceptance'}:
                raise ValueError(f'feature {fid} invalid surface: {surface!r}')
        for lane in f['delivered_lanes']:
            if lane not in LANES:
                raise ValueError(f'feature {fid} invalid delivered lane: {lane!r}')
        if f['portfolio_status']=='unresolved' and not f['decision_blocker']:
            raise ValueError(f'unresolved feature {fid} must declare decision_blocker')
    missing=detailed_features-ids
    if missing:
        raise ValueError(f'detailed Stage Registry features missing from inventory: {sorted(missing)}')
    return ids,counts

def validate_renderer():
    text=OUTPUT.read_text(encoding='utf-8') if OUTPUT.exists() else ''
    missing=[m for m in REQUIRED_MARKERS if m not in text]
    if missing:
        raise ValueError(f'matrix renderer missing markers: {missing}')

def write_missing_feature_pages(inventory):
    columns=inventory['columns']
    created=[]
    for row in inventory['features']:
        feature=dict(zip(columns,row))
        path=FEATURES_DIR/feature['id']/'index.md'
        if path.exists():
            continue
        primary=feature['primary_domain']
        primary_link=f'[{primary}](/domains/{primary}/)' if primary else '未指定'
        participating=', '.join(feature['participating_domains']) or '无'
        surfaces=', '.join(feature['surfaces']) or '无'
        blocker=(f"\n## 待决事项\n\n`{feature['decision_blocker']}`\n" if feature['decision_blocker'] else '')
        design_status='已交付' if 'design' in feature['delivered_lanes'] else '待设计'
        page=(
            f"---\nstatus: {feature['portfolio_status']}\nfeature_id: {feature['id']}\ngenerated_from_feature_inventory: true\n---\n\n"
            f"# {feature['label']}\n\n"
            f"这是 `{feature['id']}` 的功能设计入口。领域规则、数据模型与跨领域边界仍以关联 Domain 文档为准。\n\n"
            f"## 功能范围\n\n| 项目 | 内容 |\n| --- | --- |\n| 主要领域 | {primary_link} |\n| 参与领域 | {participating} |\n| 涉及端 | {surfaces} |\n| 当前状态 | {feature['portfolio_status']} |\n| 设计交付 | {design_status} |\n"
            f"{blocker}\n## 设计入口\n\n从主要领域开始确认业务边界、生命周期与契约；需要跨领域协作时，再补充本功能的端到端交付设计。\n"
        )
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(page,encoding='utf-8')
        created.append(feature['id'])
    return created

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--check',action='store_true')
    p.add_argument('--write',action='store_true')
    p.add_argument('--write-missing-feature-pages',action='store_true')
    a=p.parse_args()

    registry=json.loads(REGISTRY.read_text(encoding='utf-8'))
    inventory=json.loads(INVENTORY.read_text(encoding='utf-8'))
    if a.write_missing_feature_pages:
        created=write_missing_feature_pages(inventory)
        print(f'Feature pages: created {len(created)} page(s)')
        return 0
    parent_ids,domains,detailed,ready=validate_registry(registry)
    feature_ids,counts=validate_inventory(inventory,parent_ids,domains,detailed)
    validate_renderer()

    if a.write:
        print('AI stage matrix uses live Registry + Feature Inventory rendering; no static row rewrite required.')
    counts_text=', '.join(f'{key}={counts[key]}' for key in ['active','planned','deferred','unresolved'])
    print(f"AI stage matrix: PASS ({registry['snapshot_status']}, {len(feature_ids)} features, {counts_text}, {ready} READY references)")
    return 0

if __name__=='__main__':
    raise SystemExit(main())
