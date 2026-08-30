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

- Content & Learning（「拆分学习域」会话已裁决拆分为两域，见 [Content 域](../domains/content/index.md)、[设计台账](design-register.md) D-147/D-148/D-149）：
  - **已解决（不再列 designing）**：域边界（Content = Canonical Learning Content、Learning = User Learning State & Facts）、依赖 `Learning → Identity` 与 `Learning → Content`（Learning depends on Identity and Content，逻辑依赖）、Audio 契约改为 `Audio Production → Content`、事件归属与跨域引用规则（引用教学内容用 Content logical UUID、引用学习事实才用 Learning logical UUID，`content_id` 与 `learning_record_id/progress_id` 不得混用）。
  - **已解决（D-150）**：43 张必建表逐表归属清单已冻结——`content.*` 31 张 / `learning.*` 10 张 / 2 张由 Audio Production 取代，权威清单见 [Content 数据库](../domains/content/database.md) 与 [Learning 数据库](../domains/learning/database.md)；被跨域引用的 Content 实体 `public_id` 统一 UUID logical ID。
  - **已解决（D-151）**：Translation ownership——canonical 教学翻译归 `content.translations`，用户即时翻译请求归 `learning.translation_requests`。
  - 剩余 `designing`：媒体引用的最终物理形态（Media/Asset 归 Platform Infrastructure，业务域只存 `asset_id` UUID，跨域不建 FK——ADR-018/D-152；Content/Learning 各 `*_media_id` 字段的落地方式待 Media Infrastructure 物理表定稿）、内容发布/版本系统的完整模型、TTS/翻译的运营额度与限流参数；`question_reviews` 是否在首期后启用。
- Identity：OTP/Session/Device 的未确认类型与约束，Refresh Token 轮换，Session 状态，设备安装唯一范围，`avatar_media_id` FK。
- Social（19 表「全域审计修正版定稿」已落盘，见 [Social 数据库](../domains/social/database.md) 与台账 D-135~D-138）：**已解决（不再列 designing）**——公开动态/评论的完整字段规格与 `visibility`、图片上限（照片 6 / 动态 9）、删除策略、Feed 索引、跨域 logical UUID 契约（六实体 `public_id`，`user_id`/`media_id` 跨域 UUID 无物理 FK）、Exposure 90 天 retention。剩余：资料关闭后恢复或重建的产品规则。
- Community：已正式并入 Social（全局最终版 ADR-018），不再独立成域；未来若真需独立社区能力再评估（首期动态事实已归 Social）。
- Chat（「全域审计后的最终修正版」已落盘，见 [Chat 数据库](../domains/chat/database.md) 与台账 D-130~D-134）：
  - **已解决（不再列 designing）**：跨域用户身份改为 Identity `logical UUID`（无跨域物理 FK）；`chat_message_image.asset_id` 改为 Media/Asset `logical UUID`（无跨域 FK，仅待 Media Infrastructure 物理表定稿后核对存在性）；`chat_direct_conversation` 定稿为三列（不保留 `created_at`）；`public_id` 定为 UUID（应用层生成，无前缀）。
  - 应用服务用例的请求/响应字段契约、错误码、分页游标与鉴权细节。
  - Outbox 已裁决为全系统唯一一套 `system_outbox_events`（Platform Infrastructure，D-117/D-127）；剩余为其物理字段、索引与 retention 参数（`designing`）。
  - 语音消息与聊天翻译是否进入首期：产品定位表列出语音/翻译/语音转文字，但 Chat 数据库首期只到 `TEXT`/`IMAGE`，需主会话确认是收缩产品范围还是延后数据库建模（D-056）。
  - 消息保留策略与用户注销后的匿名化规则（属 Account/Privacy/Compliance，Chat 已确定不物理删除）。
- **主键类型与跨域 FK 策略（已裁决，ADR-018）**：全局最终版采用混合主键（各域自定 BIGINT/UUID）+ 跨域 logical UUID + 跨域禁物理 FK；Commerce/Trust 的 `uuid` 写法合规，D-077/D-078/D-092 已 frozen，详见 [ADR-018](../adr/ADR-018-global-database-design-principles-final.md)。
- Rewards（V1 已定稿，见 [Rewards 数据库](../domains/rewards/database.md)；剩余为延期与联动项）：
  - **已审计确认**（D-096）：跨域引用统一 `uuid` logical reference（`source_event_id`/`subject_user_id`/`source_reference_id`/`user_id`/`target_reference_id`）；Rewards **不建独立 outbox 表**，跨域事件统一走项目级 `system_outbox_events`。
  - Commerce 侧 `reward_grant` 入账记录/发放确认的具体物理实现已随 ADR-018 裁决为 logical UUID 模式（compliant）；Rewards→Commerce 合同（`source_domain=REWARDS`、`source_reference_id=grant_no`、`idempotency_key=reward:{grant_no}`）已冻结，不受影响。
  - 权益型奖励（会员天数、Follow 额度、曝光、Entitlement 落表）与 POINT/EXP/BADGE/GIFT/COUPON 等新奖励资产，待真实产品需求出现再设计（D-075/D-081/D-089）。
  - Manual Reward Grant（后台手动发 Coin）V1 不实现；未来若需运营批量奖励，走「产生可信 Reward Event → 正常链路」或另行设计受控命令，不开放万能发币入口（D-087）。
  - 按用户所在时区奖励：V1 统一使用产品业务时区（D-083），按用户时区扩展延后。
  - Event 消费/发放的 Worker 批量大小、租约超时、重试间隔具体值是实现参数，未逐项定稿。
