#!/usr/bin/env python3
"""Audit Feature metadata, lane evidence, titles, decisions, and semantic lane completeness."""
from __future__ import annotations

import re
from collections import Counter
from pathlib import Path

import yaml

from validate_feature_pages import FEATURES_DIR, LANES, HEADINGS, scan

TITLE_MARKER_RE = re.compile(r"(?:延期|待裁决|待设计)")
VISIBLE_STATUS_RE = re.compile(r"状态：\s*`?(todo|ready|active|blocked|done|na)`?", re.I)
DECISION_ID_RE = re.compile(r"\b[A-Z][A-Z0-9_-]*_DECISION\b")

SEMANTIC_MARKERS = {
    "scope": re.compile(r"(?:#{3,}\s*(?:Scope|范围)\s*$|\*\*(?:Scope|范围)\*\*\s*[：:]?|(?:Scope|范围)\s*[：:])", re.I | re.M),
    "stage": re.compile(r"(?:#{3,}\s*(?:Stage|执行阶段)(?:\s*/\s*(?:Artifact|工件))?\s*$|\*\*Stage\s*/\s*(?:Artifact|工件)\*\*\s*[：:]?|Stage\s*/\s*(?:Artifact|工件)|执行阶段与产物)", re.I | re.M),
    "gate": re.compile(r"(?:#{3,}\s*Gate(?:\s*/\s*(?:Evidence|完成证据))?\s*$|\*\*Gate\s*/\s*(?:Evidence|完成证据)\*\*\s*[：:]?|Gate\s*/\s*(?:Evidence|完成证据)|Gate\s*[：:])", re.I | re.M),
    "next": re.compile(r"(?:#{3,}\s*(?:Next Action|下一步)\s*$|\*\*(?:Next Action|下一步)\*\*\s*[：:]?|(?:Next Action|下一步)\s*[：:])", re.I | re.M),
}


def read_page(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    end = text.find("\n---", 4)
    return yaml.safe_load(text[4:end]), text


def section(text: str, lane: str) -> str:
    heading = f"## {HEADINGS[lane]}"
    return text.split(heading, 1)[1].split("\n## ", 1)[0]


def has_template_placeholder(body: str) -> bool:
    """Detect actual filler, not a lowercase status or a sentence rejecting placeholders."""
    for line in body.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if re.search(r"在此维护该?\s*Lane|相关工件、?Gate\s*与下一步|尚未回填|待补", stripped, re.I):
            return True
        if re.search(r"\b(?:TODO|TBD)\b", stripped):  # uppercase template tokens only
            return True
        if re.search(r"\bplaceholder\b", stripped, re.I) and not re.search(r"不能|不得|禁止|不把|不以|并非|不是|not\b|without\b", stripped, re.I):
            return True
    return False


def semantic_missing(body: str) -> list[str]:
    return [name for name, pattern in SEMANTIC_MARKERS.items() if not pattern.search(body)]


def active_activity_present(body: str) -> bool:
    """Active needs a repository-grounded current activity/stage, not fixed wording."""
    return bool(
        re.search(r"当前|进行中|正在|已进入|处于|\bactive\b|\bready\b|Stage|阶段", body, re.I)
        and re.search(r"Artifact|工件|Gate|Evidence|证据|Brief|Report|Stage|阶段", body, re.I)
    )


def blocked_detail_missing(body: str) -> list[str]:
    missing = []
    if not re.search(r"阻塞原因|NEEDS_DECISION|\bblocker\b|依赖|前置|尚未|未完成|未形成|未裁决|缺少|不存在|NOT_PASS|等待|当前没有|无稳定", body, re.I):
        missing.append("reason")
    if not re.search(r"阻塞对象|依赖|前置|Gate|Contract|契约|裁决|ownership|等待", body, re.I):
        missing.append("dependency")
    if not re.search(r"已完成|已有|现有|当前有效|Stage\s*/|工件|Evidence|canonical|设计|冻结", body, re.I):
        missing.append("completed_work")
    if not re.search(r"等待条件|解除阻塞|后再|后进入|完成后|待.+后|再启动|再进入|PASS|决策|裁决|重新激活|Portfolio", body, re.I):
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
                visible = VISIBLE_STATUS_RE.search(body)
                if visible and visible.group(1).lower() != status:
                    counts["status_conflicts"] += 1
                    findings.append(f"{feature['id']}.{lane}: visible status={visible.group(1).lower()} metadata={status}")
                if not visible:
                    counts["missing_visible_status"] += 1
                    findings.append(f"{feature['id']}.{lane}: visible status missing")
                missing = semantic_missing(body)
                if missing:
                    findings.append(f"{feature['id']}.{lane}: missing semantic fields {missing}")
                if has_template_placeholder(body):
                    counts["template_placeholders"] += 1
                    findings.append(f"{feature['id']}.{lane}: template placeholder")
                if status == "active" and not active_activity_present(body):
                    findings.append(f"{feature['id']}.{lane}: no grounded current activity/stage")
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
    print(f"MISSING_VISIBLE_STATUS={counts['missing_visible_status']}")
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
