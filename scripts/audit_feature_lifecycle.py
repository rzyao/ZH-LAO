#!/usr/bin/env python3
"""Audit Feature metadata, lane evidence, titles, decisions, and semantic lane completeness."""
from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

import yaml

from validate_feature_pages import FEATURES_DIR, LANES, HEADINGS, scan

TITLE_MARKER_RE = re.compile(r"(?:延期|待裁决|待设计)")
STATUS_RE_TEMPLATE = r"状态：\s*`?{status}`?"
DECISION_ID_RE = re.compile(r"\b[A-Z][A-Z0-9_-]*_DECISION\b")

SEMANTIC_MARKERS = {
    "scope": re.compile(r"(?:范围\s*[：:]|#{3,}\s*范围\b|\*\*Scope\*\*\s*[：:]?|\bScope\s*[：:])", re.I),
    "stage": re.compile(r"(?:执行阶段与产物|Stage\s*/\s*(?:Artifact|工件)|Stage\s*/[^\n]*(?:Artifact|工件))", re.I),
    "gate": re.compile(r"(?:Gate\s*/\s*(?:完成证据|Evidence|工件)|(?:Stage\s*/[^\n]*)?Gate\b|Gate\s*[：:])", re.I),
    "next": re.compile(r"(?:下一步\s*[：:]|#{3,}\s*下一步\b|\*\*Next Action\*\*\s*[：:]?|\bNext Action\s*[：:])", re.I),
}