- Trust & Safety：
  - 治理链路 6 表逻辑模型已 `baseline`（D-090/D-091），物理约定（`uuid` 主键 + 跨域只存逻辑 ID 不建 FK）已随 ADR-018 裁决为合规（D-092 frozen），可据此落 migration。
  - 真人认证（Verification）子域本会话未重新设计，旧实体 `VerificationCase`/`VerificationMedia` 仍为 `designing`，表细节待后续会话（D-094）。
  - `moderation_evidence.storage_key`（Trust 自持证据存储键）早于 D-127/D-152 的 Asset Infrastructure 收口，是否迁移为 Media/Asset `asset_id` logical UUID 待裁决；Trust 6 表其余设计与本次全局分区收口无冲突。
- Operations（V1 5 表已定稿 `frozen`，见 [Operations 数据库](../domains/operations/database.md) 与 [设计台账](design-register.md) D-105~D-112）：
  - 后台认证机制（登录、Session、MFA、失败锁定、邀请流程）归 Identity/Auth 域，本会话未设计；`operators.auth_subject_id` 的落点表待 Identity/Auth 定稿。
  - ~~Operations 稳定逻辑 ID 用 `varchar(20)`，与全局「跨域 logical UUID」存在类型差异，待主会话统一裁决~~ → **已裁决（D-153）**：全部 ID 统一 UUID，无 VARCHAR / UUID 双契约。
  - 工作队列、内容/用户运营、数据看板等后台能力 V1 明确不建；未来确有需求时再评估扩展 Operations 或归属 Platform（D-105）。
- Platform（V1 六表已定稿 `frozen`，见 [Platform 数据库](../domains/platform/database.md) 与 [设计台账](design-register.md) D-118~D-129）：
  - Media / Asset Infrastructure 的物理表、字段与生命周期状态枚举（会话冻结其为 `asset_id` 权威技术属主，具体状态枚举落地时单独定稿）。
  - `system_outbox_events` 的物理字段、索引与 retention 参数（会话仅给出示例字段：`event_id`/`source_domain`/`event_type`/`aggregate_type`/`aggregate_id`/`payload`/`occurred_at`/`published_at` 及 retry/delivery metadata）。
  - `regions.name` 是否在数据库存多语言文本（结合 Localization 设计）；未来引入稳定 Region UUID 后的跨域引用形态。
  - 未来新增客户端平台（web 等）时对 `feature_flag_overrides`/`app_versions`/`announcements` 三处 `client_platform` CHECK 的统一 migration（V1 仅 android/ios）。
  - Feature Flag 更高级灰度（用户级、百分比、版本表达式、时间窗口）与 `runtime_configs` 版本化/回滚：V1 明确不做，未来确有需求再单独设计正式模型（PLATFORM-06/07）。
- Audio Production（9 张业务表已定稿 `frozen`，见 [Audio 域](../domains/audio/index.md)、[Audio 数据库](../domains/audio/database.md) 与台账 D-139~D-144）：
  - **已按 D-148 修正**：canonical 内容/规范发音/Content Revision 的拥有者由 Learning 改为 **Content**（依赖 `Audio Production → Content`），Audio 仍只负责生产；原「Learning 拥有 canonical 内容与规范发音」表述不再使用。
  - ~~`audio_asset_versions` 自持文件事实与 Media/Asset Infrastructure 边界衔接待主会话裁决（D-146）~~ → **已裁决（D-152）**：物理文件事实唯一 canonical owner 为 Media/Asset Infrastructure，`audio_asset_versions` 只存 `asset_id` logical UUID，不自持存储元数据。
  - ~~旧 Learning `pronunciation_audios`/`tts_jobs` 的删除/迁移与计数调整待主会话确认~~ → **已裁决（D-145/D-150）**：由 Audio Production 取代，Content/Learning 最终计数为 31 + 10。
  - ~~Audio 各 operator 字段与 D-107 `varchar(20)` 的类型口径差异沿用未决项~~ → **已裁决（D-153）**：operator 引用统一 UUID。
- 一级域命名：**用户原始请求列出 `Messaging`，本项目已通过 ADR-015 将「Chat」定为唯一正式命名（`messaging` 名称已废弃）；本次「设计运营域」会话的域列表请求亦再次使用 `Messaging`，会话正文同时出现 `messaging.*` 与 `Chat` 两种写法。** 当前文档一律使用 `Chat`；若主会话希望改回 `Messaging`，需重新裁决命名并联动 PROJECT.md、Domain Map、数据库规范与目录。同理，用户域列表含 `Community`，但 D-005 已裁决 Community 能力并入 Social、不再独立成域，文档沿用该结论。**用户原始域列表中的单个 `Learning` 已由「拆分学习域」会话（分享 `6a937088`）裁决拆分为 `Content` + `Learning` 两域（D-147），业务 Schema 总数现为 11。**
- 前端、后端具体技术栈，API 风格、任务队列、部署与发布方案。

未决项只能由主架构会话决定；文档维护阶段不得自行填充。
