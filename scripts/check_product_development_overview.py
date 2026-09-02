#!/usr/bin/env python3
"""Check the generated human-facing product development overview.

This is intentionally a read-only audit. The canonical manifest and developer
Feature Page front matter generate the catalog; this checker prevents the two
summaries from drifting or silently losing a Feature ID.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import yaml

import build_developer_feature_catalog as builder


ROOT = builder.ROOT
CATALOG_PATH = builder.CATALOG_PATH
INDEX_PATH = builder.NEW_FEATURES / "index.md"
OVERVIEW_PATH = builder.DOCS / "developer" / "index.md"
REQUIRED_FRONTMATTER = {
    "feature_id",
    "title",
    "portfolio_status",
    "source_migration",
    "last_verified_at",
    "delivery_evidence",
}
REQUIRED_SECTIONS = {
    "value": ("## 用户价值与功能说明", "## 用户价值"),
    "users": ("## 使用者或受益者", "## 使用者与可观察流程"),
    "scope": ("## 范围与边界", "## 范围与非范围"),
    "systems": ("## 参与系统",),
    "layers": ("## 分层交付状态",),
    "evidence": ("## 证据",),
    "next": ("## 限制、阻塞与下一步", "## 来源冲突、限制与下一步"),
}


def parse_frontmatter(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError(f"missing front matter: {path}")
    end = text.find("\n---", 4)
    if end < 0:
        raise ValueError(f"unterminated front matter: {path}")
    return yaml.safe_load(text[4:end]) or {}, text[end + len("\n---") :].lstrip("\n")


def fail(message: str) -> None:
    raise AssertionError(message)


def main() -> int:
    try:
        if not CATALOG_PATH.is_file():
            fail(f"missing generated catalog: {CATALOG_PATH.relative_to(ROOT)}")
        if not INDEX_PATH.is_file():
            fail(f"missing generated index: {INDEX_PATH.relative_to(ROOT)}")
        if not OVERVIEW_PATH.is_file():
            fail(f"missing overview homepage: {OVERVIEW_PATH.relative_to(ROOT)}")

        records = builder.catalog_records()
        catalog = builder.build_catalog(records)
        actual_ids = [record["id"] for record in records]
        if len(records) != 103:
            fail(f"detail count is {len(records)}, expected 103")
        if len(set(actual_ids)) != len(actual_ids):
            fail("duplicate feature_id in developer Feature Pages")

        manifest = builder.manifest_features()
        expected_ids = {str(feature.get("id")) for feature in manifest}
        if len(manifest) != 103 or len(expected_ids) != 103:
            fail(f"canonical feature manifest count is {len(manifest)}, expected 103 unique features")
        if set(actual_ids) != expected_ids:
            fail(f"Feature ID set mismatch; missing={sorted(expected_ids - set(actual_ids))}, extra={sorted(set(actual_ids) - expected_ids)}")

        for path in sorted(builder.NEW_FEATURES.glob("*.md")):
            if path.name == "index.md":
                continue
            meta, body = parse_frontmatter(path)
            missing = sorted(REQUIRED_FRONTMATTER - set(meta))
            if missing:
                fail(f"{path.name}: missing front matter {missing}")
            if meta["portfolio_status"] not in builder.PORTFOLIO_STATUSES:
                fail(f"{path.name}: unsupported portfolio_status {meta['portfolio_status']!r}")
            if meta["source_migration"] not in {"complete", "manual"}:
                fail(f"{path.name}: unsupported source_migration {meta['source_migration']!r}")
            if not isinstance(meta["delivery_evidence"], list):
                fail(f"{path.name}: delivery_evidence must be a list")
            for section, headings in REQUIRED_SECTIONS.items():
                if not any(heading in body for heading in headings):
                    fail(f"{path.name}: missing required section {section}")
            # Legacy generated pages must remain conservative.  The two
            # hand-verified pages are the only ones allowed to state an
            # implemented layer, and even they retain acceptance caveats.
            statuses = builder.page_layer_statuses(body)
            if meta["source_migration"] == "complete" and any(status.startswith("implemented") for status in statuses.values()):
                fail(f"{path.name}: migrated page infers implemented status without manual verification")

        loaded = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        if loaded != catalog:
            fail("feature-catalog.json is out of date or does not match page front matter")
        expected_index = builder.build_index(records, catalog)
        if INDEX_PATH.read_text(encoding="utf-8") != expected_index:
            fail("developer/features/index.md is out of date or does not match feature-catalog.json")
        overview = OVERVIEW_PATH.read_text(encoding="utf-8")
        expected_total = f"**{catalog['detail_total']} 个 Feature detail 页面**"
        expected_portfolio = (
            f"active {catalog['portfolio_status_counts'].get('active', 0)}、"
            f"deferred {catalog['portfolio_status_counts'].get('deferred', 0)}、"
            f"pending_decision {catalog['portfolio_status_counts'].get('pending_decision', 0)}"
        )
        if expected_total not in overview or expected_portfolio not in overview:
            fail("developer/index.md overview statistics do not match feature-catalog.json")

        print("PRODUCT_DEVELOPMENT_OVERVIEW_CHECK PASS")
        print(f"detail_total={catalog['detail_total']}")
        print(f"portfolio={catalog['portfolio_status_counts']}")
        print(f"source_migration={catalog['source_migration_counts']}")
        print(f"evidence={catalog['evidence_counts']}")
        return 0
    except (AssertionError, OSError, ValueError, yaml.YAMLError) as error:
        print(f"PRODUCT_DEVELOPMENT_OVERVIEW_CHECK FAIL: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
