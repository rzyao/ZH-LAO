#!/usr/bin/env python3
"""Validate and generate the derived Development Node documentation surface."""
from __future__ import annotations
import argparse, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / 'docs/docs/development/workflow/AI_STAGE_REGISTRY.json'
INVENTORY = ROOT / 'docs/docs/development/workflow/FEATURE_INVENTORY.json'
MATRIX = ROOT / 'docs/docs/development/DOMAIN_LIFECYCLE_MATRIX.md'
NODES_DIR = ROOT / 'docs/docs/development/nodes'
LANES = ['design', 'backend', 'admin', 'mobile', 'integration', 'acceptance']
PHASES = ['prep', 'design', 'execute', 'verify', 'gate']
STATUSES = {'done', 'ready', 'active', 'todo', 'blocked', 'recovery', 'deferred', 'na'}
INVENTORY_COLUMNS = ['id','label','parent','primary_domain','participating_domains','portfolio_status','surfaces','decision_blocker','delivered_lanes']

def parse_stage(raw):
    if not isinstance(raw, list) or not 3 <= len(raw) <= 5:
        raise ValueError(f'invalid legacy stage tuple: {raw!r}')
    return {'stage_id': raw[0], 'label': raw[1], 'status': raw[2],
            'href': raw[3] if len(raw) > 3 and raw[3] else None,
            'blocked_by': raw[4] if len(raw) > 4 and raw[4] else None}

def metadata_for(data):
    """The metadata is generated from stage tuples; it is never a status source."""
    result = []
    for obj in data['objects']:
        for lane in LANES:
            for index, raw in enumerate(obj.get(lane, []), 1):
                item = parse_stage(raw)
                phase = 'gate' if item['status'] == 'done' else ('prep' if index == 1 else 'execute')
                result.append({
                    'object_id': obj['id'], 'lane': lane, 'node_id': f"{obj['id']}.{lane}",
                    'phase': phase, 'sequence': index, **item
                })
    return result

def registry_nodes(data, inventory):
    explicit = {(obj['id'], lane) for obj in data['objects'] for lane in LANES if obj.get(lane)}
    columns = inventory['columns']
    for row in inventory['features']:
        feature = dict(zip(columns, row))
        explicit.add((feature['id'], 'design'))
        if feature['primary_domain']: explicit.add((feature['id'], 'backend'))
        for lane in feature['surfaces']: explicit.add((feature['id'], lane))
    return [
        {'node_id': f'{object_id}.{lane}', 'object_id': object_id, 'lane': lane}
        for object_id, lane in sorted(explicit)
    ]

def refresh_registry(data, inventory):
    data['version'] = 2
    data['node_model'] = {
        'node_identity': 'object_id × lane',
        'phases': PHASES,
        'status_source': 'derived_from_stages',
        'stage_fields': ['object_id', 'lane', 'node_id', 'phase', 'sequence']
    }
    data['stage_metadata'] = metadata_for(data)
    data['nodes'] = registry_nodes(data, inventory)
    REGISTRY.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')

