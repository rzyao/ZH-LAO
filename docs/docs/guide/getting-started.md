---
status: active
last_updated: 2026-09-02
---

# 阅读与维护文档

## 阅读顺序

1. 从仓库根 `PROJECT.md` 了解项目入口和当前文档地图。
2. 根据问题类型进入对应 canonical 区域：
   - 产品问题 → `product/`
   - 系统结构 → `architecture/`
   - 领域业务事实 → `domains/`
   - 当前开发任务与证据 → `development/`
   - 设计治理与未决事项 → `governance/`
   - 历史架构取舍 → `adr/`
3. 如果任务涉及正式开发，再读取该任务的 Manifest、Execution Brief、Executable Spec（如已采用）、Implementation Blueprint 和相关 Gate。
4. 对重要历史取舍查阅 [ADR](../adr/index.md)，不要从历史讨论反推当前契约。

## Authority 原则

GitHub `main` 上的正式文档与代码是共享工作事实。

```text
当前 canonical 文档 / frozen authority
→ Task Manifest / Execution Brief
→ Executable Spec（如采用）
→ Implementation Blueprint
→ Code / Test / Gate Evidence
```

聊天上下文可以帮助推理和起草，但不能覆盖已经冻结的仓库事实。

## 文档状态

- `frozen`：该文档声明的契约已冻结，变更必须走正式设计修订。
- `baseline`：当前有效基线，可作为后续设计和实现输入。
- `designing`：仍存在待定设计，不能由实现者自行补全关键语义。
- `deferred`：明确不在当前范围，不能因为实现方便偷偷加入。

状态只说明该文档自身的设计成熟度，不等同于整个 Domain 已实现、已验收或已发布。

## 更新规则

1. 更新真正拥有该事实的 canonical 文档，不创建 `final`、`v2`、`new` 等平行真相。
2. 设计历史和取舍进入 ADR / governance，不塞回领域概览。
3. 实现进度、Gate、报告和恢复证据进入 `development/`，不污染 `domains/` 或 `architecture/`。
4. 文档路径迁移后，新的导航和正文应立即引用新 canonical 路径；只有历史引用需要时才保留最小迁移入口。
5. 删除文档前检查全仓引用，并以 VitePress `ignoreDeadLinks: false` 的实际构建结果验证内部链接。
