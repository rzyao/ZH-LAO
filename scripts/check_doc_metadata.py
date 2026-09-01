#!/usr/bin/env python3
"""Validate first-party Markdown metadata without modifying documentation."""

from __future__ import annotations

import datetime as dt
import re
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "docs"
LEGACY_DIR_RE = re.compile(r"^0[1-7]-")
ALLOWED_SCALAR_STATUSES = {
    "active",
    "audited",
    "baseline",
    "blocked",
    "complete",
    "control-center",
    "designing",
    "frozen",
    "grounded",
    "implemented",
    "integration-pending",
    "inventory-bootstrap",
    "moved",
    "planned",
    "prepared",
    "ready",
    "ready-after-upstream-gates",
    "superseded",
    "template",
    "todo",
}


def parse_frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError("missing YAML front matter")
    end = text.find("\n---", 4)
    if end < 0:
        raise ValueError("unterminated YAML front matter")
    data = yaml.safe_load(text[4:end])
    if not isinstance(data, dict):
        raise ValueError("front matter must be a mapping")
    return data


def is_legacy(path: Path) -> bool:
    relative = path.relative_to(DOCS)
    return (
        len(relative.parts) >= 3
        and relative.parts[0] == "development"
        and bool(LEGACY_DIR_RE.match(relative.parts[1]))
    )


def validate(path: Path) -> list[str]:
    issues: list[str] = []
    try:
        data = parse_frontmatter(path)
    except (ValueError, yaml.YAMLError) as exc:
        return [str(exc)]

    status = data.get("status")
    is_feature_page = isinstance(data.get("feature_id"), str)
    if is_feature_page and status is not None:
        issues.append("Feature Page must not define obsolete fixed delivery-matrix status")
    elif is_feature_page:
        if data.get("portfolio_status") not in {"active", "deferred", "pending_decision"}:
            issues.append("Feature Page must define a valid portfolio_status")
    elif isinstance(status, str):
        if status not in ALLOWED_SCALAR_STATUSES:
            issues.append(f"unsupported scalar status {status!r}")
    elif isinstance(status, dict):
        if not status:
            issues.append("status mapping must not be empty")
    else:
        issues.append("status must be a non-empty string or mapping")

    lifecycle = data.get("lifecycle")
    if lifecycle is not None and lifecycle != "historical":
        issues.append("lifecycle, when present, must be 'historical'")
    if is_legacy(path) and lifecycle != "historical":
        issues.append("legacy Phase document must declare lifecycle: historical")

    last_updated = data.get("last_updated")
    if last_updated is not None:
        if isinstance(last_updated, dt.date):
            pass
        elif not isinstance(last_updated, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", last_updated):
            issues.append("last_updated must use YYYY-MM-DD")

    return issues


def main() -> int:
    failures: list[str] = []
    pages = sorted(DOCS.rglob("*.md"))
    for page in pages:
        for issue in validate(page):
            failures.append(f"{page.relative_to(ROOT)}: {issue}")

    print(f"DOC_METADATA_CHECK pages={len(pages)} issues={len(failures)}")
    for failure in failures:
        print("  " + failure)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
