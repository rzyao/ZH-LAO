---
status: baseline
last_updated: 2026-08-30
source_conversation: 数据库域设计；继续设计社交资料；设计聊天领域；设计 Commerce Domain；设计奖励域；设计 Trust & Safety Domain
source_conversation_id: 6a92f0c0-90b4-83ea-a43d-cccb1ef2666d；6a931551-8a30-83e9-8caf-60e529abce68；6a9319c2-2204-83ea-9341-7a57757a3082；6a933931-27f8-83ea-9df3-b054d2bca5fe；6a93401c-51bc-83ea-aa6e-ac314a5af8c8
source_share_url: https://chatgpt.com/share/6a9329e5-9f28-83ea-8eb1-f85be6e414fa；https://chatgpt.com/share/6a933931-27f8-83ea-9df3-b054d2bca5fe；https://chatgpt.com/share/6a933fa4-8d30-83ea-a28f-5d8c39fb5fac；https://chatgpt.com/share/6a93401c-51bc-83ea-aa6e-ac314a5af8c8
---

# 设计决策台账

来源：ChatGPT 会话“数据库域设计”“继续设计社交资料”“设计聊天领域”“设计 Commerce Domain”“设计奖励域”。用户明确选择，以及方案提出后以“继续/继续下一步”推进且未反对，均视为当前基线。

