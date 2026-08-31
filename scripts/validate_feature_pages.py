#!/usr/bin/env python3
"""Validate canonical Feature Pages and emit their derived matrix index."""
from __future__ import annotations
import argparse
import json
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
FEATURES_DIR = ROOT / 'docs/docs/features'
INVENTORY = ROOT / 'docs/docs/development/workflow/FEATURE_INVENTORY.json'
OUTPUT = ROOT / 'docs/docs/development/workflow/FEATURE_PAGE_INDEX.json'
MOBILE_DIR = ROOT / 'docs/docs/mobile'
ADMIN_DIR = ROOT / 'docs/docs/admin'
DOMAINS_DIR = ROOT / 'docs/docs/domains'
LANES = ['design', 'backend', 'admin', 'mobile', 'integration', 'acceptance']
HEADINGS = {'design': '设计', 'backend': 'Backend', 'admin': 'Admin', 'mobile': 'Mobile', 'integration': '集成', 'acceptance': '验收'}
STATUSES = {'todo', 'active', 'blocked', 'done', 'na'}

def frontmatter(text, path):
    if not text.startswith('---\n'):
        raise ValueError(f'{path}: missing frontmatter')
    end = text.find('\n---', 4)
    if end < 0:
        raise ValueError(f'{path}: unterminated frontmatter')
    raw = text[4:end]
    data = yaml.safe_load(raw)
    if not isinstance(data, dict):
        raise ValueError(f'{path}: invalid frontmatter')
    return data

def page_ids(root):
    result = set()
    for path in root.rglob('*.md'):
        text = path.read_text(encoding='utf-8')
        if not text.startswith('---\n'):
            continue
        page_id = frontmatter(text, path).get('page_id')
        if page_id:
            result.add(page_id)
    return result

def canonical_domain(domain_id):
    path = DOMAINS_DIR / domain_id / 'index.md'
    if not path.exists():
        raise ValueError(f'missing canonical Domain page for {domain_id}: {path}')
    title = re.search(r'^#\s+(.+)$', path.read_text(encoding='utf-8'), re.MULTILINE)
    if not title:
        raise ValueError(f'{path}: missing Domain title')
    return {'id': domain_id, 'title': title.group(1).strip(), 'href': f'/domains/{domain_id}/'}

def scan():
    inventory = json.loads(INVENTORY.read_text(encoding='utf-8'))
    expected = {row[0] for row in inventory['features']}
    mobile_page_ids = page_ids(MOBILE_DIR)
    admin_page_ids = page_ids(ADMIN_DIR)
    records = []
    seen = set()
    domains = {}
    for path in FEATURES_DIR.glob('*/index.md'):
        text = path.read_text(encoding='utf-8')
        data = frontmatter(text, path)
        feature_id = data.get('feature_id')
        if not isinstance(feature_id, str) or feature_id in seen:
            raise ValueError(f'{path}: missing or duplicate feature_id')
        seen.add(feature_id)
        if feature_id not in expected:
            raise ValueError(f'{path}: feature_id is absent from FEATURE_INVENTORY: {feature_id}')
        if not isinstance(data.get('title'), str) or not data['title'].strip():
            raise ValueError(f'{path}: missing title')
        if not isinstance(data.get('domain'), list):
            raise ValueError(f'{path}: domain must be a list')
        for domain_id in data['domain']:
            if not isinstance(domain_id, str):
                raise ValueError(f'{path}: domain IDs must be strings')
            domains.setdefault(domain_id, canonical_domain(domain_id))
        status = data.get('status')
        if not isinstance(status, dict) or list(status) != LANES:
            raise ValueError(f'{path}: status must define exactly {LANES} in order')
        invalid = {lane: value for lane, value in status.items() if value not in STATUSES}
        if invalid:
            raise ValueError(f'{path}: invalid lane status: {invalid}')
        blocks = data.get('blocks', {})
        if not isinstance(blocks, dict):
            raise ValueError(f'{path}: blocks must be a mapping')
        for lane, value in status.items():
            if value == 'blocked' and not blocks.get(lane):
                raise ValueError(f'{path}: blocked {lane} needs blocks.{lane}')
            if f'## {HEADINGS[lane]}' not in text:
                raise ValueError(f'{path}: missing section {HEADINGS[lane]}')
        for page_id in data.get('mobile_pages', []):
            if page_id not in mobile_page_ids:
                raise ValueError(f'{path}: missing Mobile page {page_id}')
        for page_id in data.get('admin_pages', []):
            if page_id not in admin_page_ids:
                raise ValueError(f'{path}: missing Admin page {page_id}')
        records.append({
            'id': feature_id, 'title': data['title'], 'domain': data['domain'],
            'status': {lane: status[lane] for lane in LANES},
            'mobile_pages': data.get('mobile_pages', []), 'admin_pages': data.get('admin_pages', [])
        })
    if seen != expected:
        raise ValueError(f'Feature Page coverage mismatch; missing={sorted(expected-seen)}, extra={sorted(seen-expected)}')
    return {
        'version': 1,
        'lanes': LANES,
        'domains': sorted(domains.values(), key=lambda domain: domain['id']),
        'features': sorted(records, key=lambda record: (record['domain'][0] if record['domain'] else 'system', record['title']))
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    index = scan()
    rendered = json.dumps(index, ensure_ascii=False, indent=2) + '\n'
    if args.write:
        OUTPUT.write_text(rendered, encoding='utf-8')
    elif not OUTPUT.exists() or OUTPUT.read_text(encoding='utf-8') != rendered:
        raise ValueError('FEATURE_PAGE_INDEX is stale; run validate_feature_pages.py --write')
    print(f"Feature Pages: PASS ({len(index['features'])} pages, six lanes each)")

if __name__ == '__main__':
    main()
