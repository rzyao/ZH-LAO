#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
chatgpt_share_export.py — 从 ChatGPT 分享链接导出可读会话正文

原理（经实战验证）：
  ChatGPT 的 /share/<id> 页面是 JS 渲染的，常规抓取只能拿到标题。
  真实正文藏在页面内嵌的 React Flight / turbo-stream 流式负载里，
  形式是一串 `streamController.enqueue("...");` 脚本块，每个块的内容是
  一段被 JSON 转义成字符串的 RSC 文本。把每个块用 json.loads('"'+块+'")'
  解码、拼接，得到完整的 flight 文本。flight 文本第一行是一个扁平引用数组
  （数组内用「负索引」相互引用对象），还原后即可从
  root['loaderData']['routes/share.$shareId.($action)']['serverResponse']['data']
  拿到会话节点与消息，逐条抽取正文。

用法：
  python chatgpt_share_export.py <share_url_or_id> [--out DIR] [--json] [--md] [--no-md]

依赖：仅 Python 标准库（urllib / gzip / json / re）。
"""

import argparse
import gzip
import io
import json
import os
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)
HTTP_TIMEOUT = 60

# 默认走本地 xray 代理（绕过 Cloudflare 等）。设为 None 或 --no-proxy 可直连。
DEFAULT_PROXY = "http://127.0.0.1:10088"


def build_opener(proxy: str = None):
    """构造 urllib opener；proxy 支持 http/https 与 socks4/socks5 协议。"""
    handlers = []
    if proxy:
        p = proxy.strip()
        low = p.lower()
        if low.startswith("socks4") or low.startswith("socks5"):
            try:
                import socks
                from sockshandler import SocksiPyHandler
            except ImportError:
                raise SystemExit(
                    "SOCKS 代理需要 PySocks：请 `pip install pysocks`，\n"
                    "或改用 HTTP 代理（如 http://127.0.0.1:10088）。"
                )
            scheme = socks.SOCKS5 if low.startswith("socks5") else socks.SOCKS4
            host, _, port = p.split("://", 1)[1].rsplit(":", 1)
            handlers.append(
                SocksiPyHandler(scheme, (host, int(port)))
            )
        else:
            handlers.append(
                urllib.request.ProxyHandler(
                    {"http": p, "https": p}
                )
            )
    return urllib.request.build_opener(*handlers)


# --------------------------------------------------------------------------- #
# 1. 抓取分享页 HTML
# --------------------------------------------------------------------------- #
def fetch_html(url: str, proxy: str = None) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",
        },
    )
    opener = build_opener(proxy)
    try:
        with opener.open(req, timeout=HTTP_TIMEOUT) as r:
            data = r.read()
            enc = (r.headers.get("Content-Encoding") or "").lower()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"HTTP 错误 {e.code}：{url}")
    except urllib.error.URLError as e:
        raise SystemExit(f"无法访问链接（网络或代理问题）：{e.reason}")

    if "gzip" in enc or data[:2] == b"\x1f\x8b":
        data = gzip.decompress(data)
    return data.decode("utf-8", errors="replace")


# --------------------------------------------------------------------------- #
# 2. 提取 flight 负载：所有 streamController.enqueue("...") 块
# --------------------------------------------------------------------------- #
def extract_flight(html: str) -> str:
    # 主模式：streamController.enqueue("....");
    blocks = re.findall(r'streamController\.enqueue\(\"(.*?)\"\)\s*;', html, re.S)

    # 兜底：部分页面可能是 self.__next_f / 其他 enqueue 形态
    if not blocks:
        blocks = re.findall(r'\.enqueue\(\"(.*?)\"\)\s*;', html, re.S)

    if not blocks:
        if "has been deleted" in html or "Conversation has been deleted" in html:
            raise SystemExit(
                "该分享链接已失效（页面提示 has been deleted）。"
                "内部会话 ID 与分享 ID 是两个命名空间，请用仍可打开的分享 URL。"
            )
        if "You need to enable JavaScript" in html:
            raise SystemExit("页面只返回了 JS 引导壳，没有 flight 负载——可能是反爬拦截。")
        raise SystemExit(
            "未在页面中找到 streamController.enqueue 负载（可能页面结构已变化）。"
        )

    # 每个块是被转义成字符串的 JSON，解码后得到 RSC 文本片段
    chunks = []
    for b in blocks:
        try:
            chunks.append(json.loads('"' + b + '"'))
        except json.JSONDecodeError:
            # 极少数情况下块本身已是普通文本，直接拼接
            chunks.append(b)
    return "".join(chunks)


# --------------------------------------------------------------------------- #
# 3. 还原 turbo-stream 扁平引用数组
#    flight 文本第一行是数组 arr；数组内用「负索引」互相引用对象。
# --------------------------------------------------------------------------- #
def resolve_flight(raw: str):
    lines = raw.split("\n")
    arr = None
    for ln in lines:
        ln = ln.strip()
        if not ln:
            continue
        try:
            obj = json.loads(ln)
        except json.JSONDecodeError:
            continue
        if isinstance(obj, list):
            arr = obj
            break
    if arr is None:
        raise SystemExit("flight 文本首行不是数组，无法解析。")

    N = len(arr)

    def at(i):
        if i < 0:
            i = N + i
        if 0 <= i < N:
            return arr[i]
        return None

    def is_refmap(v):
        if not isinstance(v, dict) or not v:
            return False
        for k, val in v.items():
            if not (isinstance(k, str) and k.startswith("_") and k[1:].lstrip("-").isdigit()):
                return False
            if not isinstance(val, int) or isinstance(val, bool):
                return False
        return True

    def resolve_idx(i, d=0):
        if d > 400:
            return None
        return resolve_val(at(i), d)

    def resolve_val(v, d=0):
        if d > 400:
            return None
        if isinstance(v, dict):
            if is_refmap(v):
                out = {}
                for k, vi in v.items():
                    ki = int(k[1:])
                    key = resolve_idx(ki, d + 1)
                    if not isinstance(key, (str, int, float)):
                        key = str(key)
                    out[key] = resolve_idx(vi, d + 1)
                return out
            return {k: resolve_val(x, d + 1) for k, x in v.items()}
        if isinstance(v, list):
            return [resolve_elem(x, d + 1) for x in v]
        return v

    def resolve_elem(x, d=0):
        if isinstance(x, bool):
            return x
        if isinstance(x, int):
            t = at(x)
            if isinstance(t, (dict, list, str)):
                return resolve_idx(x, d + 1)
            return x
        if isinstance(x, (list, dict)):
            return resolve_val(x, d + 1)
        return x

    return resolve_idx(0)


# --------------------------------------------------------------------------- #
# 4. 从解析后的 root 取出会话数据
# --------------------------------------------------------------------------- #
def find_share_data(root):
    ld = root.get("loaderData", {})
    if not isinstance(ld, dict):
        raise SystemExit("loaderData 不存在或格式异常。")
    key = next((k for k in ld if isinstance(k, str) and "share" in k), None)
    if key is None:
        raise SystemExit(
            "在 loaderData 中未找到 share 路由，可用 keys: %s" % list(ld.keys())[:10]
        )
    sr = (ld[key] or {}).get("serverResponse", {})
    data = sr.get("data")
    if not isinstance(data, dict):
        raise SystemExit("serverResponse.data 不存在或格式异常。")
    return data


# --------------------------------------------------------------------------- #
# 5. 抽取消息正文
# --------------------------------------------------------------------------- #
def text_of(message) -> str:
    if not isinstance(message, dict):
        return ""
    content = message.get("content") or {}
    if not content:
        # 个别消息直接把文本放顶层
        for k in ("text", "result", "summary"):
            if message.get(k):
                return str(message[k])
        return ""
    parts = content.get("parts") if isinstance(content, dict) else None
    out = []
    if isinstance(parts, list):
        for p in parts:
            if isinstance(p, str):
                out.append(p)
            elif isinstance(p, dict):
                t = p.get("text") or p.get("content")
                if t is not None:
                    out.append(str(t))
                elif "code" in (p.get("content_type") or ""):
                    out.append("```\n%s\n```" % (p.get("text") or ""))
    if not out and isinstance(content, dict):
        for k in ("text", "result", "summary"):
            if content.get(k):
                out.append(str(content[k]))
    return "\n".join(x for x in out if x)


def extract_messages(data):
    # 优先用 linear_conversation（已按时间排序的节点列表）
    nodes = []
    lc = data.get("linear_conversation")
    if isinstance(lc, list) and lc:
        nodes = [n for n in lc if isinstance(n, dict)]
    else:
        mapping = data.get("mapping") or {}
        if isinstance(mapping, dict):
            nodes = [v for v in mapping.values() if isinstance(v, dict)]

    seen = set()
    ordered = []
    for n in nodes:
        mid = n.get("id")
        if mid in seen:
            continue
        seen.add(mid)
        msg = n.get("message")
        if not msg:
            continue
        author = msg.get("author") or {}
        role = author.get("role") or msg.get("role")
        body = text_of(msg)
        ordered.append(
            {
                "id": mid,
                "parent": n.get("parent"),
                "role": role,
                "model": msg.get("model_slug") or "",
                "create_time": msg.get("create_time"),
                "status": msg.get("status"),
                "content_type": (
                    (msg.get("content") or {}).get("content_type")
                    if isinstance(msg.get("content"), dict)
                    else ""
                ),
                "body": body,
            }
        )
    return ordered


# --------------------------------------------------------------------------- #
# 6. 渲染
# --------------------------------------------------------------------------- #
def render_md(title: str, messages: list) -> str:
    lines = ["# %s" % (title or "ChatGPT 分享会话"), "", "_消息数：%d　总字符：%d_" % (
        len(messages), sum(len(m["body"]) for m in messages)), ""]
    for i, m in enumerate(messages, 1):
        role = (m["role"] or "?").upper()
        meta = []
        if m["model"]:
            meta.append("model=%s" % m["model"])
        if m["status"]:
            meta.append("status=%s" % m["status"])
        lines.append("\n---\n\n### [%02d] %s%s\n" % (
            i, role, ("　" + "　".join(meta)) if meta else ""))
        lines.append((m["body"] or "_(empty)_").rstrip() + "\n")
    return "\n".join(lines)


# --------------------------------------------------------------------------- #
# 主流程
# --------------------------------------------------------------------------- #
def normalize_url(arg: str) -> str:
    if arg.startswith("http://") or arg.startswith("https://"):
        return arg
    if re.fullmatch(r"[0-9a-fA-F-]{30,}", arg):
        return "https://chatgpt.com/share/%s" % arg
    raise SystemExit("无法识别参数：既不是 URL 也不是分享 ID -> %r" % arg)


def main():
    ap = argparse.ArgumentParser(
        description="从 ChatGPT 分享链接导出可读会话正文（.md / .json）")
    ap.add_argument("target", help="分享 URL 或分享 ID")
    ap.add_argument("--out", default=".", help="输出目录（默认当前目录）")
    ap.add_argument("--json", action="store_true", help="只输出 JSON")
    ap.add_argument("--md", action="store_true", help="只输出 Markdown")
    ap.add_argument(
        "--proxy",
        default=DEFAULT_PROXY,
        help="网络代理（http/https/socks4/socks5）。默认 %s；可用环境变量 HTTP_PROXY/HTTPS_PROXY 覆盖。" % DEFAULT_PROXY,
    )
    ap.add_argument("--no-proxy", action="store_true", help="不走代理，直接连接")
    args = ap.parse_args()

    # 代理优先级：--no-proxy > --proxy 显式 > 环境变量 > 默认代理
    proxy = None
    if not args.no_proxy:
        proxy = args.proxy
        if not proxy:
            proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("HTTP_PROXY")
    if proxy:
        print(">> 代理：%s" % proxy)
    else:
        print(">> 代理：直连（无代理）")

    url = normalize_url(args.target)
    print(">> 抓取：%s" % url)
    html = fetch_html(url, proxy=proxy)
    print("   页面大小：%d 字符" % len(html))

    raw = extract_flight(html)
    print("   flight 负载：%d 字符" % len(raw))

    root = resolve_flight(raw)
    data = find_share_data(root)
    title = data.get("title") or data.get("conversation_title") or ""
    messages = extract_messages(data)
    if not messages:
        raise SystemExit("解析完成但未提取到消息（节点可能没有 message 字段）。")

    total = sum(len(m["body"]) for m in messages)
    print("   提取消息：%d 条，正文 %d 字符" % (len(messages), total))

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    want_md = args.json is False
    want_json = args.md is False

    if want_md:
        md_path = out_dir / "transcript.md"
        md_path.write_text(render_md(title, messages), encoding="utf-8")
        print("   写出：%s" % md_path)
    if want_json:
        js_path = out_dir / "transcript.json"
        js_path.write_text(
            json.dumps(
                {"title": title, "messages": messages},
                ensure_ascii=False, indent=2),
            encoding="utf-8")
        print("   写出：%s" % js_path)

    print("\n角色分布：")
    for m in messages:
        print("  %-9s %6d chars  %s" % (m["role"], len(m["body"]), m["model"]))


if __name__ == "__main__":
    main()
