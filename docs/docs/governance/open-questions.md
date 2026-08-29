---
status: designing
last_updated: 2026-08-30
---

# 未决与延期事项

## deferred

- 礼物接收者能否获得积分、兑换或收益。
- 具体支付渠道与中老两侧支付接入。
- Commerce V1 之外的会员 / Subscription / Entitlement 落表，以及促销、优惠券、提现、结算、Creator Earnings、多资产/冻结余额钱包等——等真实业务需求出现再设计；Entitlement 能力模型仍由 ADR-005 承载，仅落表延后（D-075）。
- 游客云同步、`platform.installations` 和注册时 Guest Data Migration。
- 未来是否拆分 Chat/Media；只有真实负载需要时评估。
- Chat 第一阶段明确不建：`chat_message_gift`、`chat_message_receipt`、`chat_delivery_receipt`、`chat_message_user_state`（单条仅自己删除非必需）、`chat_message_reaction`、`chat_group` / `chat_group_member`、`chat_message_translation`、`chat_message_attachment`。以后有明确需求通过新增表扩展。
- 独立 Notification Domain：只有在真正设计推送通知、系统通知、营销通知和设备 token 时才评估；当前归 Application/Infrastructure。

## designing

- Learning：Platform Media 跨 Schema FK 的最终 migration、内容发布/版本系统的完整模型、TTS/翻译的运营额度与限流参数；`question_reviews` 是否在首期后启用。
- Identity：OTP/Session/Device 的未确认类型与约束，Refresh Token 轮换，Session 状态，设备安装唯一范围，`avatar_media_id` FK。
- Social：公开动态/评论/举报的字段、状态枚举、可见性、图片上限、删除和 Feed 策略；资料关闭后恢复或重建的产品规则。
- Community：独立 Community 能力的业务边界和是否启动（首期动态事实已归 Social）。
- Chat：
  - 跨域用户身份 FK 的目标表（`identity.users` 或最终命名）。
  - `chat_message_image.asset_id` 指向 Platform Media 的具体 FK（等 Media 表定稿）。
  - `chat_direct_conversation` 是否保留 `created_at`（会话倾向的定稿版本只有三列）。
  - `public_id` 生成算法与各实体前缀（User/Conversation/Message 等；`usr_xxx` 仅为 illustrative）。
  - 应用服务用例的请求/响应字段契约、错误码、分页游标与鉴权细节。
  - Outbox 的最终表名与项目级统一方式（`system_outbox_event` / `infra_outbox_event`）。
  - 语音消息与聊天翻译是否进入首期：产品定位表列出语音/翻译/语音转文字，但 Chat 数据库首期只到 `TEXT`/`IMAGE`，需主会话确认是收缩产品范围还是延后数据库建模（D-056）。
  - 消息保留策略与用户注销后的匿名化规则（属 Account/Privacy/Compliance，Chat 已确定不物理删除）。
- **主键类型与跨域 FK 策略（Commerce V1 暴露的全局冲突，最高优先）**：
  - 全局 PostgreSQL 规范第 3 条要求 `bigint generated always as identity` 主键，D-055/ADR-015 已就 Chat 裁决「主键回归 identity」，Identity/Learning/Social/Chat 四域实际均为 `bigint identity`。
  - 但 Commerce V1 会话以 `uuid` 主键给出 DDL，并假设「整个项目一直采用 UUID」——该前提与既有基线不符。
  - 同时 Commerce 主张「跨域只存 ID 不建 FK」（`user_id`/`conversation_id`/`image_asset_id`/`business_id`/`operator_id`），与规范第 11/12 条及 Chat 已用的 `(conversation_id, user_id)` 复合 FK 现状冲突。
  - **需主架构会话裁决**：全项目统一 `bigint identity` 还是统一 UUID？跨域引用建不建物理 FK？裁决后同步 Commerce DDL 的主键与跨域列类型（D-077/D-078）。裁决前不得把 Commerce DDL 直接落 migration，也不得据此改动其他域或全局规范。
- Rewards：贡献事件、评分规则、条件、上限、奖励发放的具体表与字段；贡献分值/权重仍为 `illustrative`；Reward 如何经 `reward_grant` 写入 Commerce 钱包的发放记录主键与幂等（与上项 PK 裁决联动）。
- Trust & Safety/Operations/Platform：审核与限制状态机、RBAC、配置优先级、审计和媒体生命周期。
- 前端、后端具体技术栈，API 风格、任务队列、部署与发布方案。

未决项只能由主架构会话决定；文档维护阶段不得自行填充。
