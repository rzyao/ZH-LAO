# 领域设计入口

ZH-LAO 当前共 **11 个正式业务领域**，对应 11 个 PostgreSQL 业务 Schema（`identity` / `content` / `learning` / `social` / `chat` / `audio` / `commerce` / `rewards` / `trust` / `operations` / `platform`）。

领域文档的目录、侧边栏与中文显示规则统一遵循 [领域文档规范](../governance/DOMAIN_DOCUMENT_STANDARD.md)。

| 领域 | 模型状态 | 数据库状态 | 文档 |
| --- | --- | --- | --- |
| 身份（Identity） | `frozen` | `frozen` / 辅助字段局部 `designing` | [身份领域](identity/index.md) |
| 内容（Content） | `frozen` | 31 张表逐表归属已裁决（D-150，`frozen`）：canonical 教学内容定义（Knowledge/Curriculum/Dictionary/Practice 定义、Content Revision、canonical 教学翻译 D-151）；权威清单见 [内容数据设计](content/database.md) | [内容领域](content/index.md) |
| 学习（Learning） | `frozen` | 10 张表逐表归属已裁决（D-150，`frozen`）：用户学习状态与事实（Progress/Mastery/Review/Activity、作答历史、用户即时翻译请求 D-151）；跨域引用统一 logical UUID | [学习领域](learning/index.md) |
| 社交（Social） | `frozen` | 19 张首期表（原 20 张，`social_reports` 已删除、举报归 `trust.reports`，D-115）；公开内容字段局部 `designing` | [社交领域](social/index.md) |
| 聊天（Chat） | `frozen` | 7 张表 `frozen`；物理 DDL（跨域用户 FK、Media FK、`public_id` 生成算法、Outbox 物理表）`designing`，用例字段契约 `designing` | [聊天领域](chat/index.md) |
| 音频生产（Audio Production） | `frozen` | 9 张业务表（slots/tasks/generation_attempts/asset_versions/reviews/task_events/task_batches/task_batch_items/default_presets）字段级 `frozen`（D-139~D-144，ADR-020）；canonical 内容/规范发音归 Content（D-148）；`audio_asset_versions` 只存 `asset_id` logical UUID 引用 Media/Asset Infrastructure（D-152）；operator 引用统一 UUID（D-153） | [音频生产领域](audio/index.md) |
| 商业（Commerce） | `frozen`（V1） | 16 张业务表 `frozen`；物理约定（UUID 主键 + 跨域只存 logical UUID 不建物理 FK）符合全局最终版 ADR-018，compliant；会员/Subscription/Entitlement 落表 `deferred` | [商业领域](commerce/index.md) |
| 奖励（Rewards） | `frozen` | 5 张表（programs/rules/events/grants/deliveries）`frozen`；项目级 Outbox 统一、Manual Grant、非 Coin 资产延后 | [奖励领域](rewards/index.md) |
| 信任与安全（Trust & Safety） | `frozen`（治理链路 6 表） | 6 表逻辑模型 `frozen`（本会话定稿）；`uuid` 主键 + 跨域只存 logical UUID 不建物理 FK 符合全局最终版 ADR-018，compliant（D-092）；真人认证 `designing` | [信任与安全领域](trust/index.md) |
| 运营（Operations） | `frozen` | 5 张表（operators/roles/operator_roles/role_permissions/operator_audit_logs）字段级 `frozen`；全部 ID 统一 UUID（D-153，取代早期 `varchar(20)` 方案）；后台认证机制归 Identity/Auth 未设计 | [运营领域](operations/index.md) |
| 平台（Platform） | `frozen` | 6 张业务表字段级 `frozen`（全域审计最终修正版）；`runtime_configs` 仅 current-state；Media/Asset Infrastructure（物理文件事实唯一 canonical owner，D-152）与 `system_outbox_events` 物理细节 `designing` | [平台领域](platform/index.md) |

**历史归档**：[Community](community/index.md) 已正式并入 Social（全局最终版 [ADR-018](../adr/ADR-018-global-database-design-principles-final.md)），不再是独立领域、不再拥有独立 Schema，其文档仅作为迁移记录保留。

领域之间的完整关系见 [领域关系图](../architecture/domain-map.md)。实体名称是业务基线，不意味着已决定同名数据库表。