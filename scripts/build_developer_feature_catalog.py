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

DOMAIN_NAMES = {
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

# 功能页返回导航注入标记。生成器用这两个注释包裹注入的面包屑，
# 以便重复运行时识别并原位替换（幂等），且不触碰手工维护的正文。
BREADCRUMB_START = "<!-- breadcrumb:start -->"
BREADCRUMB_END = "<!-- breadcrumb:end -->"

# 开发状态 → 展示标签（由六层交付状态推导，见 derive_dev_status）
DEV_STATUS_LABELS = {
    "not_started": "⚪ not_started",
    "in_progress": "🟡 in_progress",
    "completed": "🟢 completed",
}
PORTFOLIO_STATUSES = {"active", "deferred", "pending_decision"}
LAYER_NAMES = ["产品", "数据库", "Backend", "Admin", "Mobile", "Integration", "Acceptance"]
LAYER_STATUSES = {"not_evidenced", "evidenced", "evidenced_limited", "not_applicable", "verified"}
DEFAULT_LAYER_STATUS = "not_evidenced"


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
        # 注入"返回上级"面包屑（基于主领域推导领域页与全量目录的相对路径）。
        primary = as_list(meta.get("domain"))[0] if as_list(meta.get("domain")) else "unassigned"
        new_text = inject_breadcrumb(page.read_text(encoding="utf-8"), primary)
        if check:
            if page.read_text(encoding="utf-8") != new_text:
                changed.append(str(page.relative_to(ROOT)))
        else:
            page.write_text(new_text, encoding="utf-8")

    records = catalog_records()
    catalog = build_catalog(records)
    index_text = build_index(records, catalog)
    index_path = NEW_FEATURES / "index.md"
    if check:
        if not index_path.is_file() or index_path.read_text(encoding="utf-8") != index_text:
            changed.append(str(index_path.relative_to(ROOT)))
    else:
        index_path.write_text(index_text, encoding="utf-8")
    changed.extend(build_domain_pages(records, catalog, check))
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


def frontmatter_layer_statuses(meta: dict[str, Any]) -> dict[str, str]:
    """Layer statuses from front matter ``delivery_layers`` (controlled enum).

    Front matter is the human-maintained data source; the generated body table
    and catalog derive from it. Missing layers fall back to ``not_evidenced``.
    """
    raw = meta.get("delivery_layers")
    statuses: dict[str, str] = {}
    if isinstance(raw, dict):
        for layer, value in raw.items():
            if layer not in LAYER_NAMES or not isinstance(value, dict):
                continue
            status = str(value.get("status", DEFAULT_LAYER_STATUS))
            if status in LAYER_STATUSES:
                statuses[layer] = status
    return {layer: statuses.get(layer, DEFAULT_LAYER_STATUS) for layer in LAYER_NAMES}


def catalog_records() -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for path in sorted(NEW_FEATURES.glob("*.md")):
        if path.name == "index.md":
            continue
        meta, body = parse_frontmatter(path)
        layer_statuses = frontmatter_layer_statuses(meta) or page_layer_statuses(body)
        records.append(
            {
                "id": str(meta.get("feature_id") or path.stem),
                "title": str(meta.get("title") or path.stem),
                "portfolio_status": str(meta.get("portfolio_status") or "unknown"),
                "domains": as_list(meta.get("domain")),
                "evidence_count": len(as_list(meta.get("delivery_evidence"))),
                # 产品 layer mirrors portfolio_status; only the six delivery
                # layers use the controlled evidence enum.
                "layer_statuses": layer_statuses,
                "dev_status": derive_dev_status(layer_statuses),
                "source_migration": str(meta.get("source_migration") or "manual"),
                "path": path.name.removesuffix(".md"),
            }
        )
    return records


def derive_dev_status(layer_statuses: dict[str, str]) -> str:
    """从六层交付状态推导开发状态（派生字段，不写回功能页 frontmatter）。

    - 六层全部 not_evidenced  → not_started（没有任何实现/验证证据）
    - Integration 与 Acceptance 均 verified → completed（端到端核验完成）
    - 其余 → in_progress（至少一层有证据，但未完成端到端核验）
    """
    delivery = [layer_statuses.get(layer, DEFAULT_LAYER_STATUS) for layer in LAYER_NAMES[1:]]
    if all(status == DEFAULT_LAYER_STATUS for status in delivery):
        return "not_started"
    if (
        layer_statuses.get("Integration") == "verified"
        and layer_statuses.get("Acceptance") == "verified"
    ):
        return "completed"
    return "in_progress"


def notable_layers(record: dict[str, Any]) -> list[str]:
    """Layers whose status differs from the default, for compact display."""
    return [
        f"{layer}: {record['layer_statuses'][layer]}"
        for layer in LAYER_NAMES
        if record["layer_statuses"].get(layer, DEFAULT_LAYER_STATUS) != DEFAULT_LAYER_STATUS
    ]


def build_catalog(records: list[dict[str, Any]]) -> dict[str, Any]:
    portfolio = Counter(record["portfolio_status"] for record in records)
    domains = Counter(domain for record in records for domain in record["domains"])
    primary_domains = Counter(record["domains"][0] if record["domains"] else "unassigned" for record in records)
    layers: dict[str, Counter[str]] = defaultdict(Counter)
    for record in records:
        for layer in LAYER_NAMES[1:]:  # six delivery layers use the evidence enum
            layers[layer][record["layer_statuses"].get(layer, DEFAULT_LAYER_STATUS)] += 1
    evidence = Counter("with_evidence" if record["evidence_count"] else "without_evidence" for record in records)
    migrations = Counter(record["source_migration"] for record in records)
    dev_status = Counter(record["dev_status"] for record in records)
    return {
        "generated_by": "scripts/build_developer_feature_catalog.py",
        "generated_at": TODAY,
        "detail_total": len(records),
        "feature_ids": [record["id"] for record in records],
        "portfolio_status_counts": dict(sorted(portfolio.items())),
        "domain_counts": dict(sorted(domains.items())),
        "primary_domain_counts": dict(sorted(primary_domains.items())),
        "dev_status_counts": dict(sorted(dev_status.items())),
        "layer_status_counts": {layer: dict(sorted(layers[layer].items())) for layer in LAYER_NAMES[1:]},
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


def inject_breadcrumb(text: str, primary_domain: str) -> str:
    """在功能页 '# 标题' 之后注入 '返回上级' 面包屑（领域页 + 全量目录）。

    用 <!-- breadcrumb:start --> / <!-- breadcrumb:end --> 包裹，重复运行原位替换（幂等）。
    面包屑链接使用相对路径：领域页为 <domain>/（同目录下子目录 index.md），
    全量目录为 index.md（同目录 index.md）。
    保持原文件行尾风格（CRLF 或 LF）：按行处理后统一还原。
    """
    domain_label = DOMAIN_NAMES.get(primary_domain, primary_domain)
    # 行尾探测：优先按原文件多数行尾
    newline = "\r\n" if text.count("\r\n") >= text.count("\n") - text.count("\r\n") else "\n"
    crumb_lines = [
        BREADCRUMB_START,
        f"> **← 返回** [{domain_label}]({primary_domain}/) · [全量功能目录](index.md)",
        BREADCRUMB_END,
    ]
    if BREADCRUMB_START in text:
        # 已存在 → 原位替换包裹内的内容，并规整块前为「标题 + 一个空行」、块后为「空行 + 原正文」
        start = text.index(BREADCRUMB_START)
        end = text.index(BREADCRUMB_END) + len(BREADCRUMB_END)
        before = text[:start]
        # 块前：确保以换行结尾（保留标题行尾），若已有空行则压成单个空行
        before = re.sub(r"(?:\r?\n)+$", newline, before)
        block = newline.join(crumb_lines)
        # 块后：把紧跟的多余空行压成单个空行
        after = re.sub(r"^(?:\r?\n)+", newline, text[end:])
        return before + newline + block + newline + after
    # 在 '# 标题' 行之后插入。匹配到标题行（含其行尾 \r\n 或 \n）。
    m = re.match(r"^# .*?(?:\r?\n)", text)
    if not m:
        return text
    # 标题行结束后插入：空一行 + crumb 块 + 空一行，再接原正文。
    head_end = m.end()
    block = newline.join(crumb_lines)
    # 原正文开头若有连续空行，压成单个空行
    after = re.sub(r"^(?:\r?\n)+", newline, text[head_end:])
    return text[:head_end] + newline + block + newline + after


def build_index(records: list[dict[str, Any]], catalog: dict[str, Any]) -> str:
    pages = [
        {
            **record,
            "portfolio": record["portfolio_status"],
            "evidence": record["evidence_count"],
            "layer": "; ".join(notable_layers(record)) if notable_layers(record) else "—",
            "migration": record["source_migration"],
        }
        for record in records
    ]

    domain_names = DOMAIN_NAMES
    grouped: dict[str, list[dict[str, Any]]] = {}
    for page in pages:
        primary = page["domains"][0] if page["domains"] else "unassigned"
        grouped.setdefault(primary, []).append(page)

    # 领域导航条：为每个领域生成指向其领域页的链接。
    # 领域页位于 features/<domain>/index.md，从目录首页用相对路径 <domain>/ 引用。
    nav_keys = [d for d in sorted(grouped, key=lambda item: (item == "unassigned", item))]
    nav_items = " · ".join(
        f"[{domain_names.get(d, d)}]({d}/)" for d in nav_keys
    )

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
        "## 领域导航",
        "",
        nav_items,
        "",
        "> 点击领域名进入对应领域页，查看该领域下的全部功能及分层交付状态。",
        "",
        "## 覆盖摘要",
        "",
        f"- Portfolio：`active` {catalog['portfolio_status_counts'].get('active', 0)}、`deferred` {catalog['portfolio_status_counts'].get('deferred', 0)}、`pending_decision` {catalog['portfolio_status_counts'].get('pending_decision', 0)}。",
        f"- 证据条目：有 frontmatter evidence 的 {catalog['evidence_counts']['with_evidence']} 页、无 evidence 的 {catalog['evidence_counts']['without_evidence']} 页，共 {catalog['evidence_counts']['total_entries']} 条。",
        f"- 来源迁移：`complete` {catalog['source_migration_counts'].get('complete', 0)} 页、`manual` {catalog['source_migration_counts'].get('manual', 0)} 页；旧 102 页已按退役清单处理。",
        f"- 人工分层核验：`manual` 页 {catalog['source_migration_counts'].get('manual', 0)} 页（[login](login)、[lao-alphabet-management](lao-alphabet-management)），其余 {catalog['source_migration_counts'].get('complete', 0)} 页六层交付状态默认 `not_evidenced`，待按[文档契约](../DOCUMENT_CONTRACT)增量补录。",
        "- 主领域规模：" + "、".join(f"{domain} {count}" for domain, count in catalog["primary_domain_counts"].items()) + "。",
        "",
        "### 分层状态计数（六层交付层）",
        "",
        "| 层 | 当前页面状态计数 |",
        "| --- | --- |",
        *[
            f"| {layer} | " + ", ".join(f"`{status}` {count}" for status, count in catalog["layer_status_counts"][layer].items()) + " |"
            for layer in LAYER_NAMES[1:]
        ],
        "",
        "## 状态说明",
        "",
        "- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。",
        "- 六层交付状态使用[文档契约](../DOCUMENT_CONTRACT)定义的受控枚举，默认 `not_evidenced`，来自各页 front matter `delivery_layers`。",
        "- 分层状态摘要只列出偏离默认值的层；显示 `—` 表示六层全部 `not_evidenced`，尚待独立核验。",
        "- `evidence` 是页面声明的证据条目数量，不是 Gate 结论。",
        "",
        "## 领域分组",
        "",
        "| 领域 | 功能数 | 开发状态分布 | Portfolio 分布 |",
        "| --- | ---: | --- | --- |",
    ]
    for domain in sorted(grouped, key=lambda item: (item == "unassigned", item)):
        rows = sorted(grouped[domain], key=lambda page: (page["title"], page["id"]))
        dev_dist = Counter(page["dev_status"] for page in rows)
        dev_text = "、".join(
            f"{DEV_STATUS_LABELS.get(status, status)} {dev_dist[status]}"
            for status in ("not_started", "in_progress", "completed")
            if dev_dist[status]
        ) or "—"
        dist = Counter(page["portfolio"] for page in rows)
        dist_text = "、".join(
            f"`{status}` {dist[status]}" for status in ("active", "deferred", "pending_decision") if dist[status]
        ) or "—"
        lines.append(f"| [{domain_names.get(domain, domain)}]({domain}/) | {len(rows)} | {dev_text} | {dist_text} |")
    return "\n".join(lines).rstrip() + "\n"


def domain_nav_bar(nav_keys: list[str], domain_names: dict[str, str], current: str | None = None) -> str:
    """生成领域导航条。current 非空时表示当前所在领域（高亮为粗体），其余为链接。"""
    parts = []
    for d in nav_keys:
        label = domain_names.get(d, d)
        if d == current:
            parts.append(f"**{label}**")
        else:
            # 领域页之间互链：用相对路径 ../<domain>/
            prefix = "../" if current else ""
            parts.append(f"[{label}]({prefix}{d}/)")
    return " · ".join(parts)


def build_domain_page(domain: str, rows: list[dict[str, Any]], nav_keys: list[str], domain_names: dict[str, str], all_catalog: dict[str, Any]) -> str:
    """生成单个领域的索引页 features/<domain>/index.md。"""
    rows = sorted(rows, key=lambda page: (page["title"], page["id"]))
    dist = Counter(page["portfolio"] for page in rows)
    dist_text = "、".join(
        f"`{status}` {dist[status]}" for status in ("active", "deferred", "pending_decision") if dist[status]
    ) or "—"

    # 本域六层状态计数
    layer_lines = []
    for layer in LAYER_NAMES[1:]:
        counter: Counter[str] = Counter()
        for page in rows:
            counter[page["layer_statuses"].get(layer, DEFAULT_LAYER_STATUS)] += 1
        if counter:
            layer_lines.append(
                f"| {layer} | " + ", ".join(f"`{status}` {count}" for status, count in sorted(counter.items())) + " |"
            )

    lines = [
        "---",
        "status: active",
        f"last_updated: {TODAY}",
        "source: scripts/build_developer_feature_catalog.py",
        "---",
        "",
        f"# {domain_names.get(domain, domain)}",
        "",
        f"> 返回 [全量功能目录](../) ｜ 本领域共 **{len(rows)}** 个功能（Portfolio：{dist_text}）。",
        "",
        "## 领域导航",
        "",
        domain_nav_bar(nav_keys, domain_names, current=domain),
        "",
        "## 功能",
        "",
        "> 开发状态由[六层交付状态](../../DOCUMENT_CONTRACT)推导：`completed` 需 Integration 与 Acceptance 均 `verified`；任一层有证据为 `in_progress`；无证据为 `not_started`。",
        "",
        "| 功能 | 开发状态 | Portfolio | 分层状态摘要 | 证据条目 | 来源迁移 |",
        "| --- | --- | --- | --- | ---: | --- |",
    ]
    for page in rows:
        summary = page["layer"].replace("|", "\\|")
        lines.append(f"| [{page['title']}](../{page['path']}) | {DEV_STATUS_LABELS.get(page['dev_status'], page['dev_status'])} | `{page['portfolio']}` | {summary} | {page['evidence']} | `{page['migration']}` |")
    if layer_lines:
        lines.extend(
            [
                "",
                "## 本领域分层状态计数（六层交付层）",
                "",
                "| 层 | 状态计数 |",
                "| --- | --- |",
                *layer_lines,
            ]
        )
    lines.extend(
        [
            "",
            "## 状态说明",
            "",
            "- `portfolio_status` 直接来自各页面 front matter；`active` 只表示进入产品组合，不代表实现完成。",
            "- 六层交付状态使用[文档契约](../../DOCUMENT_CONTRACT)定义的受控枚举，默认 `not_evidenced`。",
            "- 分层状态摘要只列出偏离默认值的层；显示 `—` 表示六层全部 `not_evidenced`，尚待独立核验。",
            "",
        ]
    )
    return "\n".join(lines).rstrip() + "\n"


def build_domain_pages(records: list[dict[str, Any]], catalog: dict[str, Any], check: bool) -> list[str]:
    """为每个主领域生成 features/<domain>/index.md。返回变更路径列表。"""
    domain_names = DOMAIN_NAMES
    pages = [
        {
            **record,
            "portfolio": record["portfolio_status"],
            "evidence": record["evidence_count"],
            "layer": "; ".join(notable_layers(record)) if notable_layers(record) else "—",
            "migration": record["source_migration"],
        }
        for record in records
    ]
    grouped: dict[str, list[dict[str, Any]]] = {}
    for page in pages:
        primary = page["domains"][0] if page["domains"] else "unassigned"
        grouped.setdefault(primary, []).append(page)

    nav_keys = [d for d in sorted(grouped, key=lambda item: (item == "unassigned", item))]
    changed: list[str] = []
    for domain, rows in grouped.items():
        text = build_domain_page(domain, rows, nav_keys, domain_names, catalog)
        path = NEW_FEATURES / domain / "index.md"
        if check:
            if not path.is_file() or path.read_text(encoding="utf-8") != text:
                changed.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8")
    return changed


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
