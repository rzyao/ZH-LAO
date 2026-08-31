#!/usr/bin/env python3
"""Verify the built Matrix exposes canonical Domain/Feature navigation."""
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "docs/docs/development/workflow/FEATURE_PAGE_INDEX.json"
MATRIX = ROOT / "docs/docs/development/DOMAIN_LIFECYCLE_MATRIX.md"
BUILT_MATRIX = ROOT / "docs/docs/.vitepress/dist/development/DOMAIN_LIFECYCLE_MATRIX.html"
LANE_ANCHORS = {
    "design": "设计",
    "backend": "backend",
    "admin": "admin",
    "mobile": "mobile",
    "integration": "集成",
    "acceptance": "验收",
}


def main() -> None:
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    matrix = MATRIX.read_text(encoding="utf-8")
    built = BUILT_MATRIX.read_text(encoding="utf-8")

    required_source_markers = (
        "<thead><tr><th>开发对象</th>",
        "laneHref(object.id, lane)",
        "objectHref(object)",
    )
    missing_source = [marker for marker in required_source_markers if marker not in matrix]
    if missing_source:
        raise ValueError(f"matrix source contract missing: {missing_source}")
    if "/development/nodes/" in built:
        raise ValueError("built Matrix still contains a Development Node Detail link")

    domains = {domain["id"] for domain in index["domains"]}
    missing_domains = [f"/domains/{domain}/" for domain in sorted(domains) if f"/domains/{domain}/" not in built]
    if missing_domains:
        raise ValueError(f"missing Domain links in built Matrix: {missing_domains}")

    missing_feature_links = []
    for feature in index["features"]:
        base = f"/features/{feature['id']}/"
        if base not in built:
            missing_feature_links.append(base)
            continue
        for lane, anchor in LANE_ANCHORS.items():
            target = f"{base}#{anchor}"
            if target not in built:
                missing_feature_links.append(target)
    if missing_feature_links:
        raise ValueError(f"missing Feature/Lane links in built Matrix: {missing_feature_links[:12]}")

    forbidden_overview_labels = (">▶ 就绪<", ">⏳ 进行中<", ">⛔ 阻塞<", ">⏸ 延期<", ">🟣 恢复<")
    leaked = [label for label in forbidden_overview_labels if label in built]
    if leaked:
        raise ValueError(f"Stage-level statuses leaked into Matrix overview: {leaked}")

    print(f"Feature Navigation: PASS ({len(index['domains'])} Domains; {len(index['features'])} Features; 6 lane anchors each)")


if __name__ == "__main__":
    main()
