#!/usr/bin/env python3
"""Audit documentation authority, internal links, and Feature verification data.

This audit deliberately does not infer implementation.  It verifies that the
metadata used to make delivery claims is structurally accountable; evidence is
still assessed from code, tests, CI, and explicit human verification.
"""
from __future__ import annotations

import argparse
import re
from collections import defaultdict
from pathlib import Path
from urllib.parse import unquote, urlparse

import yaml


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs" / "docs"
FEATURES = DOCS / "developer" / "features"
REFERENCE = DOCS / "developer" / "reference"
LAYER_STATUSES = {"not_evidenced", "evidenced", "evidenced_limited", "not_applicable", "verified"}
DELIVERY_LAYERS = {"数据库", "Backend", "Admin", "Mobile", "Integration", "Acceptance"}
LINK_RE = re.compile(r"(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)")
FEATURE_LANE_RE = re.compile(r"feature[ -]?lane|六\s*lane|六栏模型", re.I)


def frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---", 4)
    if end < 0:
        return {}
    data = yaml.safe_load(text[4:end])
    return data if isinstance(data, dict) else {}


def resolve_link(source: Path, target: str) -> Path | None:
    target = unquote(target.split("#", 1)[0].split("?", 1)[0]).strip("<>")
    if not target or target.startswith(("http:", "https:", "mailto:", "tel:", "data:")):
        return None
    if target.startswith("/"):
        candidate = ROOT / target.lstrip("/")
        if not candidate.exists():
            candidate = DOCS / target.lstrip("/")
    else:
        candidate = source.parent / target
    options = [candidate]
    if candidate.suffix == "":
        options.extend((candidate.with_suffix(".md"), candidate / "index.md"))
    return next((option.resolve() for option in options if option.exists()), Path("__missing__"))


def audit_links(pages: list[Path]) -> tuple[list[str], dict[Path, int]]:
    issues: list[str] = []
    inbound: dict[Path, int] = defaultdict(int)
    for page in pages:
        for raw_target in LINK_RE.findall(page.read_text(encoding="utf-8")):
            resolved = resolve_link(page, raw_target)
            if resolved is None:
                continue
            if resolved.name == "__missing__":
                issues.append(f"broken link: {page.relative_to(ROOT)} -> {raw_target}")
            elif resolved.suffix == ".md":
                inbound[resolved] += 1
    return issues, inbound


def audit_feature_metadata() -> list[str]:
    issues: list[str] = []
    for page in sorted(FEATURES.glob("*.md")):
        if page.name == "index.md":
            continue
        data = frontmatter(page)
        layers = data.get("delivery_layers", {})
        if layers is not None and not isinstance(layers, dict):
            issues.append(f"invalid delivery_layers mapping: {page.relative_to(ROOT)}")
            continue
        layers = layers or {}
        for layer, value in layers.items():
            if layer not in DELIVERY_LAYERS:
                issues.append(f"unknown delivery layer {layer!r}: {page.relative_to(ROOT)}")
                continue
            if not isinstance(value, dict) or value.get("status") not in LAYER_STATUSES:
                issues.append(f"invalid delivery layer status for {layer}: {page.relative_to(ROOT)}")
                continue
            if value["status"] in {"evidenced_limited", "verified"} and not isinstance(value.get("note"), str):
                issues.append(f"{value['status']} layer requires a note: {page.relative_to(ROOT)} ({layer})")
        if data.get("last_verified_at") is not None:
            evidence = data.get("delivery_evidence")
            if not isinstance(evidence, list) or not evidence:
                issues.append(f"last_verified_at requires delivery_evidence: {page.relative_to(ROOT)}")
            if data.get("source_migration") != "manual":
                issues.append(f"last_verified_at requires source_migration: manual: {page.relative_to(ROOT)}")
    return issues


def audit_authority(pages: list[Path], inbound: dict[Path, int]) -> list[str]:
    issues: list[str] = []
    canonical = []
    for page in pages:
        text = page.read_text(encoding="utf-8")
        data = frontmatter(page)
        if FEATURE_LANE_RE.search(text):
            historical = "FEATURE_ARCHITECTURE_RESEARCH.md" in page.name or "PRODUCT_RESEARCH_REPORT.md" in page.name
            deprecated = re.search(r"(?:deprecated|retired|已退役|废弃).{0,80}(?:feature[ -]?lane|六\s*lane)|(?:feature[ -]?lane|六\s*lane).{0,80}(?:deprecated|retired|已退役|废弃)", text, re.I | re.S)
            if not historical and not deprecated:
                issues.append(f"unqualified deprecated Feature Lane reference: {page.relative_to(ROOT)}")
        if page.is_relative_to(REFERENCE) and data.get("status") in {"baseline", "frozen"}:
            canonical.append(page)
    # An index page is a navigational entry point; it is allowed to have no
    # incoming Markdown link. Others are reported as audit findings, not silently ignored.
    for page in canonical:
        if page.name != "index.md" and inbound.get(page.resolve(), 0) == 0:
            issues.append(f"orphan canonical document: {page.relative_to(ROOT)}")
    return issues


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--links-only", action="store_true")
    args = parser.parse_args()
    pages = sorted(DOCS.rglob("*.md")) + [path for path in ROOT.glob("*_RESEARCH*.md")]
    link_issues, inbound = audit_links(pages)
    issues = link_issues
    if not args.links_only:
        issues += audit_feature_metadata()
        issues += audit_authority(pages, inbound)
    print("DOCUMENT_AUTHORITY_AUDIT")
    print(f"pages_checked={len(pages)}")
    print(f"issues={len(issues)}")
    for issue in issues:
        print(f"  {issue}")
    if issues:
        return 1
    print("status=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
