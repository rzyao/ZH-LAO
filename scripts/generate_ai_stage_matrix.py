#!/usr/bin/env python3
"""Refresh and validate the Matrix derived from canonical Feature Pages."""
from __future__ import annotations
import argparse
import json

from validate_feature_pages import OUTPUT, scan

REQUIRED_MARKERS = [
    "import { lanes, laneLabels, featureHref, features, statusMeta } from './workflow/feature-model.mjs'",
    'v-for="feature in features"',
    'featureHref(feature.id, lane)'
]
MATRIX = OUTPUT.parent.parent / 'DOMAIN_LIFECYCLE_MATRIX.md'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true', help='refresh only the derived Feature Page index')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    index = scan()
    rendered = json.dumps(index, ensure_ascii=False, indent=2) + '\n'
    if args.write:
        OUTPUT.write_text(rendered, encoding='utf-8')
    elif not OUTPUT.exists() or OUTPUT.read_text(encoding='utf-8') != rendered:
        raise ValueError('FEATURE_PAGE_INDEX is stale; run generate_ai_stage_matrix.py --write')
    matrix = MATRIX.read_text(encoding='utf-8')
    missing = [marker for marker in REQUIRED_MARKERS if marker not in matrix]
    if missing:
        raise ValueError(f'Matrix renderer is not Feature Page derived: {missing}')
    print(f"Feature Matrix: PASS ({len(index['features'])} Feature Pages, six Lane anchors each)")

if __name__ == '__main__':
    main()
