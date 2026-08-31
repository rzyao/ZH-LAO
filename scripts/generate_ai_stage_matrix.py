#!/usr/bin/env python3
"""Refresh Feature-derived matrix data while enforcing the frozen matrix UI."""
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
    'ui_contract: tree-v1-frozen',
    '<thead><tr><th>对象</th>',
    "object.kind === 'feature' ? '↳ ◇ ' : '◆ '",
    "['object-cell', object.kind]",
    "['node-status', `node-${display(object, lane).status}`]",
    '.object-cell.feature{padding-left:22px;font-weight:600}',
    '.node-done{color:#166534',
    '.node-ready{color:#1d4ed8',
    '.node-active{color:#6d28d9',
    '.node-todo{color:#4b5563',
    '.node-blocked{color:#b91c1c',
    '.node-deferred{color:#92400e',
    '.node-na{color:#6b7280'
]

LINK_CONTRACT = [
    'objectHref(object)',
    'nodeHref(object.id, lane)'
]

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
        raise ValueError(f'DOMAIN_LIFECYCLE_MATRIX frozen UI changed: {missing_ui}')
    missing_links = [marker for marker in LINK_CONTRACT if marker not in matrix]
    if missing_links:
        raise ValueError(f'DOMAIN_LIFECYCLE_MATRIX Feature links changed: {missing_links}')

    model = NODE_MODEL.read_text(encoding='utf-8')
    if "import featureIndex from './FEATURE_PAGE_INDEX.json'" not in model:
        raise ValueError('Matrix Feature rows are not sourced from Feature Pages')
    if '/development/nodes/' in matrix or '/development/nodes/' in model:
        raise ValueError('Matrix still links to generated Node Detail pages')
    if NODES_DIR.exists():
        raise ValueError('generated Development Node pages still exist')

    print(f"Feature Matrix: PASS ({len(index['features'])} Feature Pages; frozen tree UI; zero Node Detail pages)")

if __name__ == '__main__':
    main()
