"""幂等地补齐 VitePress 侧边栏中缺失的页面入口（原子写入，避免并发编辑冲突）。

背景：docs/docs 下存在若干真实页面未被 .vitepress/config.mts 的 sidebar 引用，
导致站点无法通过导航到达（例如 Trust & Safety 数据库总览）。
本脚本只做「缺则插入」，已存在的条目不动，可重复执行。
"""

from __future__ import annotations

import io
import os
import sys

CONFIG = os.path.join("docs", "docs", ".vitepress", "config.mts")

# (anchor_link, new_entry_line)  新条目插到 anchor 所在行之后
INSERTS = [
    (
        "/domains/identity/database",
        "          { text: 'Identity 业务模型', link: '/domains/identity/model' },",
    ),
    (
        "/domains/learning/database",
        "          { text: 'Learning 业务模型', link: '/domains/learning/model' },",
    ),
    (
        "/domains/community/",
        "          { text: 'Community · 数据库待设计', link: '/domains/community/database' },",
    ),
    (
        "/domains/trust/",
        "          { text: 'Trust & Safety · 数据库总览', link: '/domains/trust/database' },",
    ),
    (
        "/adr/ADR-018-global-database-design-principles-final",
        "          { text: 'ADR-019 运营后台控制面', link: '/adr/ADR-019-operations-backoffice-control-plane' }",
    ),
]


def link_of(line: str) -> str | None:
    if "link:" not in line:
        return None
    tail = line.split("link:", 1)[1].strip()
    quote = tail[0] if tail and tail[0] in "'\"" else None
    if not quote:
        return None
    return tail[1:].split(quote, 1)[0]


def main() -> int:
    text = io.open(CONFIG, encoding="utf-8").read()
    lines = text.split("\n")
    existing = {link_of(l) for l in lines}
    changed = []

    for anchor, entry in INSERTS:
        new_link = link_of(entry)
        if new_link in existing:
            print(f"skip (exists): {new_link}")
            continue
        idx = next(
            (i for i, l in enumerate(lines) if link_of(l) == anchor and "text:" in l),
            None,
        )
        if idx is None:
            print(f"WARN anchor not found: {anchor} -> {new_link}")
            continue
        anchor_line = lines[idx]
        insert = entry
        # anchor 若是分组内最后一项（无尾随逗号），需要给它补逗号、并让新项收尾
        if not anchor_line.rstrip().endswith(","):
            lines[idx] = anchor_line.rstrip() + ","
            insert = entry.rstrip().rstrip(",")
        else:
            if not insert.rstrip().endswith(","):
                insert = insert.rstrip() + ","
        lines.insert(idx + 1, insert)
        existing.add(new_link)
        changed.append(new_link)

    if not changed:
        print("nothing to do")
        return 0

    tmp = CONFIG + ".tmp"
    with io.open(tmp, "w", encoding="utf-8", newline="") as f:
        f.write("\n".join(lines))
    os.replace(tmp, CONFIG)
    print("inserted: " + ", ".join(changed))
    return 0


if __name__ == "__main__":
    sys.exit(main())
