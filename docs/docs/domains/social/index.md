---
status: frozen
last_updated: 2026-08-31
schema: social
---

# Social 域

Social Domain 负责用户的**社交身份、交友偏好、发现、关系建立、用户主动 Block、公开动态与互动**。

Social 不拥有账号认证、聊天消息、资金交易、平台处罚或媒体文件的物理存储事实。

## 业务闭环

```text
创建社交资料
→ 完善照片 / 兴趣 / 语言 / Prompt
→ 设置发现偏好
→ 进入 Discovery
→ Follow
→ 双向 Follow 形成 Match
→ 获得聊天资格
→ 发布动态 / 点赞 / 评论
→ 用户主动 Block 或发起举报
```

## 核心业务规则

- `SocialProfile` 是用户主动进入社交场景后创建的公开社交身份；学习用户不要求天然拥有 SocialProfile。
- Follow 是单向关系事实；双方 Follow 时形成 Match。
- 取消任一方向 Follow 会结束当前 Match，但保留 Match 历史。
- Match / 社交关系只决定聊天资格，不拥有 Conversation 或 Message。
- `paused` 表示暂停被发现，不影响已经存在的 Match 和历史聊天。
- `closed` 表示退出 Social 功能，不等于删除 Identity 账号，也不等于抹除历史事实。
- `social_blocks` 是**用户主动建立的当前 Block 关系事实**。
- 平台 Ban / Suspend / Restrict 属 Trust & Safety，不使用 Social Block 代替。
- Social 可以提供举报入口，但**用户举报的 canonical fact 统一写入 `trust.reports`**；Social 不保存第二套举报事实。

## 核心能力

| 能力 | Social 拥有的事实 |
| --- | --- |
| 社交身份 | Profile、Photo、Interest、Language、Prompt |
| 发现 | Discovery Preference、Exposure |
| 关系 | Follow、Match、Block |
| 公开内容 | Post、Post Media、Like、Comment |
| 举报入口 | 入口与调用，不拥有 Report canonical fact |

## 跨域边界

| 协作方 | Social 的处理 |
| --- | --- |
| Identity | 引用用户稳定 logical UUID，不复制账号认证事实 |
| Chat | 提供当前聊天资格；不保存 Conversation / Message |
| Trust & Safety | 举报写入 Trust；平台治理和处罚由 Trust 拥有 |
| Commerce | 礼物交易、钱包、支付与退款全部由 Commerce 拥有 |
| Media / Asset Infrastructure | Social 只保存 `asset_id` logical UUID，不复制物理文件事实 |
| Infrastructure | 推送、可靠消息、技术日志和对象存储不进入 Social 业务模型 |

跨 Domain 引用使用稳定 logical/public UUID，不建立 physical FK。

## V1 数据范围

Social V1 固定 **19 张业务表**。其中不包含 `social_reports`；举报事实统一归 Trust & Safety。

推荐缓存、访客记录、Candidate 表等不是 V1 canonical 业务表。

## 当前明确不包含

- 独立举报事实表；
- Conversation / Message；
- 钱包、价格、支付、退款或礼物交易事实；
- 平台 Enforcement 历史；
- 媒体 object key、bucket、MIME、checksum 等物理存储字段；
- 为推荐性能提前建立的长期 Candidate / Statistics canonical 表。

## 文档地图

- [社交资料](profile.md)：Profile、Photo、Interest、Language、Prompt。
- [发现与关系](discovery-and-relationships.md)：Preference、Exposure、Follow、Match、Block。
- [动态与互动](community-content.md)：Post、Media、Like、Comment 与举报入口边界。
- [数据设计](database.md)：19 张表、跨域 ID、索引和 retention 规则。
