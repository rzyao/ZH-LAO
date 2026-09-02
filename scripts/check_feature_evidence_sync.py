#!/usr/bin/env python3
"""Check whether feature pages' delivery_layers reflect recent code changes.

Stop hook 调用本脚本（只读、不写文件）：扫描 git 最近改动的后端模块 / 前端目录
/ 测试文件，映射到功能页，对比其 front matter 的 delivery_layers —— 报告
「有代码/测试证据但 delivery_layers 未反映」的功能，提示运行
``update_feature_evidence.py --feature <slug>`` 回写。

设计原则：只提示，不自动改。是否回写由 AI / 人决定（避免 AI 自证 Gate PASS）。

用法:
    python scripts/check_feature_evidence_sync.py [--since <commit>]
默认 --since 取最近一次涉及 apps/ 的提交之前（HEAD 与其父提交对比）。
"""

from __future__ import annotations

import argparse
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

LAYER_NAMES = ["数据库", "Backend", "Admin", "Mobile", "Integration", "Acceptance"]
EVIDENCE_STATUSES = {"evidenced", "evidenced_limited", "verified"}

# 后端模块名 ↔ 主领域（通常一致；不一致时在此补充）
# domain → 模块目录名
DOMAIN_MODULE = {}


def load_manifest() -> dict:
    data = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {f["id"]: f for f in data["features"]}


def recent_changed_paths(since: str) -> set[Path]:
    """返回 git diff --name-only 中与 apps/、database/ 相关的文件路径。"""
    try:
        proc = subprocess.run(
            ["git", "diff", "--name-only", since, "HEAD"],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
        )
        names = proc.stdout.splitlines()
    except (subprocess.SubprocessError, FileNotFoundError):
        names = []
    paths = set()
    for name in names:
        p = Path(name.replace("/", os.sep))
        if p.parts and p.parts[0] in ("apps", "database"):
            paths.add(p)
    return paths


def changed_modules(paths: set[Path]) -> set[str]:
    """提取发生改动的后端模块名（apps/backend/src/modules/<m>/）。"""
    modules: set[str] = set()
    for p in paths:
        parts = p.parts
        if len(parts) >= 4 and parts[0] == "apps" and parts[1] == "backend" and parts[2] == "src" and parts[3] == "modules":
            if len(parts) >= 5:
                modules.add(parts[4])
    return modules


def changed_test_domains(paths: set[Path]) -> set[str]:
    """提取发生改动的后端测试对应的 domain（test/integration/<dom>-*.test.ts）。"""
    doms: set[str] = set()
    for p in paths:
        parts = p.parts
        if len(parts) >= 4 and parts[0] == "apps" and parts[1] == "backend" and parts[2] == "test":
            name = p.name
            m = re.match(r"([a-z]+)-", name)
            if m:
                doms.add(m.group(1))
    return doms


def changed_frontend(paths: set[Path]) -> set[str]:
    """提取改动的 Admin/Mobile feature 目录名。"""
    dirs: set[str] = set()
    for p in paths:
        parts = p.parts
        if len(parts) >= 5 and parts[0] == "apps" and parts[1] in ("admin", "mobile") and parts[2] == "src" and parts[3] == "features":
            dirs.add(f"{parts[1]}:{parts[4]}")
    return dirs


def parse_frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return {}
    return yaml.safe_load(m.group(1)) or {}


def main() -> int:
    parser = argparse.ArgumentParser(description="Check feature evidence sync against recent code changes")
    parser.add_argument("--since", default=None, help="base commit for diff (default: HEAD~1)")
    args = parser.parse_args()

    # 默认取最近一次涉及 apps/ 的提交之前
    since = args.since
    if since is None:
        try:
            since = subprocess.run(
                ["git", "rev-parse", "HEAD~1"], cwd=str(ROOT), capture_output=True, text=True
            ).stdout.strip() or "HEAD~1"
        except subprocess.SubprocessError:
            since = "HEAD~1"

    paths = recent_changed_paths(since)
    if not paths:
        print("no recent code/test changes under apps/ or database/")
        return 0

    modules = changed_modules(paths)
    test_doms = changed_test_domains(paths)
    frontend = changed_frontend(paths)
    manifest = load_manifest()

    print(f"recent changes since {since}:")
    print(f"  backend modules: {sorted(modules) or '—'}")
    print(f"  test domains:    {sorted(test_doms) or '—'}")
    print(f"  frontend dirs:   {sorted(frontend) or '—'}")

    # 找出与这些改动相关的功能页
    stale: list[str] = []
    for feature_id, meta in manifest.items():
        page = FEATURES / f"{feature_id}.md"
        if not page.is_file():
            continue
        fm = parse_frontmatter(page)
        doms = [str(d) for d in (fm.get("domain") or [])]
        if not doms:
            continue
        # 判断该功能是否与改动相关：主领域有模块/测试改动，或前端目录名匹配
        relevant = False
        if any(dom in modules or dom in test_doms for dom in doms):
            relevant = True
        if feature_id in {p.split(":", 1)[1] for p in frontend}:
            relevant = True
        # 前端映射（lao-alphabet-management → content/alphabet）
        if "alphabet" in {p.split(":", 1)[1] for p in frontend} and feature_id == "lao-alphabet-management":
            relevant = True
        if not relevant:
            continue

        # 检查 delivery_layers 是否已反映
        layers = fm.get("delivery_layers") or {}
        missing: list[str] = []
        for layer, info in layers.items():
            if layer not in LAYER_NAMES or not isinstance(info, dict):
                continue
            if str(info.get("status")) in EVIDENCE_STATUSES:
                missing.append(layer)  # 已有证据
        # 与改动相关的层没有证据 → 提示
        has_evidence = any(
            isinstance(layers.get(l), dict) and str(layers[l].get("status")) in EVIDENCE_STATUSES
            for l in LAYER_NAMES
        )
        if not has_evidence:
            stale.append(feature_id)

    if stale:
        print("")
        print("以下功能有代码/测试改动，但 delivery_layers 尚未反映证据：")
        for sid in sorted(stale):
            print(f"  - {sid}")
        print("")
        print("如确认实现/测试已落地，请运行：")
        print("    python scripts/update_feature_evidence.py --feature <slug>")
    else:
        print("")
        print("所有相关功能页的 delivery_layers 均已反映证据（或无需更新）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
