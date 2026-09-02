# Tasks: 老挝语字母内容管理 (Lao Alphabet Management)

**Input**: Design documents from `specs/002-lao-alphabet-management/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`)

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/`

**Tests**: 依据宪法第四原则（Principle IV Verifiability）与需求规格，全量覆盖 Unicode 冲突拦截、状态机流转、不可变性写拦截、Audio 槽位策略与 C 端多重可见性守卫。

**Organization**: 任务严格按 User Story 组织，各阶段可独立推进、独立测试与交付。

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件、无未完成的前置依赖）
- **[Story]**: 归属的用户故事（[US1], [US2], [US3]）
- 描述中必须包含明确的目标文件路径与可验证结果

---

## Phase 1: Setup (Shared Infrastructure & Types)

**Purpose**: 准备前后端共享类型、数据契约定义与测试环境底座

- [x] T001 [P] 验证数据库物理迁移 `database/migrations/0400_content.sql`、`0600_audio.sql` 与 `1240_content_revision.sql` 结构已就绪
- [x] T002 [P] 创建后端 Content 模块目录架构与主导出入口 `apps/backend/src/modules/content/index.ts`
- [x] T003 [P] 创建管理后台 Content 字母管理模块目录结构 `apps/admin/src/features/content/alphabet/index.ts`
- [x] T004 [P] 创建移动端 Alphabet 特性模块目录结构 `apps/mobile/src/features/alphabet/index.ts`

---

## Phase 2: Foundational (Domain Entities, State Machine & Policies)

**Purpose**: 核心领域值对象、分类枚举、不可变修订聚合根与发音槽位白名单策略，所有 User Story 的公共阻塞前置

- [x] T005 [P] 实现 `LaoCharacter` 领域实体与 Unicode 精确比较、大类/子分类 Zod 校验规则 `apps/backend/src/modules/content/domain/lao-character.ts`
- [x] T006 [P] 实现 `LaoCharacterRevision` 不可变修订版本聚合根及 6 大状态（Draft/Pending Review/Approved/Published/Rejected/Superseded）流转状态机与 Active Work Guard 守卫 `apps/backend/src/modules/content/domain/lao-character-revision.ts`
- [x] T007 [P] 实现基于字符本体与 IPA 音标的 SHA-256 `audio_input_hash` 计算与发音槽位白名单策略 `AudioRolePolicy` `apps/backend/src/modules/content/domain/audio-role-policy.ts`
- [x] T008 实现 Content 领域仓储接口定义（映射 `contents`, `lo_letters`, `content_revisions`, `audio_slots`）`apps/backend/src/modules/content/application/ports/repositories.ts`
- [x] T009 实现 PostgreSQL 仓储与事务管理实现 `apps/backend/src/modules/content/infrastructure/postgres-content-repository.ts`

**Checkpoint**: 领域实体、状态机、哈希计算与数据访问层就绪，可独立开展 User Story 开发与测试。

---

## Phase 3: User Story 1 - 管理员创建与维护 LaoCharacter (Priority: P1) 🎯 MVP

**Goal**: 内容管理员录入老挝文字母，精确校验 Unicode 码点唯一性，支持三大分类与细分子类型，管理 IPA 音标、教学说明与组内排序号 `sort_order`，创建首个 Draft 版本并派生工作版本。

**Independent Test**: 调用管理端录入接口，中辅音 `ກ`、短元音 `ະ` 或声调符号 `່` 成功建档，生成首个 Draft 版本；重复录入同一码点字符严格返回 409 `UNICODE_CONFLICT`；符号类字符自动锁定 `no_audio = true`。

### Tests for User Story 1 🧪
- [x] T010 [P] [US1] 编写 Unicode 码点精确查重与冲突拦截单元测试 `apps/backend/test/modules/content/unicode-conflict.unit.test.ts`
- [x] T011 [P] [US1] 编写创建字母草稿与派生工作版本契约测试 `apps/backend/test/modules/content/create-character-draft.contract.test.ts`
- [x] T012 [P] [US1] 编写符号类 `no_audio = true` 与发音门禁规则测试 `apps/backend/test/modules/content/audio-gate-rules.unit.test.ts`

### Implementation for User Story 1
- [x] T013 [US1] 实现创建字母草稿应用用例 `apps/backend/src/modules/content/application/use-cases/create-character-draft.ts`
- [x] T014 [US1] 实现基于已发布版本派生工作版本用例 `apps/backend/src/modules/content/application/use-cases/derive-working-revision.ts`
- [x] T015 [US1] 实现更新草稿内容与调整组内 `sort_order` 用例 `apps/backend/src/modules/content/application/use-cases/update-character-draft.ts`
- [x] T016 [US1] 挂载管理后台 Fastify 路由 `POST /api/v1/admin/content/letters` 与 `PUT /api/v1/admin/content/letters/:id/draft` 于 `apps/backend/src/modules/content/http/admin-routes.ts`
- [x] T017 [P] [US1] 管理后台实现 API 客户端与数据查询 Hook `apps/admin/src/features/content/alphabet/api.ts`
- [x] T018 [P] [US1] 管理后台构建字母录入/编辑对话框组件（含分类联动、IPA 转写校验、`sort_order` 排序配置）`apps/admin/src/features/content/alphabet/components/AlphabetFormDialog.tsx`
- [x] T019 [US1] 管理后台构建字母列表管理页（支持分类筛选、排序展示、状态徽标）`apps/admin/src/features/content/alphabet/pages/AlphabetPage.tsx`

**Checkpoint**: User Story 1 完全闭环，管理员可创建、编辑老挝文字母草稿，并能在管理后台界面直观操作。

---

## Phase 4: User Story 2 - 审核与原子发布 (Priority: P2)

**Goal**: 审核员审查 `Pending Review` 状态的字母版本，支持审核通过、驳回批注与正式发布；发布时在单事务内原子更新 `published_revision_id`、固化快照并将旧版本归档为 `Superseded`；修改已发布内容严格拦截。

**Independent Test**: 提交审核后版本流转为 `Pending Review`；执行驳回后流转为 `Rejected`；执行发布后版本流转为 `Published` 且 `published_revision_id` 原子更新；对已发布版本的直接修改操作被 100% 拦截。

### Tests for User Story 2 🧪
- [x] T020 [P] [US2] 编写 `LaoCharacterRevision` 状态机流转与非法转移封堵集成测试 `apps/backend/test/modules/content/revision-state-machine.integration.test.ts`
- [x] T021 [P] [US2] 编写正式指针原子发布与旧版本 `Superseded` 归档契约测试 `apps/backend/test/modules/content/publish-character.contract.test.ts`
- [x] T022 [P] [US2] 编写已发布历史版本不可变性防篡改单元测试 `apps/backend/test/modules/content/immutable-version.unit.test.ts`

### Implementation for User Story 2
- [x] T023 [US2] 实现提交审核用例（含 Active Work Guard 守卫检查）`apps/backend/src/modules/content/application/use-cases/submit-character-review.ts`
- [x] T024 [US2] 实现审核裁决用例（支持通过与驳回批注）`apps/backend/src/modules/content/application/use-cases/review-character.ts`
- [x] T025 [US2] 实现原子发布用例（单事务完成状态变更、指针切换、旧版归档与领域事件派发）`apps/backend/src/modules/content/application/use-cases/publish-character.ts`
- [x] T026 [US2] 挂载审核与发布 Fastify 路由（`submit`, `review`, `publish`）于 `apps/backend/src/modules/content/http/admin-routes.ts`
- [x] T027 [P] [US2] 管理后台实现审核与驳回批注对话框组件 `apps/admin/src/features/content/alphabet/components/ReviewAuditDialog.tsx`
- [x] T028 [US2] 管理后台表格集成操作栏（提交审核、审核、驳回、正式发布按钮与权限控制）`apps/admin/src/features/content/alphabet/components/AlphabetTable.tsx`

**Checkpoint**: User Stories 1 & 2 闭环，内容从草稿录入到审核发布的完整生命周期在管理端完全就绪。

---

## Phase 5: User Story 3 - 移动端学习查看与 C 端可见性守卫 (Priority: P3)

**Goal**: 学习者在移动端查阅官方已发布字母表，系统应用多重可见性守卫过滤未发布/已下线数据，严格按「辅音 $\to$ 元音 $\to$ 符号」及组内 `sort_order` 排序渲染，结合音频投影契约提供真人发音播放。

**Independent Test**: 客户端调用 `GET /api/v1/content/letters`，仅返回 `Published` 且 `online` 的字符；草稿与待审字符 100% 过滤；辅音 27 组、元音 30 组顺序准确；点击有声字母成功播放音频，无声符号展示为静音态。

### Tests for User Story 3 🧪
- [x] T029 [P] [US3] 编写 C 端多重可见性守卫过滤与排序契约测试 `apps/backend/test/modules/content/get-published-alphabet.contract.test.ts`
- [x] T030 [P] [US3] 编写移动端 Alphabet 列表渲染与分组单元测试 `apps/mobile/src/features/alphabet/__tests__/AlphabetSectionList.test.tsx`

### Implementation for User Story 3
- [x] T031 [US3] 实现 C 端获取已发布字母表用例（多重可见性守卫 + 排序投影）`apps/backend/src/modules/content/application/use-cases/get-published-alphabet.ts`
- [x] T032 [US3] 挂载公开 C 端 Fastify 路由 `GET /api/v1/content/letters` 于 `apps/backend/src/modules/content/http/public-routes.ts`
- [x] T033 [P] [US3] 移动端实现字母查询 API 客户端与 React Query 缓存 `apps/mobile/src/features/alphabet/api/alphabetApi.ts`
- [x] T034 [P] [US3] 移动端实现字母卡片组件（支持 `LaoText` 呈现、IPA 音标、分类标识与音频播放触发）`apps/mobile/src/features/alphabet/components/CharacterCard.tsx`
- [x] T035 [US3] 移动端实现标准三分类字母表页面（辅音/元音/符号分组）`apps/mobile/src/features/alphabet/screens/AlphabetScreen.tsx`
- [x] T036 [US3] 将 Alphabet 学习页面挂载至移动端导航栈 `apps/mobile/src/navigation/RootNavigator.tsx`

**Checkpoint**: 移动端学习者可流畅查阅已发布字母库并试听发音，全流程验收通过。

---

## Phase 6: Audio Binding Integration & Invalidation

**Purpose**: 落实 Content 与 Audio 域的解耦联动，实现 1:1 白名单建槽、输入哈希比对与发音失效联动

- [x] T037 [P] 实现字母与 `audio.audio_slots` 槽位绑定事件处理器 `apps/backend/src/modules/content/application/services/audio-slot-sync-service.ts`
- [x] T038 编写发音要素（字符本体或 IPA）变更触发 `audio_input_hash` 刷新与旧音频 `stale` 标记集成测试 `apps/backend/test/modules/content/audio-hash-invalidation.integration.test.ts`
- [x] T039 验证 C 端音频播放投影契约（有效音频返回 URL，无效/stale/no_audio 严格返回 `null`）`apps/backend/src/modules/content/application/services/audio-projection-service.ts`

---

## Phase 7: Polish & Full Verification

**Purpose**: 贯穿全链路的最终质量收敛、规范一致性检查与端到端验证

- [x] T040 [P] 验证 `spec.md` 中全部 FR-001 ~ FR-009 需求对应测试用例 100% PASS
- [x] T041 [P] 验证 SC-001 ~ SC-006 全部量化成功指标达标（Unicode 拦截 100%、草稿泄露 0%、不可变写拦截 100%）
- [x] T042 执行全量测试套件并更新模块文档 `apps/backend/src/modules/content/README.md`
