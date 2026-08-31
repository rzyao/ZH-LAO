#!/usr/bin/env python3
"""Refresh the Feature-derived matrix index and enforce its navigation contract."""
from __future__ import annotations
import argparse
import json
from pathlib import Path

from validate_feature_pages import OUTPUT, scan

ROOT = Path(__file__).resolve().parents[1]
MATRIX = ROOT / 'docs/docs/development/DOMAIN_LIFECYCLE_MATRIX.md'
NODE_MODEL = ROOT / 'docs/docs/development/workflow/node-model.mjs'
NODES_DIR = ROOT / 'docs/docs/development/nodes'

UI_CONTRACT = [
    'ui_contract: domain-feature-lane-v2',
    '<thead><tr><th>开发对象</th>',
    "object.kind === 'feature' ? 'Feature' : object.kind === 'domain' ? 'Domain' : 'System'",
    "['object-cell', object.kind]",
    "['node-status', `node-${display(object, lane).status}`]",
    '.object-cell.feature{padding-left:26px;font-weight:600}',
    '.object-cell.domain,.object-cell.system{font-weight:800',
    '.node-done{color:#166534',
    '.node-active{color:#6d28d9',
    '.node-todo{color:#4b5563',
    '.node-blocked{color:#b91c1c',
    '.node-na{color:#6b7280'
]

LINK_CONTRACT = [
    'objectHref(object)',
    'laneHref(object.id, lane)'
]

MODEL_LINK_CONTRACT = ['featureHref = (featureId, lane = null)']

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true', help='refresh the derived Feature Page index only')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()

    index = scan()
    rendered = json.dumps(index, ensure_ascii=False, indent=2) + '\n'
    if args.write:
        OUTPUT.write_text(rendered, encoding='utf-8')
    elif not OUTPUT.exists() or OUTPUT.read_text(encoding='utf-8') != rendered:
        raise ValueError('FEATURE_PAGE_INDEX is stale; run generate_ai_stage_matrix.py --write')

    matrix = MATRIX.read_text(encoding='utf-8')
    missing_ui = [marker for marker in UI_CONTRACT if marker not in matrix]
    if missing_ui:
        raise ValueError(f'DOMAIN_LIFECYCLE_MATRIX navigation UI changed: {missing_ui}')
    missing_links = [marker for marker in LINK_CONTRACT if marker not in matrix]
    if missing_links:
        raise ValueError(f'DOMAIN_LIFECYCLE_MATRIX Feature links changed: {missing_links}')

    model = NODE_MODEL.read_text(encoding='utf-8')
    if "import featureIndex from './FEATURE_PAGE_INDEX.json'" not in model:
        raise ValueError('Matrix Feature rows are not sourced from Feature Pages')
    missing_model_links = [marker for marker in MODEL_LINK_CONTRACT if marker not in model]
    if missing_model_links:
        raise ValueError(f'Feature Page link model changed: {missing_model_links}')
    if '/development/nodes/' in matrix or '/development/nodes/' in model:
        raise ValueError('Matrix still links to generated Node Detail pages')
    if any(marker in matrix for marker in ('node-ready', 'node-deferred', '⏸ 延期', '▶ 就绪')):
        raise ValueError('Matrix exposes Stage-level ready/deferred statuses')
    if NODES_DIR.exists():
        raise ValueError('generated Development Node pages still exist')

    print(f"Feature Matrix: PASS ({len(index['features'])} Feature Pages; Domain → Feature tree UI; zero Node Detail pages)")

if __name__ == '__main__':
    main()
