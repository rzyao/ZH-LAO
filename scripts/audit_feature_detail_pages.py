#!/usr/bin/env python3
"""Audit the structure and metadata of canonical developer Feature pages."""
from __future__ import annotations

import re
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
FEATURES_DIR = ROOT / "docs/docs/developer/features"
PORTFOLIO_STATUSES = {"active", "deferred", "pending_decision"}
LAYER_STATUSES = {"not_evidenced", "evidenced", "evidenced_limited", "not_applicable", "verified"}
DELIVERY_LAYERS = {"数据库", "Backend", "Admin", "Mobile", "Integration", "Acceptance"}
DETAIL_HEADINGS = (
    ("用户价值与功能说明", "用户价值"),
    ("使用者或受益者", "使用者与可观察流程"),
    ("范围与边界", "范围与非范围"),
    ("参与系统",),
    ("分层交付状态",),
    ("证据",),
    ("限制、阻塞与下一步", "来源冲突、限制与下一步"),
)
AUDIO_FORBIDDEN = ("## 10.", "## 11.", "实现状态", "下一步")
AUDIO_REQUIRED_CONTENT = (
    "AUDIO_DESIGN_GATE",
    "CONTENT_GATE",
    "0600_audio.sql",
    "audio_production_task",
    "audio_version",
    "official_audio_binding",
    "audio.create",
    "audio.rollback",
)
AUDIO_GATES = {
    "音频设计 Gate": "通过",
    "音频实现 Gate": "阻塞",
    "后台设计 Gate": "进行中",
    "音频集成 Gate": "阻塞",
    "音频验收 Gate": "待开始",
}


def parse_frontmatter(text: str) -> dict:
    if not text.startswith("---\n"):
        raise ValueError("missing YAML frontmatter")
    end = text.find("\n---", 4)
    if end < 0:
        raise ValueError("unterminated YAML frontmatter")
    data = yaml.safe_load(text[4:end])
    if not isinstance(data, dict):
        raise ValueError("frontmatter must be a mapping")
    return data


def heading_exists(text: str, heading: str) -> bool:
    return re.search(rf"^##\s+(?:\d+(?:\.\d+)?\.\s*)?{re.escape(heading)}\s*$", text, re.M) is not None


def check_common(path: Path, text: str, data: dict) -> list[str]:
    issues: list[str] = []
    feature_id = path.stem
    if data.get("feature_id") != feature_id:
        issues.append(f"feature_id must match file name ({feature_id})")
    if not isinstance(data.get("title"), str) or not data["title"].strip():
        issues.append("title is required")
    if data.get("portfolio_status") not in PORTFOLIO_STATUSES:
        issues.append(f"invalid portfolio_status: {data.get('portfolio_status')!r}")
    domain = data.get("domain")
    if not isinstance(domain, (list, dict)):
        issues.append("domain must be a list or mapping")
    obsolete = {"status", "blocks", "active_notes", "evidence"} & set(data)
    if obsolete:
        issues.append(f"obsolete fixed delivery-matrix metadata present: {sorted(obsolete)}")
    for key in ("delivery_evidence", "delivery_notes"):
        value = data.get(key, [])
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            issues.append(f"{key} must be a list of strings")
    layers = data.get("delivery_layers", {})
    if layers is not None and not isinstance(layers, dict):
        issues.append("delivery_layers must be a mapping")
    elif isinstance(layers, dict):
        for layer, entry in layers.items():
            if layer not in DELIVERY_LAYERS:
                issues.append(f"unknown delivery layer: {layer}")
            elif not isinstance(entry, dict) or entry.get("status") not in LAYER_STATUSES:
                issues.append(f"invalid delivery layer status: {layer}")
            elif entry.get("status") in {"evidenced_limited", "verified"} and not isinstance(entry.get("note"), str):
                issues.append(f"{entry.get('status')} delivery layer requires a note: {layer}")
    if data.get("last_verified_at") is not None:
        if data.get("source_migration") != "manual":
            issues.append("last_verified_at requires source_migration: manual")
        if not data.get("delivery_evidence"):
            issues.append("last_verified_at requires delivery_evidence")
    if not re.search(r"^#\s+.+$", text, re.M):
        issues.append("missing page title heading")
    for alternatives in DETAIL_HEADINGS:
        if not any(heading_exists(text, heading) for heading in alternatives):
            issues.append(f"missing one of {alternatives} sections")
    return issues


def check_audio(path: Path, text: str, data: dict) -> list[str]:
    issues: list[str] = []
    for marker in AUDIO_FORBIDDEN:
        if marker in text:
            issues.append(f"forbidden legacy content present: {marker}")
    for marker in AUDIO_REQUIRED_CONTENT:
        if marker not in text:
            issues.append(f"missing required content marker: {marker}")

    gate_rows = {}
    for line in text.splitlines():
        match = re.match(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$", line)
        if match:
            gate_rows[match.group(1)] = match.group(2)
    for label, expected in AUDIO_GATES.items():
        actual = gate_rows.get(label)
        if actual != expected:
            issues.append(f"{label} must be {expected!r}, got {actual!r}")
    return issues


def check_shape(path: Path, text: str, data: dict) -> tuple[str, list[str]]:
    issues: list[str] = []
    return ("canonical-feature" if not issues else "needs-refactor"), issues


def audit_page(path: Path) -> tuple[str, list[str]]:
    text = path.read_text(encoding="utf-8")
    try:
        data = parse_frontmatter(text)
    except ValueError as error:
        return "invalid", [str(error)]
    shape, issues = check_shape(path, text, data)
    return shape, check_common(path, text, data) + issues


def main() -> int:
    pages = sorted(path for path in FEATURES_DIR.glob("*.md") if path.name != "index.md")
    failures: list[str] = []
    shapes: dict[str, int] = {}
    for page in pages:
        shape, issues = audit_page(page)
        shapes[shape] = shapes.get(shape, 0) + 1
        for issue in issues:
            failures.append(f"{page.parent.name}: {issue}")

    print("FEATURE_DETAIL_PAGE_AUDIT")
    print(f"pages_checked={len(pages)}")
    print("shapes=" + ", ".join(f"{name}:{count}" for name, count in sorted(shapes.items())))
    print(f"issues={len(failures)}")
    for failure in failures:
        print(f"  {failure}")
    if failures:
        return 1
    print("status=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