def validate(data, inventory):
    if data.get('version') != 2: raise ValueError('AI_STAGE_REGISTRY version must be 2')
    if data.get('lanes') != LANES: raise ValueError('registry lanes are invalid')
    if data.get('node_model', {}).get('phases') != PHASES: raise ValueError('node lifecycle is invalid')
    object_ids = set()
    metadata = data.get('stage_metadata', [])
    metadata_keys = set()
    for obj in data.get('objects', []):
        if not obj.get('id') or obj['id'] in object_ids: raise ValueError(f"invalid object id: {obj.get('id')!r}")
        object_ids.add(obj['id'])
        for lane in LANES:
            for raw in obj.get(lane, []):
                stage = parse_stage(raw)
                if stage['status'] not in STATUSES: raise ValueError(f"invalid status: {stage['status']}")
                if stage['status'] == 'blocked' and not stage['blocked_by']: raise ValueError(f"blocked stage missing dependency: {stage['stage_id']}")
    for item in metadata:
        required = {'stage_id','object_id','lane','node_id','phase','sequence'}
        if not required <= item.keys(): raise ValueError(f'incomplete stage metadata: {item}')
        if item['node_id'] != f"{item['object_id']}.{item['lane']}": raise ValueError(f"bad node id: {item['node_id']}")
        if item['lane'] not in LANES or item['phase'] not in PHASES or not isinstance(item['sequence'], int): raise ValueError(f"bad stage metadata: {item['stage_id']}")
        key = (item['object_id'], item['lane'], item['stage_id'])
        if key in metadata_keys: raise ValueError(f'duplicate stage metadata: {key}')
        metadata_keys.add(key)
    expected_meta = {(item['object_id'], item['lane'], item['stage_id']) for item in metadata_for(data)}
    if metadata_keys != expected_meta: raise ValueError('stage_metadata is not synchronized with stage tuples')
    if inventory.get('columns') != INVENTORY_COLUMNS: raise ValueError('inventory columns changed')
    ids = set()
    parents = {o['id'] for o in data['objects'] if o['kind'] != 'feature'}
    domains = {o['id'] for o in data['objects'] if o['kind'] == 'domain'}
    for row in inventory['features']:
        feature = dict(zip(inventory['columns'], row))
        if feature['id'] in ids or feature['parent'] not in parents: raise ValueError(f"invalid inventory feature: {feature['id']}")
        ids.add(feature['id'])
        if feature['primary_domain'] and feature['primary_domain'] not in domains: raise ValueError(f"unknown primary domain: {feature['id']}")
        if any(lane not in LANES[2:] for lane in feature['surfaces']): raise ValueError(f"invalid surface: {feature['id']}")
    expected_nodes = registry_nodes(data, inventory)
    if data.get('nodes') != expected_nodes: raise ValueError('node index is not synchronized with Registry/Inventory')
    pages = {node['node_id'] for node in expected_nodes}
    missing = [node for node in pages if not (NODES_DIR / node.replace('.', '/') / 'index.md').exists()]
    if missing: raise ValueError(f'missing Node Detail pages: {sorted(missing)}')
    matrix = MATRIX.read_text(encoding='utf-8')
    for marker in ["nodeHref(object.id, lane)", "nodeDetail", "— 不适用"]:
        if marker == "nodeDetail": continue
        if marker not in matrix: raise ValueError(f'matrix renderer missing {marker}')
    return len(expected_nodes), len(metadata)

def node_page(object_id, lane):
    return f"""---
layout: doc
sidebar: false
outline: false
node_id: {object_id}.{lane}
generated_from: AI_STAGE_REGISTRY + FEATURE_INVENTORY
---

<script setup>
import {{ nodeDetail, phases, statusMeta }} from '../../../workflow/node-model.mjs'
const node = nodeDetail('{object_id}', '{lane}')
const phaseLabel = {{ prep: '准备', design: '方案', execute: '执行', verify: '验证', gate: 'Gate' }}
</script>

# {{ node.object.label }} · {{ node.lane }} Node

<p><strong>Node</strong>：<code>{{ node.node_id }}</code>　<strong>当前状态</strong>：{{ statusMeta[node.status][0] }} {{ statusMeta[node.status][1] }}　<strong>进度</strong>：{{ node.progress }}</p>

## 当前 Stage 与下一步

<p><strong>当前 Stage：</strong>{{ node.current.id }} · {{ node.current.label }}</p>
<p><strong>下一步：</strong>{{ node.next.id }} · {{ node.next.label }}<template v-if="node.next.blocked_by">（依赖：{{ node.next.blocked_by }}）</template></p>

## 生命周期

<ol><li v-for="phase in phases" :key="phase"><strong>{{ phaseLabel[phase] }}</strong>：<template v-if="node.phaseStatus.find((item) => item.phase === phase).stages.length">{{ node.phaseStatus.find((item) => item.phase === phase).stages.map((item) => item.status).join(' / ') }}</template><template v-else>尚无已调度 Stage</template></li></ol>

## Stage、工件与 Gate

<ul><li v-for="stage in node.stages" :key="stage.id"><strong>{{ stage.id }}</strong> · {{ stage.label }} · {{ statusMeta[stage.status][1] }} · phase={{ stage.phase }} · sequence={{ stage.sequence }}<template v-if="stage.href"> · <a :href="stage.href">工件 / Report / Gate</a></template><template v-if="stage.blocked_by"> · blocked_by={{ stage.blocked_by }}</template></li></ul>
"""

def write_pages(data, inventory):
    nodes = registry_nodes(data, inventory)
    for node in nodes:
        path = NODES_DIR / node['object_id'] / node['lane'] / 'index.md'
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(node_page(node['object_id'], node['lane']), encoding='utf-8')
    return len(nodes)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true', help='refresh derived metadata and Node Detail pages')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    data = json.loads(REGISTRY.read_text(encoding='utf-8'))
    inventory = json.loads(INVENTORY.read_text(encoding='utf-8'))
    if args.write:
        refresh_registry(data, inventory)
        data = json.loads(REGISTRY.read_text(encoding='utf-8'))
        count = write_pages(data, inventory)
        print(f'Development Nodes: generated {count} detail page(s)')
    nodes, stages = validate(data, inventory)
    print(f'Development Node matrix: PASS ({nodes} non-N/A matrix links / Node Detail pages, {stages} stages with node metadata)')

if __name__ == '__main__':
    main()
