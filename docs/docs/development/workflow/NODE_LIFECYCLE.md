---
status: active
last_updated: 2026-09-02
---

# Development Stage 生命周期

Stage 可以经历准备、设计、执行、验证和 Gate，但不会因为某个 Feature 存在就自动生成一组占位 Stage。

```text
Task Manifest
→ Claim
→ Stage 执行
→ 验证
→ Gate / Report
→ Registry 与 NEXT_ACTIONS 同步
```

Stage 必须记录 `object_id`、`stage_id`、`phase`、范围、角色、依赖、允许路径、预期 Gate 和证据。状态变化只由真实任务与仓库证据触发；Feature Page 可以引用结果，但不成为完成状态的第二事实源。

Recovery 复用原 Stage 身份或创建明确命名的 Recovery Stage。不得通过新增永久分类隐藏失败，也不得把计划、Migration 或占位页面当作 Gate PASS。
