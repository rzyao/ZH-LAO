---
feature_id: lao-alphabet-management
title: 老挝语字母管理
portfolio_status: active
domain:
- content
source_migration: manual
delivery_evidence:
- https://github.com/rzyao/ZH-LAO/tree/8f3237e/specs/002-lao-alphabet-management
- https://github.com/rzyao/ZH-LAO/blob/8f3237e/apps/backend/src/modules/content/domain/lao-character.ts
- https://github.com/rzyao/ZH-LAO/blob/8f3237e/apps/admin/src/features/content/alphabet/pages/AlphabetPage.tsx
- https://github.com/rzyao/ZH-LAO/blob/8f3237e/apps/mobile/src/features/alphabet/screens/AlphabetScreen.tsx
last_updated: 2026-09-02
last_verified_at: 2026-09-02
---

# 老挝语字母管理

## 用户价值

为教研人员建立可审核、可发布的老挝语基础字符内容，并让学习者在移动端按分类查看已发布字母及其发音投影。

## 使用者与可观察流程

- 内容管理员：录入字符、分类、子分类、IPA、说明和排序 → 保存 Draft → 编辑或派生工作 Revision。
- 审核员/发布者：提交审核 → 通过或驳回并记录意见 → 发布 Approved Revision → 旧发布版本归档。
- 学习者：请求公开字母表 → 只看到已发布且 online 的字符 → 按辅音、元音、符号及 `sort_order` 浏览；音频是否可播放由投影守卫决定。

## 范围与非范围

范围包括 `LaoCharacter`、不可变 `LaoCharacterRevision`、Unicode 唯一性、三类字符与子分类、IPA、`sort_order`、发音槽位/输入哈希规则、审核发布生命周期、Admin 管理页和 Mobile 查看页。不包含完整 Content Domain、课程/音节/词汇学习、Audio Production 全域实现或全系统端到端发布验收。

## 参与系统

| 系统 | 参与方式 |
| --- | --- |
| Database | Content 与 Audio 基线提供相关物理表，字段对齐仍待核验 |
| Backend | Content entity、Repository、Admin/Public routes 与用例 |
| Admin | AlphabetPage 及录入、审核组件和 API |
| Mobile | AlphabetScreen、API 与 Card 展示已存在 |

## 分层交付状态

| 层 | 状态 | 判断 |
| --- | --- | --- |
| 产品 | `defined / spec draft` | [Domain alphabet rules](/developer/reference/domains/content/alphabet)与[字母决策](/developer/reference/domains/content/decisions/alphabet-decisions)已定义；[Spec Kit spec](https://github.com/rzyao/ZH-LAO/blob/8f3237e/specs/002-lao-alphabet-management/spec.md)仍为 Draft |
| 数据库 | `baseline present; alignment pending` | `0400_content.sql`、`0600_audio.sql`、`1240_content_revision.sql`已有相关物理表；没有本 HEAD 新增的字母专用 migration，目标字段与旧基线映射需在 Feature Gate 前再次核验 |
| Backend | `implemented at migration baseline; targeted tests limited` | [Content module](https://github.com/rzyao/ZH-LAO/tree/8f3237e/apps/backend/src/modules/content)已包含实体、Repository、Admin/Public routes 和用例；当前针对测试为 2 files、6 tests PASS，未覆盖完整 HTTP/E2E 生命周期 |
| Admin | `implemented at migration baseline; acceptance pending` | [AlphabetPage](https://github.com/rzyao/ZH-LAO/blob/8f3237e/apps/admin/src/features/content/alphabet/pages/AlphabetPage.tsx)及录入、审核组件和 API 已存在；Admin 全套测试 69/70，通过项不能替代本 Feature 验收 |
| Mobile | `implemented at migration baseline; acceptance pending` | [AlphabetScreen](https://github.com/rzyao/ZH-LAO/blob/8f3237e/apps/mobile/src/features/alphabet/screens/AlphabetScreen.tsx)与 API/Card 已存在；本仓库未找到专门的 Alphabet UI 测试，Mobile 基础回归 63/63 通过 |
| Integration | `not evidenced` | Backend、Admin、Mobile 代码路径已连接，但未见真实数据、音频资产和设备端到端证据 |
| Acceptance | `not evidenced` | Spec Draft、退役旧看板的迁移记录与迁移时核验基线发生冲突；不能宣称 Content Domain 或完整字母 Feature Gate 已 PASS |

## 证据

- [002-lao-alphabet-management Spec Kit 工件](https://github.com/rzyao/ZH-LAO/tree/8f3237e/specs/002-lao-alphabet-management)
- [LaoCharacter entity](https://github.com/rzyao/ZH-LAO/blob/8f3237e/apps/backend/src/modules/content/domain/lao-character.ts)
- [LaoCharacterRevision state machine](https://github.com/rzyao/ZH-LAO/blob/8f3237e/apps/backend/src/modules/content/domain/lao-character-revision.ts)
- [Unicode / audio invariant tests](https://github.com/rzyao/ZH-LAO/tree/8f3237e/apps/backend/test/modules/content)
- 迁移时核验基线 `8f3237e` 提交说明明确包含 Backend、Admin、Mobile 字母实现；本地针对 Backend Content tests 2 files、6 tests PASS，Mobile 10 suites、63 tests PASS。

## 来源冲突、限制与下一步

- 迁移时核验基线 `8f3237e` 已有字母 Backend/Admin/Mobile 实现；迁移前旧看板曾将 Content 写为准备中或未完成，与该基线发生来源冲突。该冲突已作为迁移历史记录，不应把旧状态覆盖代码证据，也不应因此把整个 Content Domain 宣称 `COMPLETE`。详见[迁移时交付基线](../evidence/delivery-baseline)。
- 数据库基线的 `lo_letters` 与新实体/Spec 的字段语义需要在实现 Gate 前完成逐字段核验；本页只记录风险，不自行裁决。
- 当前测试没有覆盖完整 Admin/Public HTTP、音频哈希失效、真实音频审核投影和设备端 E2E。
- 下一步应先冻结字母 Feature 的 authority snapshot 和验收范围，再补齐数据库对齐、HTTP/集成/音频投影测试；同步更新统一状态来源后，才提升层级状态。
