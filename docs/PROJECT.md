# ZH-LAO 项目知识入口

**项目：** 中文–老挝语综合学习与跨语言社交应用  
**整体阶段：** PostgreSQL V2 Baseline 与 Application Foundation 已 `COMPLETE / PASS`；Identity 详细设计为唯一 `NEXT` Phase
**首期目标：** Android，中老用户同时上线，不以中国大陆应用商店为主要发行渠道；约 10,000 注册用户，核心指标为注册量和 DAU/MAU。

## 当前设计基线

- 产品是双边平台：学习负责获客与留存，社交负责关系，商业化主要围绕社交效率和虚拟礼物。
- 后端采用模块化单体；一个 PostgreSQL 实例、一个主库、十一个业务 Schema（无 community Schema；Platform Infrastructure 含 outbox/asset 不计入业务 Schema）。
- 一级域（11 个业务域）：Identity、Content、Learning、Social、Chat、Commerce、Rewards、Trust & Safety、Operations、Platform、Audio Production；Community 能力已并入 Social，Notification 不作为独立域（全局最终版 ADR-018；Audio Production 为 D-139 新增、Content 为 D-147 拆分 Learning 所得）。
- **Content 与 Learning 拆分（「拆分学习域」会话，[ADR-021](docs/adr/ADR-021-content-and-learning-domain-split.md)，D-147~D-149；逐表归属 D-150、Translation 裁决 D-151）**：原 Learning 拆为 Content（canonical 教学内容：课程/词汇/句子/标准答案/标准发音要求/Content Revision/发布状态/canonical 教学翻译）与 Learning（用户学习状态与事实：进度/掌握/复习/历史/作答记录/用户即时翻译请求）；依赖 `Learning → Identity` 与 `Learning → Content`（Learning depends on Identity and Content；逻辑依赖，非物理 FK）；Learning 只存 `content_id` 等 logical references、不建跨域物理 FK、不得引用 Content 内部 BIGINT PK；被跨域引用的 Content 实体须有稳定 UUID logical/public ID；Audio 契约改为 `Audio Production → Content`（Content 拥有文本/规范发音/Content Revision，D-148）；事件归属与跨域引用按 D-149：内容事件归 Content、学习事件归 Learning，引用教学内容用 Content logical UUID、引用学习事实才用 Learning logical UUID；逐表归属（D-150）：`content.*` 31 张 / `learning.*` 10 张 / `pronunciation_audios`+`tts_jobs` 由 Audio Production 取代。
- Chat 与社交关系解耦：会话身份由用户对唯一确定，取消关注或重新互关不改变会话。
- Chat 全域审计最终修正版（D-130~D-134）：`public_id` 定为 UUID（内部 BIGINT `id` 不对外）、跨域引用统一 logical UUID 且无跨域物理 FK、37 条 application-level invariants 定稿。
- 实时推送不独立成域：Chat 发布领域事件，WebSocket/App Push 由基础设施负责。
- Commerce 独占「钱与虚拟资产」事实，采用虚拟币钱包 + 只追加账本；Social/Chat 不处理资金，Chat 送礼只展示。
- 代码定义能力，Feature Flag 决定开放，运营配置决定规则。
- Rewards 只做奖励决定与幂等发放编排（V1：奖励计划/规则版本/可信事件/奖励决定/发放，5 张表），资产入账由 Commerce 执行；三层职责：源域定事实、Rewards 定奖励、Commerce 执行。跨域引用统一 `uuid` logical reference、不建独立 Outbox（统一 `system_outbox_events`）。
- Operations 是后台控制平面：只负责后台运营主体 + RBAC 后台授权 + 后台操作审计（V1：operators/roles/operator_roles/role_permissions/operator_audit_logs，5 张表）；权限能力由代码 Registry 定义、数据库只配置角色权限关系；不承接任何业务域状态机；后台认证（登录/Session/MFA）归 Identity/Auth。
- Platform 是产品运行控制面（Product Runtime Control Plane）：V1 固定 6 张业务表（feature_flags/feature_flag_overrides/runtime_configs/app_versions/announcements/regions）；能明确归属业务域的配置一律回该域；`runtime_configs` 仅 current-state（无版本/回滚）；`system_outbox_events`（全系统唯一一套）与 Media/Asset 属共享技术基础设施，不计入六表；其他域不建指向 `platform.regions` 的跨域 FK（跨域用 `region_code` 逻辑引用）。
- Audio Production 独立成域（第 10 个业务域，ADR-020/D-139）：统一负责业务音频的生产、版本、审核、发布与生产审计（Slot → Task → Generation Attempt → Asset Version → Review，`audio` Schema 固定 9 张表）；`audio_slots.official_asset_version_id` 是正式音频唯一 canonical pointer；TTS Provider/Model/Voice 参数归 TTS 服务自维护；取代 Learning 旧 `pronunciation_audios`/`tts_jobs`（D-145）。

## 文档地图

