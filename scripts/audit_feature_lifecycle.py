#!/usr/bin/env python3
"""Feature 生命周期规范审计。

依据当前 SPEC_SYSTEM / Feature Docs Standard 检查：
- Feature metadata 合法性
- portfolio_status 与 lane 状态分离
- 六 Lane 生命周期证据完整性
- Stage / Artifact / Gate / Evidence 合同
- blocked / active / done 语义完整性
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
PORTFOLIO_STATUSES = {"active", "deferred", "pending_decision"}
TITLE_MARKER = re.compile(r"延期|待裁决|待设计")
DECISION_RE = re.compile(r"\b[A-Z][A-Z0-9_-]*_DECISION\b")

SEMANTIC_RULES = {
    "scope": r"Scope|范围",
    "stage": r"Stage|阶段|Artifact|工件",
    "gate": r"Gate|Evidence|证据|验收",
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


def check_lane(feature_id, lane, status, body, data):
    findings = []

    if status not in STATUSES:
        return [f"{feature_id}.{lane}: invalid status"]

    if status in {"done", "active", "blocked"}:
        for field, pattern in SEMANTIC_RULES.items():
            if not re.search(pattern, body, re.I):
                findings.append(f"{feature_id}.{lane}: missing {field}")

    if status == "done" and not re.search(r"evidence|证据|gate|验收|test|测试", body, re.I):
        findings.append(f"{feature_id}.{lane}: done requires evidence")

    if status == "active":
        if not (data.get("active_notes") or {}).get(lane):
            findings.append(f"{feature_id}.{lane}: active requires active_notes")

    if status == "blocked":
        if not (data.get("blocks") or {}).get(lane):
            findings.append(f"{feature_id}.{lane}: blocked requires blocks")
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

        portfolio = data.get("portfolio_status")
        if portfolio not in PORTFOLIO_STATUSES:
            findings.append(f"{item['id']}: invalid portfolio_status")

        if portfolio == "pending_decision" and not (DECISION_RE.search(text) or "NEEDS_DECISION" in text):
            findings.append(f"{item['id']}: pending_decision without decision reference")

        for lane in LANES:
            summary["lanes"] += 1
            status = (data.get("status") or {}).get(lane)
            findings.extend(check_lane(item["id"], lane, status, lane_body(text, lane), data))

    result = {"pass": not findings, "summary": summary, "findings": findings}
    print(json.dumps(result, ensure_ascii=False, indent=2) if output_json else json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not findings else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    raise SystemExit(audit(args.json))
