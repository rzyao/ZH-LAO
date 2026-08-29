---
status: frozen
last_updated: 2026-08-30
---

# Social 域

Social 负责用户的社交身份、交友偏好、发现、关系建立、社交内容和公开互动。第一阶段模型已冻结为 **19 张事实表**（原 20 张，`social_reports` 已由 Trust 会话删除，举报事实统一归 `trust.reports`，见 [D-115](../../governance/design-register.md)）；「全域审计修正版定稿」（[D-135~D-138](../../governance/design-register.md)）确认主体模型不变，并统一跨域 logical UUID 契约（六实体 `public_id`、`user_id`/`media_id` 跨域 UUID 无物理 FK）。推荐缓存、访客等不是首期表。

## 业务闭环

```text
创建资料 → 填写照片/兴趣/语言/Prompt → 设置偏好 → 审核通过
→ Discovery 曝光 → Follow → 双向 Follow = Match → Chat 聊天
→ 发布动态 → 点赞/评论 → 举报或 Block
```

- `SocialProfile` 是用户主动进入交友场景才创建的公开社交身份；一个 `User` 最多一个，学习用户不必拥有它。
- Follow 是直接成立的单向事实；双方 Follow 时由应用服务建立 Match。取消任一方向 Follow 会结束当前 Match，但必须保留 Match 历史。
- Match 后聊天免费；Conversation、消息和回执归 Chat，Social 不保存聊天字段。
- `paused` 仅停止发现新人，不影响既有 Match 和聊天；`closed` 是退出 Social 功能，不是账号或数据删除。
- Block 会阻止双方发现、建立关系及发送新消息；其当前关系事实采用 `social_blocks`，Trust & Safety 负责跨域执法、审核历史和处罚。
- 首期人工审核；业务表只保留当前审核可见性，不保存审核员、模型分数或历史。

## 规格页

- [资料与展示内容](profile.md)：Profile、照片、兴趣、语言、Prompt。
- [偏好、发现与关系](discovery-and-relationships.md)：偏好、Exposure、Follow、Match、Block。
- [动态、互动与举报](community-content.md)：Post、媒体、点赞、评论、举报。
- [数据库总览](database.md)：19 表清单、跨域 ID 契约、索引意图、retention 和明确不建的模型。

## 不负责

账号登录和学习进度归 Identity/Learning；私聊归 Chat；商品、价格、钱包和交易归 Commerce；通知、媒体文件存储、配置和审计基础设施归 Platform；审核案件、限制、处罚和申诉归 Trust & Safety。礼物的社交发送行为等待 Commerce 模型完成后再设计 `social_gift_sends`，当前不建表。
