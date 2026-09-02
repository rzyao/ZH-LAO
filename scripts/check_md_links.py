"""只读校验 docs/docs 下所有 Markdown 的内部链接与锚点。

等价于 VitePress `ignoreDeadLinks: false` 的死链检查，但不触碰文件系统写入 /
不清理构建目录，因此可在受限环境下运行。

检查项：
1. 相对链接（`./x.md`、`../y/z.md`、`x`）目标文件是否存在；
2. 站内绝对链接（`/developer/reference/domains/trust/`）是否能解析到 md；
3. 同页锚点（`#xxx`）与跨页锚点是否存在对应标题。
"""

from __future__ import annotations

import io
import os
import re
import sys
from urllib.parse import unquote

ROOT = os.path.join("docs", "docs")
LINK_RE = re.compile(r"\[(?:[^\]]*)\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*$", re.M)
CODE_FENCE_RE = re.compile(r"```.*?```", re.S)
INLINE_CODE_RE = re.compile(r"`[^`\n]*`")


def slugify(title: str) -> str:
    """近似 VitePress(markdown-it-anchor) 的 slug 规则。"""
    t = title.strip()
    t = re.sub(r"`([^`]*)`", r"\1", t)          # 去掉行内代码反引号
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)  # 链接取文字
    t = re.sub(r"[*_~]", "", t)
    t = t.lower()
    t = re.sub(r"[^\w\u4e00-\u9fff\- ]", "", t)
    t = t.strip().replace(" ", "-")
    return t


def strip_code(text: str) -> str:
    text = CODE_FENCE_RE.sub("", text)
    return INLINE_CODE_RE.sub("", text)


def collect() -> dict[str, set[str]]:
    """返回 {规范化md路径: {anchor,...}}"""
    anchors: dict[str, set[str]] = {}
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d != ".vitepress"]
        for name in filenames:
            if not name.endswith(".md"):
                continue
            full = os.path.normpath(os.path.join(dirpath, name))
            body = io.open(full, encoding="utf-8").read()
            # 只剔除围栏代码块；行内代码要保留给 slugify 自行处理反引号
            heading_src = CODE_FENCE_RE.sub("", body)
            found = {slugify(m.group(2)) for m in HEADING_RE.finditer(heading_src)}
            anchors[full] = found
    return anchors


def resolve(src: str, href: str) -> str | None:
    """把链接解析为 md 文件路径；无法解析返回 None。"""
    path = href.split("#", 1)[0]
    if not path:
        return os.path.normpath(src)
    if path.startswith("file:///"):
        # Historical evidence reports link to checked-out source files. Treat
        # those as local file references so Windows drive-letter paths are
        # validated instead of being mistaken for docs-relative paths.
        return os.path.normpath(unquote(path[len("file:///"):]))
    if path.startswith("/"):
        base = os.path.join(ROOT, path.lstrip("/"))
    else:
        base = os.path.join(os.path.dirname(src), path)
    base = os.path.normpath(base)
    if base.endswith(".md"):
        return base
    if base.endswith(("/", "\\")) or os.path.isdir(base):
        return os.path.normpath(os.path.join(base, "index.md"))
    if base.endswith(".html"):
        return base[: -len(".html")] + ".md"
    return base + ".md"


def main() -> int:
    anchors = collect()
    missing_file: list[str] = []
    missing_anchor: list[str] = []
    total = 0

    for src, _ in anchors.items():
        body = strip_code(io.open(src, encoding="utf-8").read())
        for m in LINK_RE.finditer(body):
            href = unquote(m.group(1)).strip()
            if href.startswith(("http://", "https://", "mailto:", "tel:", "data:")):
                continue
            total += 1
            target = resolve(src, href)
            if target is None:
                continue
            rel_src = src.replace(os.sep, "/")
            if target not in anchors:
                if not os.path.isfile(target):
                    missing_file.append(f"{rel_src} -> {href}")
                continue
            if "#" in href:
                frag = slugify(href.split("#", 1)[1])
                if frag and frag not in anchors[target]:
                    missing_anchor.append(
                        f"{rel_src} -> {href}  (目标 {target.replace(os.sep, '/')})"
                    )

    print(f"checked internal links: {total}")
    print(f"missing target file: {len(missing_file)}")
    for x in missing_file:
        print("  x", x)
    print(f"missing anchor: {len(missing_anchor)}")
    for x in missing_anchor:
        print("  ~", x)
    return 1 if missing_file or missing_anchor else 0


if __name__ == "__main__":
    sys.exit(main())
