---
status: active
---

# Development Node 模型

一个 Development Node 是唯一的开发控制单元：

```text
Node = object_id × lane
```

例如 `login.mobile` 与 `identity.backend` 是两个不同 Node。Node 不是新的人工状态表；它的状态、进度、当前 Stage 与下一步均由归属的 Stage 派生。

`AI_STAGE_REGISTRY.json` 的 `nodes` 是由 Registry 与 Feature Inventory 生成的索引，`stage_metadata` 为每个已登记 Stage 提供 `object_id`、`lane`、`node_id`、`phase` 与 `sequence`。不得在 Node 上手工填写完成状态。

所有非 N/A Node 都必须有 `/development/nodes/<object_id>/<lane>/` 详情入口。详情页可以在尚未启动时存在，此时显示派生的 `todo`、空阶段和下一步。

Stage 归属于且只归属于一个 Node；一个 Node 可含多个 Stage。跨 Domain 依赖应成为该 Node 的 Stage 或 `blocked_by`，不能把另一个 Node 的状态复制过来。
