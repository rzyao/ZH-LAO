---
status: frozen
date: 2026-08-30
---

# ADR-010：Social Profile、实时 Discovery 与二元关系模型

## 决策

每个 User 至多创建一个独立 Social Profile。资料内容按照片、兴趣、语言、Prompt 和偏好正规化；普通 Discovery 实时从事实表计算候选，只持久化 Exposure。Follow 是直接成立的单向事实，互关由服务层建立二人 Match；Block 是 Social 的当前关系事实，Trust & Safety 负责执法历史。

首期不建立访客、收藏、关注请求、喜恶、永久 Candidate、泛化事件、Match 成员或统计缓存表。公开动态及其点赞、评论和举报入口由 Social 拥有；独立 Community 能力延期。

## 原因

首期规模约一万注册用户，实时筛选可保持偏好、审核、Block 和关系变化立即生效，避免派生候选成为第二真相。固定二元关系比通用成员模型更符合 Follow→Match→聊天链路。平台维护的兴趣/Prompt 字典可降低 UGC 治理风险。

## 后果

服务层必须在事务中处理互关、结束 Match、双向偏好资格、照片/Prompt 排序和跨域 Block；数据库不使用 Trigger。统计和候选缓存未来可增加，但只能派生自事实表。字段级规格见 [Social 域](../domains/social/README.md)。
