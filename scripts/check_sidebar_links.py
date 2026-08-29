"""校验 VitePress 侧边栏 / 导航中的每个内部链接都指向真实存在的 md 文件，
并反向列出 docs/docs 下未被任何链接引用的孤儿页面。"""

from __future__ import annotations

import io
import os
import re

ROOT = os.path.join("docs", "docs")
CONFIG = os.path.join(ROOT, ".vitepress", "config.mts")


def main() -> None:
    cfg = io.open(CONFIG, encoding="utf-8").read()
    links = re.findall(r"link:\s*'([^']+)'", cfg)

    broken = []
    resolved = set()
    for link in links:
        if link.startswith("http"):
            continue
        rel = link.lstrip("/")
        target = (
            os.path.join(ROOT, rel, "index.md")
            if link.endswith("/")
            else os.path.join(ROOT, rel + ".md")
        )
        if os.path.isfile(target):
            resolved.add(os.path.normpath(target))
        else:
            broken.append((link, target))

    print("internal links:", len(links))
    print("broken:", broken if broken else "none")

    orphans = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d != ".vitepress"]
        for name in filenames:
            if not name.endswith(".md"):
                continue
            full = os.path.normpath(os.path.join(dirpath, name))
            if full == os.path.normpath(os.path.join(ROOT, "index.md")):
                continue
            if full not in resolved:
                orphans.append(full.replace(os.sep, "/"))

    print("orphan pages (not in sidebar/nav):", len(orphans))
    for o in sorted(orphans):
        print("  -", o)


if __name__ == "__main__":
    main()
