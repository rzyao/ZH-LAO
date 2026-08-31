#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "docs/docs/development/workflow/AI_STAGE_REGISTRY.json"
OUTPUT = ROOT / "docs/docs/development/DOMAIN_LIFECYCLE_MATRIX.md"

LANE_LABELS = {
    "design": "设计 AI",
    "backend": "Backend AI",
    "admin": "Admin AI",
    "mobile": "Mobile AI",
    "integration": "集成 AI",
    "acceptance": "验收 AI",
}

STATUS_META = {
    "done": ("✅", "done"),
    "ready": ("▶", "ready"),
    "active": ("⏳", "active"),
    "todo": ("○", "todo"),
    "blocked": ("⛔", "blocked"),
    "recovery": ("🟣", "recovery"),
    "na": ("—", "na"),
}

STYLE = r"""
<style>
.ai-stage-matrix-page .VPContent,
.ai-stage-matrix-page .VPPage,
.ai-stage-matrix-page main,
.ai-stage-matrix-page .content-container { width: 100% !important; max-width: none !important; }
.ai-stage-matrix-page .VPContent,
.ai-stage-matrix-page main { padding-left: 0 !important; padding-right: 0 !important; }
.ai-stage-matrix-page table {
  display: block !important; width: calc(100vw - 8px) !important; max-width: none !important;
  margin: 8px 4px !important; overflow-x: auto !important; white-space: normal;
  border-collapse: separate; border-spacing: 0; font-size: 12px; line-height: 1.35;
}
.ai-stage-matrix-page th,
.ai-stage-matrix-page td {
  box-sizing: border-box; min-width: 180px !important; width: 180px !important;
  max-width: 180px !important; padding: 8px; vertical-align: top;
}
.ai-stage-matrix-page th:first-child,
.ai-stage-matrix-page td:first-child {
  position: sticky; left: 0; z-index: 2; min-width: 190px !important; width: 190px !important;
  max-width: 190px !important; font-weight: 700; background: var(--vp-c-bg-soft);
}
.ai-stage-matrix-page th:last-child,
.ai-stage-matrix-page td:last-child { min-width: 220px !important; width: 220px !important; max-width: 220px !important; }
.ai-stage-matrix-page thead th { font-weight: 700; background: var(--vp-c-bg-soft); }
.obj.feature { padding-left: 14px; font-weight: 600; }
.stage {
  display: inline-block; box-sizing: border-box; max-width: 100%; margin: 1px 2px 3px 0;
  padding: 3px 7px; border: 1px solid transparent; border-radius: 7px;
  font-size: 11px; font-weight: 700; line-height: 1.35; white-space: normal; text-decoration: none !important;
}
.stage-done { color: #166534; background: #dcfce7; border-color: #86efac; }
.stage-ready { color: #1d4ed8; background: #dbeafe; border-color: #93c5fd; }
.stage-active { color: #6d28d9; background: #ede9fe; border-color: #c4b5fd; }
.stage-todo { color: #4b5563; background: #f3f4f6; border-color: #d1d5db; }
.stage-blocked { color: #b91c1c; background: #fee2e2; border-color: #fca5a5; }
.stage-recovery { color: #7e22ce; background: #f3e8ff; border-color: #d8b4fe; }
.stage-na { color: #6b7280; background: transparent; border-color: transparent; }
.dark .stage-done { color: #86efac; background: rgba(22,101,52,.28); border-color: #166534; }
.dark .stage-ready { color: #bfdbfe; background: rgba(29,78,216,.28); border-color: #2563eb; }
.dark .stage-active { color: #ddd6fe; background: rgba(109,40,217,.30); border-color: #7c3aed; }
.dark .stage-todo { color: #d1d5db; background: rgba(75,85,99,.30); border-color: #6b7280; }
.dark .stage-blocked { color: #fecaca; background: rgba(185,28,28,.28); border-color: #dc2626; }
.dark .stage-recovery { color: #e9d5ff; background: rgba(126,34,206,.30); border-color: #9333ea; }
</style>
""".strip()


