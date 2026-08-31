#!/usr/bin/env python3
"""Audit Feature state machines for entity ownership and permission transitions."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FEATURES = ROOT / "docs/docs/features"

SECTION_RE = re.compile(r"^##\s+(?:状态机|State Machine)\s*$", re.M | re.I)
ENTITY_RE = re.compile(r"(?:实体|Entity)\s*[:：]", re.I)
PERMISSION_RE = re.compile(r"(?:权限|Permission|RBAC|role|角色|audio\.[a-z_]+)", re.I)
TRANSITION_RE = re.compile(r"(?:→|->|状态迁移|transition|进入|变为)", re.I)


def audit(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    if not SECTION_RE.search(text):
        return []

    body = text.split(SECTION_RE.search(text).group(0), 1)[1]
    result = []

    if not ENTITY_RE.search(body):
        result.append("missing state machine entity")
    if not TRANSITION_RE.search(body):
        result.append("missing state transitions")
    if not PERMISSION_RE.search(body):
        result.append("missing transition permissions")

    # Detect the common anti-pattern: one unqualified linear flow mixing entities.
    if body.count(" ↓ ") >= 3 and not re.search(r"(?:生产任务|版本|引用|binding|task|version)", body, re.I):
        result.append("possible mixed entity state machine")

    return result


def main() -> int:
    failures = []
    for page in sorted(FEATURES.glob("*/index.md")):
        for item in audit(page):
            failures.append(f"{page.parent.name}: {item}")

    print("STATE_MACHINE_AUDIT")
    print(f"features_checked={len(list(FEATURES.glob('*/index.md')))}")
    print(f"issues={len(failures)}")
    for failure in failures:
        print("  " + failure)

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
