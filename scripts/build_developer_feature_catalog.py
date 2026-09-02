#!/usr/bin/env python3
"""Build the human-facing developer Feature catalog from canonical Feature Pages.

 The canonical source is the static ``feature-manifest.json`` plus pages under
 ``docs/docs/developer/features``. The catalog is derived from these current
 canonical inputs and never maintains a parallel hand-written index.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import yaml


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "docs"
NEW_FEATURES = DOCS / "developer" / "features"
MANIFEST_PATH = DOCS / "developer" / "feature-manifest.json"
CATALOG_PATH = DOCS / "developer" / "feature-catalog.json"
MANUAL_IDS = {"login", "lao-alphabet-management"}
TODAY = "2026-09-02"
PORTFOLIO_STATUSES = {"active", "deferred", "pending_decision"}
LAYER_NAMES = ["产品", "数据库", "Backend", "Admin", "Mobile", "Integration", "Acceptance"]


def parse_frontmatter(path: Path) -> tuple[dict[str, Any], str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError(f"{path}: missing YAML front matter")
    end = text.find("\n---", 4)
    if end < 0:
        raise ValueError(f"{path}: unterminated YAML front matter")
    data = yaml.safe_load(text[4:end]) or {}
    if not isinstance(data, dict):
        raise ValueError(f"{path}: front matter must be a mapping")
    body = text[end + len("\n---") :].lstrip("\n")
    return data, body


def as_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value]
    return [str(value)]


def manifest_features() -> list[dict[str, Any]]:
    if not MANIFEST_PATH.is_file():
        raise ValueError(f"missing canonical feature manifest: {MANIFEST_PATH}")
    data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    features = data.get("features") if isinstance(data, dict) else None
    if data.get("canonical") is not True or not isinstance(features, list):
        raise ValueError("feature-manifest.json must be canonical and contain features")
    return [feature for feature in features if isinstance(feature, dict)]


def build_pages(check: bool) -> tuple[int, list[str]]:
    NEW_FEATURES.mkdir(parents=True, exist_ok=True)
    changed: list[str] = []
    manifest = manifest_features()
    expected_new = {str(feature.get("id")) for feature in manifest}
    if len(manifest) != 103 or len(expected_new) != 103:
        raise ValueError(f"canonical feature manifest must contain 103 unique features, got {len(manifest)}")
    actual_new = {path.stem for path in NEW_FEATURES.glob("*.md") if path.name != "index.md"}
    if actual_new != expected_new:
        missing = sorted(expected_new - actual_new)
        extra = sorted(actual_new - expected_new)
        raise ValueError(f"developer feature set mismatch; missing={missing}, extra={extra}")

    # Manifest metadata is canonical; page metadata must agree before it is
    # included in the generated catalog.
    for feature in manifest:
        feature_id = str(feature["id"])
        page = NEW_FEATURES / f"{feature_id}.md"
        meta, _ = parse_frontmatter(page)
        for key in ("feature_id", "title", "portfolio_status", "source_migration"):
            expected_value = feature_id if key == "feature_id" else feature.get(key)
            if str(meta.get(key)) != str(expected_value):
                raise ValueError(f"{page}: {key} disagrees with feature-manifest.json")
        if as_list(meta.get("domain")) != [str(item) for item in feature.get("domain", [])]:
            raise ValueError(f"{page}: domain disagrees with feature-manifest.json")
        if len(as_list(meta.get("delivery_evidence"))) != int(feature.get("delivery_evidence_count", 0)):
            raise ValueError(f"{page}: evidence count disagrees with feature-manifest.json")

    records = catalog_records()
    catalog = build_catalog(records)
    index_text = build_index(records, catalog)
    index_path = NEW_FEATURES / "index.md"
    if check:
        if not index_path.is_file() or index_path.read_text(encoding="utf-8") != index_text:
            changed.append(str(index_path.relative_to(ROOT)))
    else:
        index_path.write_text(index_text, encoding="utf-8")
    if check:
        if not CATALOG_PATH.is_file() or CATALOG_PATH.read_text(encoding="utf-8") != catalog_text(catalog):
            changed.append(str(CATALOG_PATH.relative_to(ROOT)))
    else:
        CATALOG_PATH.write_text(catalog_text(catalog), encoding="utf-8")
    return len(changed), changed


def page_layer_summary(body: str) -> str:
    match = re.search(r"## 分层交付状态\n\n(.*?)(?:\n## |\Z)", body, re.S)
    if not match:
        return "not evidenced"
    rows: list[str] = []
    for line in match.group(1).splitlines():
        if not line.startswith("|") or line.startswith("| ---") or "层 |" in line:
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) >= 2:
            rows.append(f"{cells[0]}: {cells[1]}")
    return "; ".join(rows) or "not evidenced"


def page_layer_statuses(body: str) -> dict[str, str]:
    """Return the status cell for each layer in the normalized status table."""
    match = re.search(r"## 分层交付状态\n\n(.*?)(?:\n## |\Z)", body, re.S)
    statuses: dict[str, str] = {}
    if not match:
        return statuses
    for line in match.group(1).splitlines():
        if not line.startswith("|") or line.startswith("| ---") or "层 |" in line:
            continue
        cells = [cell.strip().strip("`") for cell in line.strip("|").split("|")]
        if len(cells) >= 2 and cells[0] in LAYER_NAMES:
            statuses[cells[0]] = cells[1]
    return statuses


def catalog_records() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for path in sorted(NEW_FEATURES.glob("*.md")):
        if path.name == "index.md":
            continue
        meta, body = parse_frontmatter(path)
        records.append(
            {
                "id": str(meta.get("feature_id") or path.stem),
                "title": str(meta.get("title") or path.stem),
                "portfolio_status": str(meta.get("portfolio_status") or "unknown"),
                "domains": as_list(meta.get("domain")),
                "evidence_count": len(as_list(meta.get("delivery_evidence"))),
                "layer_statuses": page_layer_statuses(body),
                "source_migration": str(meta.get("source_migration") or "manual"),
                "path": path.name.removesuffix(".md"),
            }
        )
    return records


def build_catalog(records: list[dict[str, Any]]) -> dict[str, Any]:
    portfolio = Counter(record["portfolio_status"] for record in records)
    domains = Counter(domain for record in records for domain in record["domains"])
    primary_domains = Counter(record["domains"][0] if record["domains"] else "unassigned" for record in records)
    layers: dict[str, Counter[str]] = defaultdict(Counter)
    for record in records:
        for layer in LAYER_NAMES:
            layers[layer][record["layer_statuses"].get(layer, "not evidenced")] += 1
    evidence = Counter("with_evidence" if record["evidence_count"] else "without_evidence" for record in records)
    migrations = Counter(record["source_migration"] for record in records)
    return {
        "generated_by": "scripts/build_developer_feature_catalog.py",
        "generated_at": TODAY,
        "detail_total": len(records),
        "feature_ids": [record["id"] for record in records],
        "portfolio_status_counts": dict(sorted(portfolio.items())),
        "domain_counts": dict(sorted(domains.items())),
        "primary_domain_counts": dict(sorted(primary_domains.items())),
        "layer_status_counts": {layer: dict(sorted(layers[layer].items())) for layer in LAYER_NAMES},
        "evidence_counts": {
            "with_evidence": evidence["with_evidence"],
            "without_evidence": evidence["without_evidence"],
            "total_entries": sum(record["evidence_count"] for record in records),
        },
        "source_migration_counts": dict(sorted(migrations.items())),
        "features": records,
    }


def catalog_text(catalog: dict[str, Any]) -> str:
    return json.dumps(catalog, ensure_ascii=False, indent=2) + "\n"


def build_index(records: list[dict[str, Any]], catalog: dict[str, Any]) -> str:
    pages = [
        {
            **record,
            "portfolio": record["portfolio_status"],
            "evidence": record["evidence_count"],
            "layer": "; ".join(f"{layer}: {record['layer_statuses'].get(layer, 'not evidenced')}" for layer in LAYER_NAMES),
            "migration": record["source_migration"],
        }
        for record in records
    ]

    domain_names = {
        "foundation": "应用与基础（Foundation）",
        "identity": "身份（Identity）",
        "content": "内容（Content）",
        "learning": "学习（Learning）",
        "audio": "音频（Audio）",
        "social": "社交（Social）",
        "chat": "聊天（Chat）",
        "commerce": "商业（Commerce）",
        "rewards": "奖励（Rewards）",
        "trust": "信任与安全（Trust & Safety）",
        "operations": "运营（Operations）",
        "platform": "平台（Platform）",
    }
    grouped: dict[str, list[dict[str, Any]]] = {}
    for page in pages:
        primary = page["domains"][0] if page["domains"] else "unassigned"
        grouped.setdefault(primary, []).append(page)

    lines = [
        "---",
        "status: active",
        f"last_updated: {TODAY}",
        "source: scripts/build_developer_feature_catalog.py",
        "---",
        "",
        "# 功能目录",
        "",
        "本目录由 `scripts/build_developer_feature_catalog.py` 从 canonical manifest 与新目录页面的 front matter 生成。它不读取已退役的旧目录、不手工复制旧索引，也不把 `active` 推断为 implemented。",
        "",
        f"当前目录包含 **{len(pages)} 个 Feature detail 页面**（含 P2 手工核验页）。103 个页面已完成来源迁移；旧 102 个详情页已登记在退役清单中，不再是运行时来源。",
        "",
        "## 覆盖摘要",
        "",
        f"- Portfolio：`active` {catalog['portfolio_status_counts'].get('active', 0)}、`deferred` {catalog['portfolio_status_counts'].get('deferred', 0)}、`pending_decision` {catalog['portfolio_status_counts'].get('pending_decision', 0)}。",
        f"- 证据条目：有 frontmatter evidence 的 {catalog['evidence_counts']['with_evidence']} 页、无 evidence 的 {catalog['evidence_counts']['without_evidence']} 页，共 {catalog['evidence_counts']['total_entries']} 条。",
        f"- 来源迁移：`complete` {catalog['source_migration_counts'].get('complete', 0)} 页、`manual` {catalog['source_migration_counts'].get('manual', 0)} 页；旧 102 页已按退役清单处理。",
        "- 主领域规模：" + "、".join(f"{domain} {count}" for domain, count in catalog["primary_domain_counts"].items()) + "。",
        "",
        "### 分层状态计数",
        "",
        "| 层 | 当前页面状态计数 |",
        "| --- | --- |",
        *[
            f"| {layer} | " + ", ".join(f"`{status}` {count}" for status, count in catalog["layer_status_counts"][layer].items()) + " |"
            for layer in LAYER_NAMES
        ],
        "",
        "## 状态说明",
        "",
        "- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。",
        "- 分层状态默认是 `not evidenced`；P2 手工核验页在其页面内记录了代码/测试证据，其余页面仍需独立验证。",
        "- `evidence` 是页面声明的证据条目数量，不是 Gate 结论。",
        "",
    ]
    for domain in sorted(grouped, key=lambda item: (item == "unassigned", item)):
        rows = sorted(grouped[domain], key=lambda page: (page["title"], page["id"]))
        lines.extend([f"## {domain_names.get(domain, domain)}", "", "| 功能 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |", "| --- | --- | --- | ---: | --- |"])
        for page in rows:
            summary = page["layer"].replace("|", "\\|")
            lines.append(f"| [{page['title']}]({page['path']}) | `{page['portfolio']}` | {summary} | {page['evidence']} | `{page['migration']}` |")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="verify deterministic output without writing")
    args = parser.parse_args()
    changed, paths = build_pages(args.check)
    if args.check and changed:
        print("OUT_OF_DATE")
        for path in paths:
            print(f"  {path}")
        return 1
    print(f"developer feature pages: 103 detail + 1 index; {'checked' if args.check else 'generated'}")
    if not args.check:
        print("source_migration: complete (101 migrated + 2 manually verified)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
