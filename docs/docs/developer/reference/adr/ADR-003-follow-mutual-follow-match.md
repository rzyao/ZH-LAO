---
status: baseline
date: 2026-08-30
---

# ADR-003：Follow 是关系源，互关形成 Match

## 决策

只维护单向 Follow。A 与 B 双向 Follow 时，由应用服务产生 Match，之后 Chat 可创建 Conversation。不另建 Like/Favorite 等重复关系。

## 后果

Match 是可审计业务结果，不由数据库触发器隐式生成。取消任一方向 Follow 会结束当前 Match，但历史保留；Match 固定二元关系，不存聊天缓存字段。字段级事实与 Block/Discovery 边界见 [Social 关系规格](/developer/reference/domains/social/discovery-and-relationships.md)。
