#!/usr/bin/env python3
"""Feature lifecycle audit v2.

Goals:
- separate structural validation from semantic validation
- emit machine-readable findings
- avoid relying on title text for lifecycle state
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
FEATURE_DIR = ROOT / "docs/docs/features"
LANES = ["design", "backend", "admin", "mobile", "integration", "acceptance"]
STATUS = {"todo", "ready", "active", "blocked", "done", "na"}

MARKERS = {
    "scope": ["Scope", "范围"],
    "stage": ["Stage", "阶段", "Artifact", "工件"],
    "gate": ["Gate", "Evidence", "证据"],
    "next": ["Next Action", "下一步"],
}


def load_page(path: Path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return None, text
    end = text.find("\n---", 4)
    return yaml.safe_load(text[4:end]), text


def sections(text):
    result = {}
    current = None
    for line in text.splitlines():
        if line.startswith("## "):
            current = line[3:].strip()
            result[current] = []
        elif current:
            result[current].append(line)
    return {k: "\n".join(v) for k, v in result.items()}


def audit_lane(feature, lane, status, body, findings):
    if status not in {"done", "active", "blocked"}:
        return
    for name, words in MARKERS.items():
        if not any(re.search(re.escape(word), body, re.I) for word in words):
            findings.append({"type": "missing_field", "feature": feature, "lane": lane, "field": name})

    if status == "blocked" and not re.search(r"阻塞|依赖|等待|NEEDS_DECISION|前置", body, re.I):
        findings.append({"type": "blocked_without_reason", "feature": feature, "lane": lane})

    if status == "done" and not re.search(r"Evidence|证据|Gate|验收|测试", body, re.I):
        findings.append({"type": "done_without_evidence", "feature": feature, "lane": lane})


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    findings = []
    total = 0

    for path in FEATURE_DIR.rglob("index.md"):
        data, text = load_page(path)
        if not data:
            continue
        total += 1
        statuses = data.get("status", {})
        for lane in LANES:
            status = statuses.get(lane)
            if status not in STATUS:
                findings.append({"type": "invalid_status", "feature": data.get("id"), "lane": lane})
                continue
            body = sections(text).get(lane) or text
            audit_lane(data.get("id"), lane, status, body, findings)

    result = {"features": total, "findings": findings, "pass": not findings}
    print(json.dumps(result, ensure_ascii=False, indent=2) if args.json else result)
    return 0 if not findings else 1


if __name__ == "__main__":
    raise SystemExit(run())
