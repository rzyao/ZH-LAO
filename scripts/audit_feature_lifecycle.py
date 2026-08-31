#!/usr/bin/env python3
"""Feature 生命周期规范审计。

直接基于当前 Feature Page 规范检查：
- metadata 状态
- 六 Lane 生命周期状态
- 设计/实现/证据完整性
- portfolio 状态分离
- NEEDS_DECISION 边界
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import yaml

from validate_feature_pages import FEATURES_DIR, LANES, HEADINGS, scan

STATUSES = {"todo", "ready", "active", "blocked", "done", "na"}
TITLE_MARKER = re.compile(r"延期|待裁决|待设计")
DECISION_RE = re.compile(r"\b[A-Z][A-Z0-9_-]*_DECISION\b")

REQUIRED = {
    "scope": r"Scope|范围",
    "stage": r"Stage|阶段|Artifact|工件",
    "gate": r"Gate|Evidence|证据",
    "next": r"Next Action|下一步",
}


def read_page(path: Path):
    text = path.read_text(encoding="utf-8")
    end = text.find("\n---", 4)
    return yaml.safe_load(text[4:end]), text


def lane_body(text, lane):
    heading = f"## {HEADINGS[lane]}"
    if heading not in text:
        return ""
    return text.split(heading, 1)[1].split("\n## ", 1)[0]


def check_lane(feature_id, lane, status, body):
    findings = []
    if status not in STATUSES:
        findings.append(f"{feature_id}.{lane}: invalid status")
        return findings

    if status in {"done", "active", "blocked"}:
        for name, pattern in REQUIRED.items():
            if not re.search(pattern, body, re.I):
                findings.append(f"{feature_id}.{lane}: missing {name}")

    if status == "blocked":
        if not re.search(r"原因|依赖|等待|NEEDS_DECISION|前置", body, re.I):
            findings.append(f"{feature_id}.{lane}: blocked reason missing")

    return findings


def audit(output_json=False):
    index = scan()
    findings = []
    summary = {"features": 0, "lanes": 0}

    for item in index["features"]:
        path = FEATURES_DIR / item["id"] / "index.md"
        if not path.exists():
            findings.append(f"{item['id']}: page missing")
            continue

        data, text = read_page(path)
        summary["features"] += 1

        if TITLE_MARKER.search(str(data.get("title", ""))):
            findings.append(f"{item['id']}: title contains lifecycle marker")

        if data.get("portfolio_status") not in {"active", "deferred", "pending_decision"}:
            findings.append(f"{item['id']}: invalid portfolio_status")

        for lane in LANES:
            summary["lanes"] += 1
            status = data.get("status", {}).get(lane)
            findings.extend(check_lane(item["id"], lane, status, lane_body(text, lane)))

        if data.get("portfolio_status") == "pending_decision" and not DECISION_RE.search(text) and "NEEDS_DECISION" not in text:
            findings.append(f"{item['id']}: pending_decision without decision reference")

    result = {"pass": not findings, "summary": summary, "findings": findings}
    if output_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("Feature lifecycle audit:", "PASS" if not findings else "FAIL")
        print(json.dumps(result, ensure_ascii=False, indent=2))

    return 0 if not findings else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    raise SystemExit(audit(args.json))
