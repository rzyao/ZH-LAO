#!/usr/bin/env python3
"""Audit Feature metadata, lane evidence, titles, and decision visibility."""
from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

import yaml

from validate_feature_pages import FEATURES_DIR, LANES, HEADINGS, scan

ROOT = Path(__file__).resolve().parents[1]
PLACEHOLDER_RE = re.compile(r"在此维护|\bTODO\b|\bTBD\b|待补|尚未回填|placeholder", re.I)
TITLE_MARKER_RE = re.compile(r"(?:延期|待裁决|待设计)")
REQUIRED_LABELS = ("范围：", "执行阶段与产物：", "Gate / 完成证据：", "下一步：")


def read_page(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    end = text.find("\n---", 4)
    return yaml.safe_load(text[4:end]), text


def section(text: str, lane: str) -> str:
    heading = f"## {HEADINGS[lane]}"
    return text.split(heading, 1)[1].split("\n## ", 1)[0]


def main() -> int:
    index = scan()
    pages = {feature_id: FEATURES_DIR / feature_id / "index.md" for feature_id in (x["id"] for x in index["features"])}
    counts = Counter()
    findings: list[str] = []
    needs_decision: set[tuple[str, str]] = set()

    for feature in index["features"]:
        path = pages[feature["id"]]
        data, text = read_page(path)
        counts["features"] += 1
        for lane in LANES:
            status = data["status"][lane]
            counts[status] += 1
            if status in {"done", "active", "blocked"}:
                counts["non_todo_na_lanes"] += 1
                body = section(text, lane)
                if f"状态：{status}" not in body:
                    counts["status_conflicts"] += 1
                    findings.append(f"{feature['id']}.{lane}: visible status differs from frontmatter")
                missing = [label for label in REQUIRED_LABELS if label not in body]
                if missing:
                    findings.append(f"{feature['id']}.{lane}: missing {missing}")
                if PLACEHOLDER_RE.search(body):
                    counts["template_placeholders"] += 1
                    findings.append(f"{feature['id']}.{lane}: template placeholder")
                if status == "active":
                    if "已完成内容：" not in body or "当前进行内容：" not in body:
                        findings.append(f"{feature['id']}.{lane}: active scope/progress detail incomplete")
                if status == "blocked":
                    blocker = (data.get("blocks") or {}).get(lane)
                    if not blocker or ("阻塞原因：" not in body and "NEEDS_DECISION" not in body):
                        findings.append(f"{feature['id']}.{lane}: blocked reason missing")
                    if "阻塞对象：" not in body or "等待条件：" not in body or "解除阻塞后" not in body:
                        findings.append(f"{feature['id']}.{lane}: blocked recovery detail incomplete")
                    if blocker and (blocker.endswith("_DECISION") or data["portfolio_status"] == "pending_decision"):
                        needs_decision.add((feature["id"], blocker))
                if status == "done" and not (data.get("evidence") or {}).get(lane):
                    findings.append(f"{feature['id']}.{lane}: done evidence missing")
            elif status == "todo":
                if lane in (data.get("evidence") or {}) or lane in (data.get("active_notes") or {}) or lane in (data.get("blocks") or {}):
                    counts["status_conflicts"] += 1
                    findings.append(f"{feature['id']}.{lane}: todo has non-todo evidence metadata")

        if TITLE_MARKER_RE.search(data["title"]):
            counts["status_conflicts"] += 1
            findings.append(f"{feature['id']}: portfolio marker embedded in title")

    counts["needs_decision_features"] = len(needs_decision)
    counts["needs_decision_blockers"] = len({blocker for _, blocker in needs_decision})
    print(f"Feature lifecycle audit: {'PASS' if not findings else 'FAIL'}")
    print(f"features={counts['features']}")
    print("lane_status=" + ", ".join(f"{status}={counts[status]}" for status in ("todo", "ready", "active", "blocked", "done", "na")))
    print(f"done_active_blocked_lanes={counts['non_todo_na_lanes']}")
    print(f"template_placeholders_in_done_active_blocked={counts['template_placeholders']}")
    print(f"STATUS_CONFLICT={counts['status_conflicts']}")
    print(f"NEEDS_DECISION_FEATURES={counts['needs_decision_features']}")
    print(f"NEEDS_DECISION_BLOCKERS={counts['needs_decision_blockers']}")
    for finding in findings:
        print("  "+finding)
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
