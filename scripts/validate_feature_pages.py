#!/usr/bin/env python3
"""Validate canonical Feature Pages and emit their derived index."""
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
STATUSES = {'todo', 'ready', 'active', 'blocked', 'done', 'na'}
PORTFOLIO_STATUSES = {'active', 'deferred', 'pending_decision'}
PORTFOLIO_TITLE_MARKERS = re.compile(r'(?:（延期）|\(延期\)|（待裁决）|\(待裁决\)|（待设计）|\(待设计\))')

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

def scan_surface_pages(root, kind, feature_ids, domain_ids):
    records = {}
    for path in root.rglob('*.md'):
        text = path.read_text(encoding='utf-8')
        if not text.startswith('---\n'):
            continue
        data = frontmatter(text, path)
        page_id = data.get('page_id')
        if not page_id:
            continue
        if page_id in records:
            raise ValueError(f'{path}: duplicate page_id {page_id}')
        if not isinstance(data.get('title'), str) or not isinstance(data.get('route'), str):
            raise ValueError(f'{path}: page title and route are required')
        if not isinstance(data.get('features'), list) or not data['features']:
            raise ValueError(f'{path}: at least one Feature reference is required')
        if set(data['features']) - feature_ids:
            raise ValueError(f"{path}: unknown Feature references {sorted(set(data['features'])-feature_ids)}")
        if not isinstance(data.get('domains'), list) or set(data['domains']) - domain_ids:
            raise ValueError(f'{path}: invalid Domain references')
        if data.get('status') not in STATUSES:
            raise ValueError(f'{path}: invalid page status {data.get("status")!r}')
        if kind == 'admin' and not isinstance(data.get('permissions'), list):
            raise ValueError(f'{path}: Admin permissions must be a list')
        required_headings = (
            ['页面目标', 'UI State 与操作', 'Backend API、权限与测试']
            if kind == 'admin'
            else ['页面目标', 'Navigation', 'UI State', 'API 与错误处理', '权限与测试']
        )
        missing_headings = [heading for heading in required_headings if f'## {heading}' not in text]
        if missing_headings:
            raise ValueError(f'{path}: missing {kind} page sections {missing_headings}')
        records[page_id] = {'features': data['features'], 'path': path}
    return records

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
    inventory_by_id = {row[0]: dict(zip(inventory['columns'], row)) for row in inventory['features']}
    system_parents = {'application-foundation', 'admin-foundation', 'mobile-foundation'}
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
        if PORTFOLIO_TITLE_MARKERS.search(data['title']):
            raise ValueError(f'{path}: portfolio status must not be embedded in title')
        portfolio_status = data.get('portfolio_status')
        if portfolio_status not in PORTFOLIO_STATUSES:
            raise ValueError(f'{path}: invalid portfolio_status {portfolio_status!r}')
        if not isinstance(data.get('domain'), list):
            raise ValueError(f'{path}: domain must be a list')
        inventory_feature = inventory_by_id[feature_id]
        if portfolio_status != inventory_feature.get('portfolio_status'):
            raise ValueError(
                f'{path}: portfolio_status does not match FEATURE_INVENTORY '
                f'({portfolio_status!r} != {inventory_feature.get("portfolio_status")!r})'
            )
        if not data['domain'] and inventory_feature['parent'] not in system_parents:
            raise ValueError(f'{path}: a Feature must reference at least one Domain unless it belongs to a System/Foundation parent')
        if data['domain'] and inventory_feature.get('primary_domain') and inventory_feature['primary_domain'] not in data['domain']:
            raise ValueError(f'{path}: primary_domain must be included in the Feature Page domain list')
        for domain_id in data['domain']:
            if not isinstance(domain_id, str):
                raise ValueError(f'{path}: domain IDs must be strings')
            domains.setdefault(domain_id, canonical_domain(domain_id))
        obsolete_keys = {'status', 'blocks', 'active_notes', 'evidence'} & set(data)
        if obsolete_keys:
            raise ValueError(f'{path}: obsolete fixed delivery-matrix metadata is forbidden: {sorted(obsolete_keys)}')
        delivery_evidence = data.get('delivery_evidence', [])
        delivery_notes = data.get('delivery_notes', [])
        if not isinstance(delivery_evidence, list) or not all(isinstance(item, str) for item in delivery_evidence):
            raise ValueError(f'{path}: delivery_evidence must be a list of strings')
        if not isinstance(delivery_notes, list) or not all(isinstance(item, str) for item in delivery_notes):
            raise ValueError(f'{path}: delivery_notes must be a list of strings')
        records.append({
            'id': feature_id, 'title': data['title'], 'domain': data['domain'],
            'portfolio_status': portfolio_status,
            'mobile_pages': data.get('mobile_pages', []), 'admin_pages': data.get('admin_pages', []),
            'decision_blocker': inventory_feature.get('decision_blocker'),
            'delivery_evidence': delivery_evidence,
            'delivery_notes': delivery_notes,
        })
    if seen != expected:
        raise ValueError(f'Feature Page coverage mismatch; missing={sorted(expected-seen)}, extra={sorted(seen-expected)}')
    mobile_pages = scan_surface_pages(MOBILE_DIR, 'mobile', seen, set(domains))
    admin_pages = scan_surface_pages(ADMIN_DIR, 'admin', seen, set(domains))
    duplicate_page_ids = set(mobile_pages) & set(admin_pages)
    if duplicate_page_ids:
        raise ValueError(f'page_id reused across Mobile/Admin: {sorted(duplicate_page_ids)}')
    for record in records:
        feature_id = record['id']
        expected_mobile = {page_id for page_id, page in mobile_pages.items() if feature_id in page['features']}
        expected_admin = {page_id for page_id, page in admin_pages.items() if feature_id in page['features']}
        if set(record['mobile_pages']) != expected_mobile:
            raise ValueError(f'{feature_id}: Mobile page references are not bidirectional')
        if set(record['admin_pages']) != expected_admin:
            raise ValueError(f'{feature_id}: Admin page references are not bidirectional')
    return {
        'version': 2,
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
    print(f"Feature Pages: PASS ({len(index['features'])} pages, Stage/Gate evidence model)")

if __name__ == '__main__':
    main()
