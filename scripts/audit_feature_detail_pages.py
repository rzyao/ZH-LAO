#!/usr/bin/env python3
"""Audit the structure and metadata of all canonical Feature detail pages."""
from __future__ import annotations

import re
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
FEATURES_DIR = ROOT / "docs/docs/features"
PORTFOLIO_STATUSES = {"active", "deferred", "pending_decision"}
DETAIL_HEADINGS = (
    "## 1. 功能概览",
    "## 2. 生命周期状态",
    "## 3. 核心能力",
    "## 4. 参与角色",
    "## 5. 责任边界",
    "## 6. 架构关系",
    "# 7. 生命周期状态机（带权限约束）",
    "## 8. 证据",
    "## 9. Gate 状态",
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
    feature_id = path.parent.name
    if data.get("feature_id") != feature_id:
        issues.append(f"feature_id must match directory name ({feature_id})")
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
    if not re.search(r"^#\s+.+$", text, re.M):
        issues.append("missing page title heading")
    if not heading_exists(text, "功能概览"):
        issues.append("missing 功能概览 section")
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
    if path.parent.name != "audio-production":
        return ("canonical-feature" if not issues else "needs-refactor"), issues

    for heading in DETAIL_HEADINGS:
        if heading.endswith(" "):
            pattern = rf"^{re.escape(heading)}.+$"
            present = re.search(pattern, text, re.M) is not None
        else:
            present = re.search(rf"^{re.escape(heading)}$", text, re.M) is not None
        if not present:
            issues.append(f"missing audio-based template heading: {heading.rstrip()}")
    optional_state_machines = [
        int(match.group(1))
        for match in re.finditer(r"^## 7\.(1|2|3|4)(?:\.|\s)", text, re.M)
    ]
    if optional_state_machines and optional_state_machines != list(range(1, max(optional_state_machines) + 1)):
        issues.append("optional state machine subsections 7.1/7.2/7.3 must be sequential")
    issues.extend(check_audio(path, text, data))
    return ("audio-template" if not issues else "needs-refactor"), issues


def audit_page(path: Path) -> tuple[str, list[str]]:
    text = path.read_text(encoding="utf-8")
    try:
        data = parse_frontmatter(text)
    except ValueError as error:
        return "invalid", [str(error)]
    shape, issues = check_shape(path, text, data)
    return shape, check_common(path, text, data) + issues


def main() -> int:
    pages = sorted(FEATURES_DIR.glob("*/index.md"))
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
