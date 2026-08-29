---
status: designing
last_updated: 2026-08-30
schema: community
---

# Community 数据库待设计项

预期表达 Post、PostImage、PostLike、Comment 和 FeedItem。Post 是否使用软删除属于业务级待定；图片数量示例不是正式上限。FeedItem 是业务实体候选，不代表必须持久化为表。

需要主会话确定字段、PK/FK/UNIQUE、点赞幂等、评论模型、可见性、审核状态、删除与恢复、Feed 查询和索引。
