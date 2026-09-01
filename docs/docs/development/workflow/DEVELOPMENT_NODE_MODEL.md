---
status: active
last_updated: 2026-09-02
---

# Development Stage 模型

开发执行的最小可领取单元是具有稳定 ID 的 Stage，而不是 Feature 与固定分类的笛卡尔积。

```text
Development Stage = stage_id + object_id + phase + sequence
```

- `stage_id`：全局稳定的执行标识。
- `object_id`：System、Domain 或 Feature。
- `phase`：`prep / design / execute / verify / gate`。
- `sequence`：同一对象内有依赖关系的执行顺序。
- `status`：由当前 Task、Claim、Gate 和仓库证据得出。

Feature Page 只保存能力范围、领域关系、页面关联和证据线索。Stage 细节进入 Task Manifest、Execution Brief、Blueprint、Registry 与 Gate / Report，不回写另一套固定状态矩阵，也不生成 `/development/nodes/*` 页面。

`AI_STAGE_REGISTRY.json` 使用 `stage_id` 作为执行身份；需要区分 Backend、Admin、Mobile 或其它实施轨时，在 Task 的实际 scope、role 和 owned paths 中表达。