| ID | 结论 | 状态 | 事实源 | 备注 |
| --- | --- | --- | --- | --- |
| D-001 | 学习获客留存，社交建立关系，社交效率与礼物为主要商业化 | `baseline` | [产品定位](../product/product-overview.md) | 双边平台 |
| D-002 | Android 首发，中老同时服务，约 10,000 注册用户 | `baseline` | [产品定位](../product/product-overview.md) | 注册量与 DAU/MAU |
| D-003 | 学习全年龄，社交资格/资料/认证独立 | `baseline` | [产品定位](../product/product-overview.md) | 前期人工审核 |
| D-004 | 主要能力提前建设，以 Flag 和配置逐层开放 | `baseline` | [功能开放](../product/feature-rollout.md) | 非单一 social 开关 |
| D-005 | 十个一级 Domain | `baseline` | [Domain Map](../architecture/domain-map.md) | Language 合并进 Learning |
| D-006 | 模块化单体、一个主库、十个 Schema | `baseline` | [ADR-001](../adr/ADR-001-modular-monolith-and-domain-schemas.md) | 允许跨 Schema FK |
| D-007 | PostgreSQL 十二项全局规范 | `baseline` | [数据库规范](../architecture/database.md) | 数据库守完整性 |
| D-008 | User、AuthIdentity、BasicProfile、LearningProfile 分离 | `frozen` | [ADR-002](../adr/ADR-002-separate-user-identities-and-profiles.md) | 避免万能 users |
| D-009 | 游客不创建 User；手机号 E.164；学习方向固定 | `frozen` | [Identity 模型](../domains/identity/model.md) | 游客云同步 deferred |
| D-010 | Identity 七张表 | `frozen` | [Identity 数据库](../domains/identity/database.md) | 辅助表类型局部 designing |
| D-011 | User Status 为 active/disabled/closed | `frozen` | [Identity 数据库](../domains/identity/database.md) | suspended 已被取代 |
| D-012 | Follow 单向，互关由应用服务生成 Match | `baseline` | [ADR-003](../adr/ADR-003-follow-mutual-follow-match.md) | Match 后免费聊天 |
| D-013 | Block 归 Trust & Safety | `superseded` | [Social 关系](../domains/social/discovery-and-relationships.md) | 被 D-034 取代；Trust 仍拥有执法历史 |
| D-014 | 礼物交易归 Commerce；Chat 与礼物的集成属 `deferred`，当前 Chat 域不存在 `GiftMessageReference`、GIFT 消息类型、`chat_message_gift` 或 `sendGiftMessage()`；未来若设计，由 Commerce 定义集成模型 | `baseline` | [Commerce](../domains/commerce/index.md) | 支持多入口送礼；Chat 侧集成方式未定 |
| D-015 | Commerce/Rewards 通过 Entitlement 统一授予能力 | `baseline` | [ADR-005](../adr/ADR-005-entitlement-centered-authorization.md) | 不使用 is_vip |
| D-016 | 推荐采用硬筛选 + 可配置解释性评分 | `baseline` | [功能开放](../product/feature-rollout.md) | 不做 ML 推荐 |
| D-017 | Rewards 使用贡献事件、规则、条件、上限和奖励 | `superseded` | [Rewards](../domains/rewards/index.md) | 旧「Contribution/Scoring 计分模型」被 D-079~D-088 取代 |
| D-018 | Learning 知识分语言，课程/练习/进度统一 | `baseline` | [Learning 模型](../domains/learning/model.md) | 不强求语言学对称 |
| D-019 | Learning 使用 Content Registry | `baseline` | [ADR-004](../adr/ADR-004-learning-content-registry.md) | 禁止万能多态 FK |
| D-020 | Learning 第一版 43 张必建表与可选 question_reviews | `frozen` | [Learning 数据库](../domains/learning/database.md) | 会话口述 44，最终表名去重后为 43 |
| D-021 | `users.status=suspended` | `superseded` | [Identity 模型](../domains/identity/model.md) | 被 D-011 与 Restriction 替代 |
| D-022 | UserBlock 属于 Social | `superseded` | [Social 关系](../domains/social/discovery-and-relationships.md) | 中间曾移入 Trust；最终由 D-034 明确为 Social 当前关系事实 |
| D-023 | Knowledge Content 不物理删除；Registry 类型匹配由 Learning Service 校验 | `frozen` | [Knowledge](../domains/learning/knowledge.md) | 关系表可编辑 |
| D-024 | 课程层采用 Course → Unit → Lesson → Section → LessonItem | `frozen` | [Curriculum](../domains/learning/curriculum.md) | 仅 Course/Lesson 有发布状态 |
| D-025 | Practice 结构化定义，用户答案 JSONB | `frozen` | [Practice](../domains/learning/practice.md) | 题型按交互方式建模 |
| D-026 | Activity 历史与 Progress/Mastery/Review 当前状态分离 | `frozen` | [Progress](../domains/learning/progress.md) | 非 Event Sourcing |
| D-027 | Dictionary 复用 Knowledge；Equivalent、Relation、Tag 与 PostgreSQL pg_trgm 搜索 | `frozen` | [Dictionary](../domains/learning/dictionary.md) | 不建 dictionary_entries |
| D-028 | Pronunciation 与 Audio 拆分；TTS 使用异步 Job | `frozen` | [AI & Media](../domains/learning/ai-media.md) | Media 归 Platform |
| D-029 | 正式 Translation 与即时 Translation Request 分离 | `frozen` | [AI & Media](../domains/learning/ai-media.md) | 即时结果不自动入知识库 |
| D-030 | pronunciations.audio_media_id/voice | `superseded` | [Learning 数据库](../domains/learning/database.md) | 被 pronunciation_audios 取代 |
| D-031 | meanings.meaning 与仅 Content 级 examples | `superseded` | [Learning 数据库](../domains/learning/database.md) | 分别改为 definition/status 和可选 meaning_id |
| D-032 | Social 首期 20 张表与 Social Profile 聚合 | `frozen` | [Social 数据库](../domains/social/database.md) | 来源“继续设计社交资料”；资料、偏好、关系和曝光完整冻结 |
| D-033 | Discovery 实时算候选，只持久化 Exposure | `frozen` | [Social 发现](../domains/social/discovery-and-relationships.md) | 双向硬偏好；候选缓存不是事实源 |
| D-034 | `social_blocks` 为 Social 当前用户 Block 关系 | `frozen` | [Social 关系](../domains/social/discovery-and-relationships.md) | Trust & Safety 保留 restriction、审核和处罚所有权 |
| D-035 | 首期公开动态/互动/举报入口归 Social | `baseline` | [Social 动态](../domains/social/community-content.md) | 具体字段仍 `designing`；先前 Community 所有权被取代 |
| D-036 | 首期不建访客、收藏、关注请求、Candidate、事件或统计缓存表 | `frozen` | [Social 数据库](../domains/social/database.md) | `social_profile_stats` 仅未来缓存概念 |
| D-037 | Chat 只负责会话与消息，不维护社交关系与 Match 状态机 | `frozen` | [Chat](../domains/chat/index.md) | 发送时按业务策略判断权限 |
| D-038 | 同一用户对全生命周期只有一个 Direct Conversation | `frozen` | [ADR-011](../adr/ADR-011-chat-conversation-identity-and-direct-uniqueness.md) | `UNIQUE(user_low_id, user_high_id)` |
| D-039 | 共享会话状态与用户个人会话状态分离 | `frozen` | [会话模型](../domains/chat/conversation.md) | member 与 user_state 不合并 |
| D-040 | conversation 不建 `created_by`/`last_activity_at`/`message_count`/`metadata JSONB`/`deleted_at` | `frozen` | [会话模型](../domains/chat/conversation.md) | 语义模糊或当前无需求 |
| D-041 | `last_message_id/seq/at` 是派生查询状态，`last_message_id` 不加 FK | `frozen` | [会话模型](../domains/chat/conversation.md) | 避免与 message 双向依赖 |
| D-042 | member 不保留 `status` 与 `left_at` | `frozen` | [会话模型](../domains/chat/conversation.md) | 当前无真实成员生命周期 |
| D-043 | 已读使用 `last_read_seq` 游标，未读数为派生值 | `frozen` | [ADR-013](../adr/ADR-013-read-state-as-cursor-not-receipt-table.md) | 不建 receipt/delivery 表 |
| D-044 | 消息按 `seq` 排序，`seq` 在事务内由 `last_message_seq` 原子分配 | `frozen` | [ADR-012](../adr/ADR-012-message-seq-ordering-and-idempotency.md) | 不依赖 `created_at` |
| D-045 | `client_message_id UUID` + `UNIQUE(sender_user_id, client_message_id)` 幂等 | `frozen` | [ADR-012](../adr/ADR-012-message-seq-ordering-and-idempotency.md) | 唯一冲突视为 idempotent success |
| D-046 | 消息主体与内容 subtype 分离；首期 `type` 仅 `1=TEXT`、`2=IMAGE` | `frozen` | [消息模型](../domains/chat/message.md) | 应用服务保证 subtype 一致 |
| D-047 | 一条 IMAGE message 支持多图，Chat 只存 `asset_id` 引用 Media | `frozen` | [消息模型](../domains/chat/message.md) | 不存 URL/宽高/MIME，不建 `chat_attachment` |
| D-048 | 撤回只改 `status` 与 `recalled_at`，保留原始内容；不保留 `recalled_by_user_id` | `frozen` | [消息模型](../domains/chat/message.md) | 当前只能撤回自己发送的消息 |
| D-049 | 清空聊天记录使用 `cleared_before_seq` 可见边界，并同步推进 `last_read_seq` | `frozen` | [会话模型](../domains/chat/conversation.md) | 不逐条写隐藏，不删除消息 |
| D-050 | 隐藏会话用 `hidden_at` 而非 `deleted_at`；收到新消息或再次参与时恢复 | `frozen` | [会话模型](../domains/chat/conversation.md) | 数据库命名表达真实语义 |
| D-051 | `last_message_id IS NULL` 的空 conversation 不进入聊天列表 | `frozen` | [会话模型](../domains/chat/conversation.md) | 允许提前 get-or-create |
| D-052 | 不新增 Notification 域；通知与实时分发归 Application/Infrastructure | `baseline` | [ADR-014](../adr/ADR-014-no-notification-domain-events-outbox-infra.md) | 用户明确否决临时扩域 |
| D-053 | 领域事件在事务提交后由 Outbox 可靠投递 | `baseline` | [应用服务与事件](../domains/chat/application-and-events.md) | outbox 不算 Chat 核心业务表 |
| D-054 | 礼物从 Chat 第一阶段移除 | `deferred` | [消息模型](../domains/chat/message.md) | 等 Commerce 设计礼物体系时再定义集成 |
| D-055 | Chat 命名统一为 Chat 域 / `chat` Schema / 代码模块；表名保留 `chat_*` 单数含前缀，登记为全局「复数」规范正式例外；枚举回归 `varchar(32)+CHECK`、主键回归 `identity`、`chat_conversation`/`chat_message` 补 `public_id`，均与全局 PostgreSQL 规范一致 | `frozen` | [Chat 数据库](../domains/chat/database.md)、[ADR-015](../adr/ADR-015-chat-naming-and-sql-adjudication.md) | 逻辑模型 frozen；剩余物理项见 D-057 |
| D-056 | 产品首期含语音/翻译，但 Chat 数据库首期只到 TEXT/IMAGE | `designing` | [产品定位](../product/product-overview.md)、[消息模型](../domains/chat/message.md) | 由主架构会话裁决 |
| D-057 | Chat 物理 DDL 仍为 `designing`：跨域用户 FK 目标表、Media FK、`chat_direct_conversation.created_at` 是否保留、`public_id` 生成算法、Outbox 物理表 | `designing` | [Chat 数据库](../domains/chat/database.md) | 逻辑模型已 frozen；物理 DDL 补齐前不得直接复制执行 |
| D-058 | `listConversations` 过滤条件冻结为 `member.user_id = current_user` AND `conversation.last_message_id IS NOT NULL` AND `user_state.hidden_at IS NULL`，三者缺一不可 | `frozen` | [Chat 应用服务与事件](../domains/chat/application-and-events.md) | 缺 `hidden_at IS NULL` 会导致已隐藏会话仍出现在列表 |
| D-059 | Direct 会话成员集合不变量冻结：`type='direct'` 的 `chat_conversation_member` 必须恰好含 `{user_low_id, user_high_id}` 两条；成员仅由 `getOrCreateDirectConversation()` 创建，禁止通用 `addMember()` | `frozen` | [Chat 会话模型](../domains/chat/conversation.md) | 数据库不阻止第三成员，由应用服务同一事务创建并由集成测试覆盖 |
| D-060 | `canChat(sender, recipient)` 权限契约冻结：conversation active、sender 为 member、Social 授予聊天权限、无 Block、无 T&S messaging restriction；`paused` 不影响已有聊天，Match 后聊天永久免费，不检查任何付费权益 | `frozen` | [Chat 应用服务与事件](../domains/chat/application-and-events.md) | 判定在应用层，非数据库外键/触发器；Chat 不存 match_id/relationship status |
| D-061 | Commerce 独占「钱与虚拟资产」事实；Social/Chat 不处理资金，Chat 送礼只触发展示 | `frozen` | [ADR-016](../adr/ADR-016-commerce-money-and-append-only-ledger.md)、[Commerce](../domains/commerce/index.md) | 账务真相在 Commerce |
| D-062 | V1 采用虚拟币钱包模型：真钱充值兑换 Coins，礼物等用 Coins 消费 | `frozen` | [Commerce](../domains/commerce/index.md) | 非「即时逐笔扣真钱」 |
| D-063 | `commerce_wallets.balance` 是快照，`commerce_wallet_ledger` 是 append-only 资金真相（只 INSERT，不改删） | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | 纠错靠追加 Reversal |
| D-064 | 所有资产变化经统一 `WalletService.applyEntry` 单事务写 Ledger+余额；禁止各 Service/管理员直接 UPDATE wallet | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | 资产规则单一实现 |
| D-065 | Adjustment（无业务来源的人工/系统纠正，可正可负）与 Reversal（对某笔既有 Ledger 的反向冲正，金额相反、不冲正 Reversal、最多一次、无部分冲正）分离；二者无 status 只存成功事实 | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | 账务纠错机制，仍属 Commerce |
| D-066 | Ledger `business_type` 收口为六个完整业务名：`order_fulfillment / reward_grant / gift_send / wallet_adjustment / wallet_reversal / refund_recovery` | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | 不使用 purchase/reward 等模糊名 |
| D-067 | Reward 为独立域，Commerce 不建 `commerce_rewards`；奖励资产经 `reward_grant` 写入钱包，`business_id` 逻辑引用 Reward 域，不含奖励规则 | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | 见 D-017 Rewards 域 |
| D-068 | Product（真钱商品，V1 仅 coin_pack）与 Gift（Coins 消费对象）分离；`commerce_gifts` 不再经 `product_id` 依赖商品表 | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | 取代早期 `products 1:0..1 gifts` 设想 |
| D-069 | 历史交易用 Snapshot：`commerce_order_items` 与 `commerce_gift_sends` 保存当时价格/名称/类型；Catalog 改名改价不回算历史 | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | Catalog 是现在，Snapshot 是当时 |
| D-070 | 订单/支付/履约/退款/回收状态机冻结（见 Commerce 数据库）；Order 无 completed/fulfilled，履约由 Fulfillment 表达；Refund 与 RefundRecovery 绝不合并 | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | 允许 Payment refunded 而 RefundRecovery failed 的真实异常 |
| D-071 | `commerce_gift_sends` 只保存成功/冲正事实，状态 `succeeded/reversed`；余额不足/下架/关系不允许直接事务失败不落库；送礼事务 `GiftSend+debit+Ledger+Outbox` 一次提交 | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | 不落 pending/failed 垃圾交易 |
| D-072 | 真钱用 `amount_minor bigint + currency`，Coins 用 `bigint` 且不使用 `currency='COIN'`；两套金额严格分开 | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | Coin 非法币 |
| D-073 | V1 单资产钱包：一个用户一个 Coin Wallet、单一 balance；不做多资产/冻结/available-locked-bonus-paid 分桶 | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | 出现第二种资产或提现/竞拍/预授权再升级 |
| D-074 | 交易类表不做普通物理删除；Ledger/Adjustment/Reversal 正常业务不可 UPDATE/DELETE；拒绝 `commerce_transactions`/`commerce_wallet_transactions` 万能表 | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | 分领域建模 |
| D-075 | Commerce V1 明确不建：subscription/membership/entitlement 落表、promotions/coupons、creator_earnings/withdrawals/settlements、gift_inventory、wallet_debt/asset_accounts/frozen_balances；会员/Subscription/Entitlement 表延后到后续 Commerce 修订 | `deferred` | [Commerce](../domains/commerce/index.md) | Entitlement 能力模型仍由 ADR-005 承载，仅落表延后 |
| D-076 | Commerce V1 冻结为 16 张业务表（Catalog4/Ordering3/Payment2/Wallet4/Gifting1/Refund2）；`system_outbox_events` 属基础设施不计入 | `frozen` | [Commerce 数据库](../domains/commerce/database.md) | 送礼依赖 Outbox `GiftSent` 通知 Chat |
| D-077 | **冲突，待主会话裁决**：Commerce 会话 DDL 用 `uuid` 主键并假设「全项目一直用 UUID」，与 D-007 规范第 3 条、D-055/ADR-015「主键回归 identity」及 Identity/Learning/Social/Chat 四域实际 `bigint identity` 冲突 | `designing` | [Commerce 数据库](../domains/commerce/database.md)「与全局 SQL 规范的关系」、[未决事项](open-questions.md) | 文档维护不擅自改 UUID 也不擅自改回 bigint；不改全局规范/其他域 |
| D-078 | **冲突，待主会话裁决**：Commerce 会话主张「跨域只存 ID 不建 FK」（user_id/conversation_id/image_asset_id/business_id/operator_id），与规范第 11/12 条及 Chat 已用 `(conversation_id,user_id)` 复合 FK 现状冲突；若定 bigint 则这些跨域列需改型 | `designing` | [Commerce 数据库](../domains/commerce/database.md)、[未决事项](open-questions.md) | 域内 FK 保留不受影响 |
| D-079 | 三层职责边界冻结：源 Domain 定事实、Rewards 定奖励、Commerce 执行资产入账；Rewards 不碰钱包/Ledger，不创建 Refund/Adjustment/Reversal，不反向查询源域验证事实 | `frozen` | [ADR-017](../adr/ADR-017-rewards-boundary-and-event-driven-grant.md)、[Rewards](../domains/rewards/index.md) | 「设计奖励域」会话 |
| D-080 | Rewards V1 冻结 5 张表（programs/rules/events/grants/deliveries），字段级定稿；`reward_grants.event_id` NOT NULL（所有 Grant 必有事件来源）；明确不建 counters/claims/points/tasks/badges/levels 等 13 类表 | `frozen` | [Rewards 数据库](../domains/rewards/database.md) | 取代早期 ContributionEvent/ScoreRecord/RewardDefinition/RewardCampaign 草案 |
| D-081 | V1 奖励资产仅 `COIN`（`reward_type` CHECK）；`reward_amount > 0` 无负奖励；1 Grant = 1 奖励资产 = 1 Delivery（V1）；权益型奖励与 POINT/EXP/BADGE/GIFT/COUPON 延后 | `frozen` | [Rewards 数据库](../domains/rewards/database.md) | 扣回资产只能走 Commerce |
| D-082 | 三级幂等：Event `UNIQUE(source_domain, source_event_id)`；Grant `UNIQUE(dedupe_key)` + `UNIQUE(rule_id,event_id,user_id)`；Delivery `UNIQUE(idempotency_key)`（恒为 `reward:{grant_no}`）；`max_grants>1` 用 `pg_advisory_xact_lock`，不建 Counter 表 | `frozen` | [Rewards 数据库](../domains/rewards/database.md)、[Rewards 应用服务与事件](../domains/rewards/application-and-events.md) | 并发上限防「同时 COUNT=0 却双发」 |
| D-083 | 时间规则：所有奖励周期与 Rule 匹配用 `event.occurred_at`（业务实际时间），绝不用 `created_at/granted_at`；默认产品业务时区；晚到事件匹配发生时有效的 Rule Version；`RETIRED` 版本仍可处理其历史窗口内迟到事件；`PAUSED` 只拦「暂停之后」的新事件，已有 Grant 继续发放 | `frozen` | [Rewards 应用服务与事件](../domains/rewards/application-and-events.md) | 禁止 `WHERE status='ACTIVE'` 简单选规则 |
| D-084 | 事务边界：Grant 与 Delivery 同一 Rewards 本地事务创建；禁止跨 Domain 大事务；调用 Commerce 必须在提交后由 Delivery Worker 异步执行；`timeout` → `RETRY_WAIT` 并用**原** `idempotency_key` 重试 | `frozen` | [Rewards 应用服务与事件](../domains/rewards/application-and-events.md) | 超时 ≠ 发放失败 |
| D-085 | Rule 版本化：ACTIVE 后核心配置（触发事件/奖励类型/金额/条件/限额/生效时间）不可原地修改，只能新建 Version；`(program_id, rule_key)` 同一时刻最多一个 ACTIVE/PAUSED 版本；版本有效区间不允许重叠（应用层事务内保证，不引 GiST/EXCLUDE） | `frozen` | [Rewards 数据库](../domains/rewards/database.md) | 历史 Grant 永远可追溯 |
| D-086 | VOID 规则：仅「未成功发放」可 `Grant VOIDED + Delivery CANCELLED`（同一事务）；Delivery `PROCESSING` 禁止 VOID；已 `SUCCEEDED` 只能走 Commerce Adjustment/Reversal；「作废奖励」与「扣回资产」是两个业务决定，不同按钮隐式联动 | `frozen` | [Rewards 应用服务与事件](../domains/rewards/application-and-events.md) | 错误码 `REWARD_ALREADY_DELIVERED` |
| D-087 | 入口与后台边界：`reward_events` 只来自可信内部 consumer，禁止 C 端/公网 `POST events`、`POST grants`（Manual Grant V1 不实现）、`claim`（不建 `reward_claims`）；后台 4 模块（计划/规则/记录/发放异常）；VOID/RETRY 高风险权限分离；重试必须复用原幂等键 | `frozen` | [Rewards 应用服务与事件](../domains/rewards/application-and-events.md) | 防止客户端伪造事件 |
| D-088 | 删除规则：`reward_events/grants/deliveries` 永不普通 DELETE；Program/Rule 仅 `DRAFT` 未使用可删，生效后走 ENDED/ARCHIVED/RETIRED；历史 FK 一律 `ON DELETE RESTRICT` | `frozen` | [Rewards 数据库](../domains/rewards/database.md) | 生产历史可追溯 |
| D-089 | Outbox 与延期项：项目级 Outbox 统一方式待所有域设计结束确定；Rewards 若发布 `REWARD_GRANTED/REWARD_DELIVERED` 用 `rewards.outbox_events`（基础设施表，不计入 5 表）；权益型奖励、Manual Reward Grant、按用户时区奖励、新资产生态延后 | `deferred` | [Rewards 数据库](../domains/rewards/database.md)、[未决事项](open-questions.md) | 不提前造规划 |
| D-090 | Trust & Safety 治理链路 6 表（reports/moderation_cases/moderation_evidence/moderation_decisions/enforcement_actions/appeals）逻辑模型本会话审计定稿；用户未反对，会话结论为「可以正式冻结」 | `baseline` | [Trust 数据库](../domains/trust/database.md)、[Trust 域](../domains/trust/index.md) | 取代旧 ReviewTask/ReviewDecision/ModerationAction/Restriction/Ban 实体名（D-094） |
| D-091 | Trust 6 表审计修正（相对首版）：reports 删 status/updated_at 改不可变；cases 加 cancellation_code 及相关 CHECK；evidence 移除 user_submission、source 加 appellant、sha256 改 varchar+CHECK、加 appeal_id 与严格 payload CHECK；decisions 去 created_at 并加强 result/policy/actor CHECK；enforcement active→applied、加 cancelled、action_type 细化、加 appeal_id 与 ended_at/status_reason_code、加 permanent_action_expiry 等 CHECK；appeals 去 created_at、resolved_at→closed_at、加 decision_appellant_unique 与 lifecycle/time_order CHECK | `baseline` | [Trust 数据库](../domains/trust/database.md) | 属非破坏性收紧，未引入新表 |
| D-092 | **冲突，待主会话裁决**：Trust 6 表采用 `uuid` 主键 + 只保留域内物理 FK + 跨域只存逻辑 ID 不建 FK，与 Commerce V1 写法一致，与 D-007 第 3/11/12 条（bigint identity + 保留/允许跨 Schema FK）冲突；本会话进一步确认该冲突为项目级普遍现象 | `designing` | [Trust 数据库](../domains/trust/database.md)「与全局 PostgreSQL 规范的关系」、[数据库规范](../architecture/database.md)、[未决事项](open-questions.md) | 延用 D-077/D-078；裁决前 Trust DDL 不得直接落 migration，不改全局规范/其他域 |
| D-093 | Trust 统一审核目标协议 `subject_type + subject_id`（稳定公共类型 user/social_profile/social_post/social_post_image/chat_message/conversation），不建跨域 FK；`subject_type` 是领域协议非表名 | `baseline` | [Trust 数据库](../domains/trust/database.md)、[Domain Map](../architecture/domain-map.md) | 与 T&S-03 一致 |
| D-094 | 真人认证（Verification）子域本会话未重新设计；旧实体 VerificationCase/VerificationMedia 仍为 `designing`；旧 ReviewTask/ReviewDecision/ModerationAction/Restriction/Ban/UserBlock 被 6 表模型取代（`superseded`）；UserBlock 归 Social（`social_blocks`，D-034） | `designing` / `superseded` | [Trust 域](../domains/trust/index.md)、[Domain Map](../architecture/domain-map.md) | 真人认证表细节待后续会话 |
| D-095 | Trust 不直改 identity/social/chat/commerce/rewards；处置（content_remove/social_post_restrict/chat_send_restrict 等）经领域事件由属主域执行（T&S-12） | `baseline` | [Trust 域](../domains/trust/index.md)、[Domain Map](../architecture/domain-map.md) | 域边界原则 |

新增主会话结论时，先更新本台账，再更新唯一事实源和覆盖清单。
