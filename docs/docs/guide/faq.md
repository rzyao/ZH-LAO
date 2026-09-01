---
status: active
last_updated: 2026-09-02
---

# 常见问题

## `designing` 能直接用于开发吗？

不能。`designing` 表示仍存在未冻结设计；字段、状态机、接口、事务、安全或跨域契约中的关键空白，不能由实现者自行补全。

正式开发应以当前任务的 frozen / baseline authority、Task Manifest、Execution Brief、Executable Spec（如采用）和 Implementation Blueprint 为准。

## 聊天会话能覆盖仓库里的正式设计吗？

不能。

会话可以用于讨论、审计和生成候选修订，但 GitHub `main` 上的 canonical 文档、ADR、冻结契约和相关 Gate 才是共享工作事实。发生冲突时，应修订正式 authority，而不是让实现者按聊天记忆自行选择。

## 为什么不保留 `final-v2.md`、`new-design.md` 之类文件？

因为它们会制造多个“看起来都像最终版”的事实源。

同一个事实只保留一个 canonical 页面；历史取舍进入 ADR / governance，开发执行过程进入 `development/`。

## `/domains/` 和 `/development/` 有什么区别？

```text
/domains/     这个领域最终是什么？
/development/ 当前怎么开发、开发到哪里、有什么证据？
```

领域页保存长期业务事实；Brief、Blueprint、Gate、Report、Recovery、任务状态都属于开发区。

## 为什么有些旧 URL 还存在？

少量已经迁移的历史页面可能保留极小的兼容入口，只为了让旧 ADR 或治理记录不产生死链。它们不再是 canonical 文档，也不会出现在当前导航中。
