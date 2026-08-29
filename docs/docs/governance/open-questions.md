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
  - **需主架构会话裁决**：全项目统一 `bigint identity` 还是统一 UUID？跨域引用建不建物理 FK？裁决后同步 Commerce DDL 的主键与跨域列类型（D-077/D-078）。**Trust 6 表同样采用 `uuid` 主键 + 跨域只存逻辑 ID 不建 FK（D-092），与 Commerce 一致，一并待裁决。** 裁决前不得把 Commerce / Trust DDL 直接落 migration，也不得据此改动其他域或全局规范。
- Rewards（V1 已定稿，见 [Rewards 数据库](../domains/rewards/database.md)；剩余为延期与联动项）：
  - 项目级 Outbox 统一方式待所有域设计结束确定；Rewards 若发布 `REWARD_GRANTED/REWARD_DELIVERED` 用 `rewards.outbox_events`（基础设施表，不计入 5 张核心业务表）。
  - Commerce 侧 `reward_grant` 入账记录/发放确认的具体物理实现仍随 D-077/D-078 全局裁决联动；Rewards→Commerce 合同（`source_domain=REWARDS`、`source_reference_id=grant_no`、`idempotency_key=reward:{grant_no}`）已冻结，不受影响。
  - 权益型奖励（会员天数、Follow 额度、曝光、Entitlement 落表）与 POINT/EXP/BADGE/GIFT/COUPON 等新奖励资产，待真实产品需求出现再设计（D-075/D-081/D-089）。
  - Manual Reward Grant（后台手动发 Coin）V1 不实现；未来若需运营批量奖励，走「产生可信 Reward Event → 正常链路」或另行设计受控命令，不开放万能发币入口（D-087）。
  - 按用户所在时区奖励：V1 统一使用产品业务时区（D-083），按用户时区扩展延后。
  - Event 消费/发放的 Worker 批量大小、租约超时、重试间隔具体值是实现参数，未逐项定稿。
- Trust & Safety：
  - 治理链路 6 表逻辑模型已 `baseline`（D-090/D-091），但物理约定（`uuid` 主键 + 跨域只存逻辑 ID 不建 FK）与全局 PostgreSQL 规范第 3/11/12 条冲突，仍 `designing`，待主会话裁决（D-092，与 Commerce 的 D-077/D-078 为同一议题）。裁决前不得把 Trust DDL 直接落 migration。
  - 真人认证（Verification）子域本会话未重新设计，旧实体 `VerificationCase`/`VerificationMedia` 仍为 `designing`，表细节待后续会话（D-094）。
- Operations：运营人员、RBAC、工作队列、内容/用户运营、数据看板的状态机与字段仍 `designing`。
- Platform：Feature Flag、产品配置优先级、地区规则、媒体生命周期、通知与审计基础设施的物理模型仍 `designing`。
- 一级域命名：**用户原始请求列出 `Messaging`，但本项目已通过 ADR-015 将「Chat」定为唯一正式命名（`messaging` 名称已废弃，见 [Chat 域](../domains/chat/index.md)）。** 当前文档一律使用 `Chat`；若主会话希望改回 `Messaging`，需重新裁决命名并联动 PROJECT.md、Domain Map、数据库规范与目录。
- 前端、后端具体技术栈，API 风格、任务队列、部署与发布方案。

未决项只能由主架构会话决定；文档维护阶段不得自行填充。