def parse_stage(value: list[str]) -> dict[str, str]:
    if not isinstance(value, list) or len(value) < 3 or len(value) > 5:
        raise ValueError(f"invalid stage tuple: {value!r}")
    stage = {"id": value[0], "label": value[1], "status": value[2]}
    if len(value) >= 4 and value[3]:
        stage["href"] = value[3]
    if len(value) == 5 and value[4]:
        stage["blocked_by"] = value[4]
    return stage


def validate(data: dict) -> None:
    if data.get("version") != 1:
        raise ValueError("AI_STAGE_REGISTRY version must be 1")
    lanes = data.get("lanes")
    if lanes != list(LANE_LABELS):
        raise ValueError(f"lanes must be exactly {list(LANE_LABELS)}")

    object_ids: set[str] = set()
    domain_ids: set[str] = set()
    for obj in data.get("objects", []):
        object_id = obj.get("id")
        kind = obj.get("kind")
        if not object_id or object_id in object_ids:
            raise ValueError(f"duplicate/empty object id: {object_id!r}")
        if kind not in {"system", "domain", "feature"}:
            raise ValueError(f"invalid object kind: {kind!r}")
        object_ids.add(object_id)
        if kind == "domain":
            domain_ids.add(object_id)

        for lane in lanes:
            for raw_stage in obj.get(lane, []):
                stage = parse_stage(raw_stage)
                if stage["status"] not in STATUS_META:
                    raise ValueError(f"invalid status: {stage['status']}")
                if stage["status"] == "blocked" and not stage.get("blocked_by"):
                    raise ValueError(f"blocked stage missing blocked_by: {stage['id']}")

        nxt = parse_stage(obj["next"])
        if nxt["status"] not in STATUS_META:
            raise ValueError(f"invalid next status: {nxt['status']}")

    for obj in data.get("objects", []):
        if obj["kind"] == "feature" and obj.get("parent") not in domain_ids:
            raise ValueError(f"feature {obj['id']} parent must be an existing domain")


def render_stage(stage: dict[str, str]) -> str:
    icon, css = STATUS_META[stage["status"]]
    title = stage["id"]
    if stage.get("blocked_by"):
        title += f" · blocked_by={stage['blocked_by']}"
    text = f"{icon} {html.escape(stage['label'])}"
    attrs = f'class="stage stage-{css}" title="{html.escape(title, quote=True)}"'
    href = stage.get("href")
    if href:
        return f'<a {attrs} href="{html.escape(href, quote=True)}">{text}</a>'
    return f"<span {attrs}>{text}</span>"


def render_cell(obj: dict, lane: str) -> str:
    raw = obj.get(lane, [])
    if not raw:
        return '<span class="stage stage-na">—</span>'
    return "<br>".join(render_stage(parse_stage(stage)) for stage in raw)


def render_object(obj: dict) -> str:
    label = html.escape(obj["label"])
    if obj["kind"] == "feature":
        return f'<span class="obj feature">↳ ◇ {label}</span>'
    if obj["kind"] == "system":
        return f'<span class="obj system">◆ {label}</span>'
    return f'<span class="obj domain">◆ {label}</span>'


def generate(data: dict) -> str:
    validate(data)
    lines = [
        "---", "layout: page", "sidebar: false", "aside: false", "outline: false", "footer: false",
        "pageClass: ai-stage-matrix-page", "status: derived-ai-stage-matrix",
        f"last_updated: {data['generated_at']}", "---", "",
        "| 对象 | 设计 AI | Backend AI | Admin AI | Mobile AI | 集成 AI | 验收 AI | 下一段提示词 |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for obj in data["objects"]:
        cells = [render_object(obj)]
        cells.extend(render_cell(obj, lane) for lane in data["lanes"])
        cells.append(render_stage(parse_stage(obj["next"])))
        lines.append("| " + " | ".join(cells) + " |")
    lines.extend(["", STYLE, ""])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail if committed matrix differs from registry")
    parser.add_argument("--write", action="store_true", help="write generated matrix")
    args = parser.parse_args()

    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    expected = generate(data)
    if args.check:
        current = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else ""
        if current != expected:
            print("AI stage matrix is out of date. Run: python scripts/generate_ai_stage_matrix.py --write", file=sys.stderr)
            return 1
        print("AI stage matrix: PASS")
        return 0

    OUTPUT.write_text(expected, encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