def read_page(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    end = text.find("\n---", 4)
    return yaml.safe_load(text[4:end]), text


def section(text: str, lane: str) -> str:
    heading = f"## {HEADINGS[lane]}"
    return text.split(heading, 1)[1].split("\n## ", 1)[0]


def has_template_placeholder(body: str) -> bool:
    """Detect real template filler, not legitimate lowercase status words or negated mentions."""
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if re.search(r"在此维护该?\s*Lane|相关工件、?Gate\s*与下一步|尚未回填|待补", stripped, re.I):
            return True
        if re.search(r"\b(?:TODO|TBD)\b", stripped):  # case-sensitive by design; lowercase todo is a status
            return True
        if re.search(r"\bplaceholder\b", stripped, re.I) and not re.search(r"不能|不得|禁止|并非|不是|not\b|without\b", stripped, re.I):
            return True
    return False


def semantic_missing(body: str) -> list[str]:
    return [name for name, pattern in SEMANTIC_MARKERS.items() if not pattern.search(body)]


def active_progress_complete(body: str) -> bool:
    done = re.search(r"(?:已完成内容|已完成)\s*[：:]|已完成\s*/\s*当前进行", body)
    current = re.search(r"(?:当前进行内容|当前进行)\s*[：:]|已完成\s*/\s*当前进行", body)
    return bool(done and current)


def blocked_detail_missing(body: str) -> list[str]:
    missing = []
    if not re.search(r"阻塞原因|NEEDS_DECISION|\bblocker\b|依赖|前置|尚未|未完成|NOT_PASS|仍不存在|等待", body, re.I):
        missing.append("reason")
    if not re.search(r"阻塞对象|依赖|前置|Gate|Contract|等待", body, re.I):
        missing.append("dependency")
    if not re.search(r"已完成|已有|现有|Stage\s*/|工件|Evidence", body, re.I):
        missing.append("completed_work")
    if not re.search(r"等待条件|解除阻塞|后再|后进入|完成后|PASS|决策|裁决|重新激活|Portfolio", body, re.I):
        missing.append("unblock_condition")
    return missing


def main() -> int:
    index = scan()
    pages = {feature_id: FEATURES_DIR / feature_id / "index.md" for feature_id in (x["id"] for x in index["features"])}
    counts = Counter()
    findings: list[str] = []
    needs_decision_features: set[str] = set()
    needs_decision_blockers: set[str] = set()

    for feature in index["features"]:
        path = pages[feature["id"]]
        data, text = read_page(path)
        counts["features"] += 1
        counts[f"portfolio_{data['portfolio_status']}"] += 1

        decision_ids = set(DECISION_ID_RE.findall(text))
        if data["portfolio_status"] == "pending_decision" or "NEEDS_DECISION" in text or decision_ids:
            needs_decision_features.add(feature["id"])
            needs_decision_blockers.update(decision_ids)

        for lane in LANES:
            status = data["status"][lane]
            counts[status] += 1
            if status in {"done", "active", "blocked"}:
                counts["non_todo_na_lanes"] += 1
                body = section(text, lane)
                if not re.search(STATUS_RE_TEMPLATE.format(status=re.escape(status)), body):
                    counts["status_conflicts"] += 1
                    findings.append(f"{feature['id']}.{lane}: visible status differs from frontmatter")
                missing = semantic_missing(body)
                if missing:
                    findings.append(f"{feature['id']}.{lane}: missing semantic fields {missing}")
                if has_template_placeholder(body):
                    counts["template_placeholders"] += 1
                    findings.append(f"{feature['id']}.{lane}: template placeholder")
                if status == "active" and not active_progress_complete(body):
                    findings.append(f"{feature['id']}.{lane}: active scope/progress detail incomplete")
                if status == "blocked":
                    blocker = (data.get("blocks") or {}).get(lane)
                    if blocker:
                        decision_ids = set(DECISION_ID_RE.findall(str(blocker)))
                        if decision_ids or data["portfolio_status"] == "pending_decision":
                            needs_decision_features.add(feature["id"])
                            needs_decision_blockers.update(decision_ids)
                    missing_block = blocked_detail_missing(body)
                    if missing_block:
                        findings.append(f"{feature['id']}.{lane}: blocked detail incomplete {missing_block}")
                if status == "done" and not (data.get("evidence") or {}).get(lane):
                    findings.append(f"{feature['id']}.{lane}: done evidence missing")
            elif status == "todo":
                if lane in (data.get("evidence") or {}) or lane in (data.get("active_notes") or {}) or lane in (data.get("blocks") or {}):
                    counts["status_conflicts"] += 1
                    findings.append(f"{feature['id']}.{lane}: todo has non-todo evidence metadata")

        if TITLE_MARKER_RE.search(data["title"]):
            counts["status_conflicts"] += 1
            counts["title_pollution"] += 1
            findings.append(f"{feature['id']}: portfolio marker embedded in title")

    counts["needs_decision_features"] = len(needs_decision_features)
    counts["needs_decision_blockers"] = len(needs_decision_blockers)
    print(f"Feature lifecycle audit: {'PASS' if not findings else 'FAIL'}")
    print(f"features={counts['features']}")
    print("lane_status=" + ", ".join(f"{status}={counts[status]}" for status in ("todo", "ready", "active", "blocked", "done", "na")))
    print("portfolio_status=" + ", ".join(f"{status}={counts['portfolio_'+status]}" for status in ("active", "deferred", "pending_decision")))
    print(f"done_active_blocked_lanes={counts['non_todo_na_lanes']}")
    print(f"template_placeholders_in_done_active_blocked={counts['template_placeholders']}")
    print(f"STATUS_CONFLICT={counts['status_conflicts']}")
    print(f"TITLE_POLLUTION={counts['title_pollution']}")
    print(f"NEEDS_DECISION_FEATURES={counts['needs_decision_features']}")
    print(f"NEEDS_DECISION_BLOCKERS={counts['needs_decision_blockers']}")
    if needs_decision_features:
        print("NEEDS_DECISION_FEATURE_IDS=" + ",".join(sorted(needs_decision_features)))
    if needs_decision_blockers:
        print("NEEDS_DECISION_BLOCKER_IDS=" + ",".join(sorted(needs_decision_blockers)))
    for finding in findings:
        print("  "+finding)
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
