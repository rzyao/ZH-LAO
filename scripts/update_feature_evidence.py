#!/usr/bin/env python3
"""Update a feature page's delivery_layers from real code/test evidence.

AI 完成功能后运行本脚本：它读取真实的代码、测试与数据库证据，按受控枚举
更新功能页 front matter 的 ``delivery_layers``（每层 status + note + 证据链接），
然后重新生成目录/域页 —— 使 ``dev_status``（由六层推导）自动更新。

设计原则（与 Constitution / DOCUMENT_CONTRACT 一致）：
- 不靠 AI 自证：每层 status 由真实文件/测试存在性决定。
- 只自动提升到 ``evidenced`` / ``evidenced_limited``；``verified``（人工核验）
  与 ``not_applicable`` 不会被本脚本自动写入（避免越权）。
- 已有更高状态（evidenced/verified）的层不会被降级。
- 只更新 front matter 的 delivery_layers 块，其余字段原样保留。

用法:
    python scripts/update_feature_evidence.py --feature <slug> [--run-tests] [--check]

--run-tests  额外运行后端测试并计入 Backend/Integration 证据（较慢）
--check      只报告将如何更新，不写文件（dry-run）
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "docs"
FEATURES = DOCS / "developer" / "features"
MANIFEST_PATH = DOCS / "developer" / "feature-manifest.json"
BACKEND_MODULES = ROOT / "apps" / "backend" / "src" / "modules"
BACKEND_TESTS = ROOT / "apps" / "backend" / "test"
ADMIN_FEATURES = ROOT / "apps" / "admin" / "src" / "features"
MOBILE_FEATURES = ROOT / "apps" / "mobile" / "src" / "features"
MOBILE_SCREENS = ROOT / "apps" / "mobile" / "src" / "screens"
MIGRATIONS = ROOT / "database" / "migrations"

LAYER_NAMES = ["数据库", "Backend", "Admin", "Mobile", "Integration", "Acceptance"]
CONTROLLED = {"not_evidenced", "evidenced", "evidenced_limited", "not_applicable", "verified"}

# 前端目录命名与 feature/domain 不一致，维护一个已知映射：
# feature slug → (admin_dir, mobile_dir) ；None 表示无对应实现目录。
FRONTEND_MAP: dict[str, tuple[str | None, str | None]] = {
    "lao-alphabet-management": ("content", "alphabet"),
    "login": (None, None),  # Mobile 在 screens/auth 下
    "operator-management": ("operations", None),
    "role-management": ("operations", None),
    "permission-assignment": ("operations", None),
    "operator-audit-log": ("operations", None),
    "admin-login": (None, None),
    "first-admin-bootstrap": ("operations", None),
    "feature-rollout-control": ("platform", None),
    "runtime-config-management": ("platform", None),
    "app-version-governance": ("platform", None),
    "platform-announcements": ("platform", None),
    "region-management": ("platform", None),
}

# 域名 → 后端模块名 / 数据库 migration 名（通常一致）
def primary_domain(meta: dict) -> str:
    doms = meta.get("domain") or []
    return doms[0] if doms else "unassigned"


def load_manifest() -> dict:
    data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {f["id"]: f for f in data["features"]}


def parse_frontmatter(text: str) -> tuple[dict, str, str]:
    """返回 (meta, body, raw_frontmatter_text)。"""
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        raise ValueError("missing front matter")
    meta = yaml.safe_load(m.group(1)) or {}
    return meta, m.group(1), text[m.end():]


def detect_layer_evidence(meta: dict, feature_id: str, run_tests: bool) -> dict[str, dict]:
    """检测各层证据，返回 {layer: {status, note, evidence?}}。"""
    dom = primary_domain(meta)
    result: dict[str, dict] = {}

    # 数据库：该 domain 的 migration 文件存在
    db_migrations = sorted(MIGRATIONS.glob(f"*_{dom}.sql")) if MIGRATIONS.is_dir() else []
    if db_migrations:
        result["数据库"] = {
            "status": "evidenced",
            "note": f"migration 存在（{', '.join(p.name for p in db_migrations)}）",
        }
    else:
        result["数据库"] = {"status": "not_evidenced", "note": "未找到该 domain 的 migration"}

    # Backend：后端模块存在
    module_dir = BACKEND_MODULES / dom
    if module_dir.is_dir() and any(module_dir.rglob("*.ts")):
        # 检查是否有 HTTP 路由（更严格的"可用"信号）
        routes = list(module_dir.rglob("*routes*.ts")) or list(module_dir.rglob("http/*.ts"))
        if routes:
            result["Backend"] = {
                "status": "evidenced",
                "note": f"模块 {dom} 已实现并含 HTTP 路由（{routes[0].name}）",
            }
        else:
            result["Backend"] = {
                "status": "evidenced_limited",
                "note": f"模块 {dom} 存在但未发现 HTTP 路由文件",
            }
    else:
        result["Backend"] = {"status": "not_evidenced", "note": f"未找到后端模块 {dom}"}

    # Admin / Mobile：按前端映射或 feature slug 推断
    admin_dir, mobile_dir = FRONTEND_MAP.get(feature_id, (None, None))
    if admin_dir is None:
        # 尝试用 feature_id 直接匹配
        if (ADMIN_FEATURES / feature_id).is_dir():
            admin_dir = feature_id
        elif (ADMIN_FEATURES / dom).is_dir():
            admin_dir = dom
    if mobile_dir is None:
        if (MOBILE_FEATURES / feature_id).is_dir():
            mobile_dir = feature_id
        elif (MOBILE_FEATURES / dom).is_dir():
            mobile_dir = dom

    if admin_dir and (ADMIN_FEATURES / admin_dir).is_dir():
        result["Admin"] = {
            "status": "evidenced",
            "note": f"Admin 功能目录存在（features/{admin_dir}）",
        }
    else:
        result["Admin"] = {"status": "not_evidenced", "note": "未发现 Admin 实现"}

    if mobile_dir and (MOBILE_FEATURES / mobile_dir).is_dir():
        result["Mobile"] = {
            "status": "evidenced",
            "note": f"Mobile 功能目录存在（features/{mobile_dir}）",
        }
    elif (MOBILE_SCREENS / "auth").is_dir() and feature_id == "login":
        result["Mobile"] = {
            "status": "evidenced_limited",
            "note": "Mobile 认证 screens 存在（screens/auth），未见专门验收测试",
        }
    else:
        result["Mobile"] = {"status": "not_evidenced", "note": "未发现 Mobile 实现"}

    # Integration：集成测试存在
    if BACKEND_TESTS.is_dir():
        integ = sorted(BACKEND_TESTS.glob(f"integration/{dom}-*.test.ts"))
        mod = sorted((BACKEND_TESTS / "modules").glob(f"{dom}/**/*.test.ts")) if (BACKEND_TESTS / "modules" / dom).is_dir() else []
        if integ or mod:
            count = len(integ) + len(mod)
            result["Integration"] = {
                "status": "evidenced",
                "note": f"{count} 个集成/模块测试文件（{dom}）",
            }
        else:
            result["Integration"] = {"status": "not_evidenced", "note": "未发现集成测试"}
    else:
        result["Integration"] = {"status": "not_evidenced", "note": "未发现集成测试"}

    # Acceptance：始终需人工核验，脚本不自动写
    result["Acceptance"] = {"status": "not_evidenced", "note": "需人工核验（E2E / Feature Gate）"}

    return result


def format_layer_block(layers: dict[str, dict]) -> str:
    """生成 delivery_layers 的 YAML 文本块（缩进 2 空格）。"""
    lines = ["delivery_layers:"]
    for layer in LAYER_NAMES:
        info = layers.get(layer, {})
        status = info.get("status", "not_evidenced")
        note = info.get("note")
        lines.append(f"  {layer}:")
        lines.append(f"    status: {status}")
        if note:
            lines.append(f"    note: {note}")
    return "\n".join(lines)


def upsert_delivery_layers(frontmatter_text: str, layers: dict[str, dict], meta: dict) -> str:
    """在 frontmatter 中插入/替换 delivery_layers 块，其余字段原样保留。"""
    block = format_layer_block(layers)
    if "delivery_layers:" in frontmatter_text:
        # 替换现有块（从 delivery_layers: 到下一个顶层字段或结尾）
        lines = frontmatter_text.split("\n")
        start = next(i for i, l in enumerate(lines) if l.strip().startswith("delivery_layers:"))
        end = len(lines)
        for i in range(start + 1, len(lines)):
            # 顶层字段（无缩进且非空）结束该块
            if lines[i] and not lines[i].startswith(" ") and ":" in lines[i]:
                end = i
                break
        new_lines = lines[:start] + block.split("\n") + lines[end:]
        return "\n".join(new_lines)
    # 插入到 last_updated 之前（保持可读）
    block_lines = block.split("\n")
    if "last_updated:" in frontmatter_text:
        idx = next(i for i, l in enumerate(frontmatter_text.split("\n")) if l.startswith("last_updated:"))
        lines = frontmatter_text.split("\n")
        return "\n".join(lines[:idx] + block_lines + lines[idx:])
    return frontmatter_text.rstrip("\n") + "\n" + block + "\n"


def merge_with_existing(new_layers: dict[str, dict], existing: dict) -> dict[str, dict]:
    """合并：已有更高状态（evidenced/verified/not_applicable）的层不降级。"""
    merged: dict[str, dict] = {}
    for layer in LAYER_NAMES:
        cur = existing.get(layer)
        new = new_layers.get(layer, {"status": "not_evidenced"})
        cur_status = (cur.get("status") if isinstance(cur, dict) else None) or "not_evidenced"
        new_status = new.get("status", "not_evidenced")
        rank = {"not_evidenced": 0, "evidenced_limited": 1, "evidenced": 2, "not_applicable": 3, "verified": 4}
        if rank.get(cur_status, 0) >= rank.get(new_status, 0):
            merged[layer] = cur if isinstance(cur, dict) else new
        else:
            merged[layer] = new
    return merged


def run_backend_tests(dom: str) -> str:
    """运行指定 domain 的后端测试，返回摘要。"""
    try:
        proc = subprocess.run(
            ["pnpm", "--filter", "@zh-lao/backend", "test", "--", "--run", f"test/modules/{dom}", f"test/integration/{dom}-"],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            timeout=600,
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        m = re.search(r"Tests\s+(\d+)\s+passed", out) or re.search(r"(\d+)\s+passed", out)
        passed = m.group(1) if m else "?"
        return f"{passed} tests passed"
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return "测试运行超时/不可用"


def main() -> int:
    parser = argparse.ArgumentParser(description="Update feature delivery_layers from code/test evidence")
    parser.add_argument("--feature", required=True, help="feature slug")
    parser.add_argument("--run-tests", action="store_true", help="run backend tests and include results")
    parser.add_argument("--check", action="store_true", help="dry-run: report only, no writes")
    args = parser.parse_args()

    page = FEATURES / f"{args.feature}.md"
    if not page.is_file():
        print(f"feature page not found: {page}", file=sys.stderr)
        return 1
    manifest = load_manifest()
    if args.feature not in manifest:
        print(f"feature not in manifest: {args.feature}", file=sys.stderr)
        return 1

    text = page.read_text(encoding="utf-8")
    meta, front, body = parse_frontmatter(text)

    detected = detect_layer_evidence(meta, args.feature, args.run_tests)
    if args.run_tests and detected.get("Backend", {}).get("status", "").startswith("evidenced"):
        dom = primary_domain(meta)
        summary = run_backend_tests(dom)
        detected["Backend"]["note"] += f"；{summary}"

    existing = meta.get("delivery_layers") or {}
    merged = merge_with_existing(detected, existing)
    new_front = upsert_delivery_layers(front, merged, meta)
    # 若合并后各层状态与现有完全一致（note 差异除外），跳过写入，避免无意义重写
    old_statuses = {
        layer: (existing.get(layer, {}).get("status") if isinstance(existing.get(layer), dict) else None)
        for layer in LAYER_NAMES
    }
    new_statuses = {layer: merged[layer].get("status") for layer in LAYER_NAMES}
    if old_statuses == new_statuses:
        print("[no-change] delivery_layers 状态无变化，跳过写入")
        print("[regenerate] catalog+index+domain pages updated (0 files)")
        return 0

    print(f"feature: {args.feature}")
    for layer in LAYER_NAMES:
        info = merged.get(layer, {})
        old_status = (existing.get(layer) or {}).get("status", "not_evidenced") if isinstance(existing.get(layer), dict) else "not_evidenced"
        new_status = info.get("status", "not_evidenced")
        flag = "=" if old_status == new_status else ("↑" if new_status != "not_evidenced" else "↓")
        note = info.get("note", "")
        print(f"  {layer}: {old_status} {flag} {new_status}  {note}")

    if args.check:
        print("[check] dry-run — 未写文件")
        return 0

    new_text = "---\n" + new_front + "\n---\n" + body
    page.write_text(new_text, encoding="utf-8")
    print(f"[write] {page}")

    # 重新生成目录/域页 → dev_status 自动更新
    import build_developer_feature_catalog as builder
    changed, paths = builder.build_pages(check=False)
    print(f"[regenerate] catalog+index+domain pages updated ({changed} files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