- [V2 开发计划入口](docs/development/index.md)
- [V2 全量开发总计划](docs/development/MASTER_DEVELOPMENT_PLAN.md)
- [V2 开发进度记录表](docs/development/DEVELOPMENT_PROGRESS.md)
- [领域文档入口](docs/domains/index.md)
- [Content 域](docs/domains/content/index.md)
- [Learning 域](docs/domains/learning/index.md)
- [Chat 域](docs/domains/chat/index.md)
- [Commerce 域](docs/domains/commerce/index.md)
- [Operations 域](docs/domains/operations/index.md)
- [Platform 域](docs/domains/platform/index.md)
- [Audio 域](docs/domains/audio/index.md)
- [产品定位与范围](docs/product/product-overview.md)
- [业务与商业模型](docs/product/business-model.md)
- [功能开放与产品规则](docs/product/feature-rollout.md)
- [总体架构](docs/architecture/overview.md)
- [Domain Map](docs/architecture/domain-map.md)
- [PostgreSQL 总规范](docs/architecture/database.md)
- [设计台账](docs/governance/design-register.md)
- [未决事项](docs/governance/open-questions.md)
- [会话覆盖清单](docs/governance/source-coverage.md)
- [ADR 索引](docs/adr/index.md)

## 领域成熟度

| 领域 | 业务模型 | 数据库 |
| --- | --- | --- |
| Identity | `frozen` | `frozen`：7 张表；部分辅助表字段类型仍按字段级 `designing` 标注 |
| Content | `frozen` | 31 张表逐表归属已裁决（D-150，`frozen`）：canonical 教学内容定义类表（Knowledge 17 + Curriculum 6 + Dictionary 4 + Practice 4）；canonical 教学翻译归 `content.translations`（D-151）；权威清单见 [Content 数据库](docs/domains/content/database.md) |
| Learning | `frozen` | 10 张表逐表归属已裁决（D-150，`frozen`）：用户学习状态/行为类表（Progress 6 + Practice 作答 2 + Dictionary 搜索 1 + 用户即时翻译请求 1，D-151）；跨域引用统一 logical UUID；权威清单见 [Learning 数据库](docs/domains/learning/database.md) |
| Social | `frozen` | 19 张首期表「全域审计修正版定稿」字段级 `frozen`（原 20 张，`social_reports` 已删除、举报事实统一归 `trust.reports`，D-115/D-135~D-138）；跨域契约 compliant：六实体 `public_id UUID`、`user_id`/`media_id` 跨域 logical UUID 零物理 FK（与 ADR-018 一致）；资料关闭后恢复规则 `designing` |
| Community | `merged` | 已正式并入 Social（全局最终版 ADR-018），不再独立成域；独立社区能力未来再评估 |
| Chat | `frozen` | 7 张表定稿 `frozen`；「全域审计最终修正版」已落盘（public_id UUID、跨域 logical UUID 无物理 FK、37 条 invariants，D-130~D-134）；剩余物理 DDL（Outbox 物理表、UUID 分配实现）`designing`，用例字段契约 `designing` |
| Commerce | `frozen`（V1） | 16 张业务表 `frozen`；物理约定（UUID 主键 + 跨域只存 logical UUID 不建物理 FK）符合全局最终版 ADR-018，compliant；会员/Subscription/Entitlement 落表 `deferred` |
| Rewards | `frozen` | `frozen`：5 张表字段级定稿；审计确认跨域引用统一 `uuid` logical reference、Outbox 统一 `system_outbox_events`（D-096）；Manual Grant、非 Coin 资产延期 |
| Trust & Safety | `frozen`（治理链路 6 表） | 6 表逻辑模型 `frozen`（全域审计最终确认定稿）；`uuid` 主键 + 跨域只存 logical UUID 不建物理 FK 符合全局最终版 ADR-018，compliant（D-092）；`trust.reports` 为全系统唯一举报事实源、subject 三元组、Operations 逻辑 ID、统一 Outbox（D-113~D-117）；真人认证 Verification 子域 `designing` |
| Operations | `frozen` | `frozen`：5 张表（operators/roles/operator_roles/role_permissions/operator_audit_logs）字段级定稿；全部 ID 统一 UUID（D-153，取代早期 `varchar(20)` 方案，无 VARCHAR/UUID 双契约）；后台认证机制归 Identity/Auth 未设计 |
| Platform | `frozen` | `frozen`：6 张业务表（feature_flags/feature_flag_overrides/runtime_configs/app_versions/announcements/regions）字段级定稿（全域审计最终修正版，D-118~D-129）；`runtime_configs` 仅 current-state；Media/Asset Infrastructure 与 `system_outbox_events` 物理细节 `designing` |
| Audio Production | `frozen` | 9 张业务表（slots/tasks/generation_attempts/asset_versions/reviews/task_events/task_batches/task_batch_items/default_presets）字段级 `frozen`（D-139~D-144，ADR-020）；canonical 内容/规范发音归 Content（D-148，`Audio Production → Content`）；`audio_asset_versions` 只存 `asset_id` logical UUID 引用 Media/Asset Infrastructure（物理文件事实唯一 canonical owner，D-152）；operator 引用统一 UUID（D-153） |

## 状态说明

`baseline` 当前基线；`frozen` 已冻结；`designing` 尚缺实现决策；`deferred` 明确延期；`illustrative` 仅为示例；`superseded` 已被后续结论取代。详细规则见 [AGENTS.md](AGENTS.md)。
