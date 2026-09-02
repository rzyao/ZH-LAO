# Implementation Plan: 老挝语字母内容管理 (Lao Alphabet Management)

**Branch**: `002-lao-alphabet-management` | **Date**: 2026-09-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-lao-alphabet-management/spec.md`

---

## Summary

实现老挝语基础字母体系（`LaoCharacter`）的录入、分类管理、Unicode 唯一性保障、IPA 音标、发音槽位策略门禁（`AudioRolePolicy`）、不可变修订版本控制（`LaoCharacterRevision`）以及全生命周期审核发布流。

技术方案直接复用并扩展项目已审计的 Content 与 Audio 领域架构：
- **Backend (`apps/backend`)**: Node.js 22 + TypeScript + Fastify，复用 `content.contents` 与 `content.lo_letters` 承载物理数据，复用 `content.content_revisions` 实现不可变修订版本状态机（Draft $\to$ Pending Review $\to$ Approved $\to$ Published $\to$ Superseded），结合 `audio.audio_slots` 严格实施 1:1 发音槽位白名单门禁与 `audio_input_hash` 联动失效。
- **Admin (`apps/admin`)**: React 19 + TypeScript + Vite + Tailwind CSS，构建字母录入、IPA 与 `sort_order` 排序维护、Active Work Guard 版本对照及审核发布工作台。
- **Mobile (`apps/mobile`)**: React Native (Expo 53) + TypeScript，构建老挝语字母表结构化展示流（辅音 $\to$ 元音 $\to$ 符号），结合 Audio 投影契约接入真人流媒体播放与优雅静音降级。

---

## Technical Context

**Language/Version**: TypeScript 5.8+, Node.js 22+ (Backend), React 19 (Admin), React Native 0.79 / Expo 53 (Mobile).

**Primary Dependencies**: Fastify 5.x, PostgreSQL driver (`pg`), Zod 4.x, React Query, Axios, Expo Audio.

**Storage**: PostgreSQL 16+（核心物理表：`content.contents`, `content.lo_letters`, `content.content_revisions`, `audio.audio_slots`）。

**Testing**: Vitest (Backend/Admin unit & contract), Jest / React Native Testing Library (Mobile).

**Target Platform**: Node.js Linux Container (Backend), Web Browser (Admin), Android / iOS (Mobile).

**Project Type**: Monorepo (`apps/backend`, `apps/admin`, `apps/mobile`).

**Performance Goals**: 
- C 端字母表查询响应 p95 < 50ms（通过发布态视图索引保障）；
- 录入重复 Unicode 字符拦截率 100%；
- 历史版本不可变写操作拦截率 100%。

**Constraints**:
- 不新增任何未授权数据库物理表或字段，严格映射现有的 `0400_content.sql`、`0600_audio.sql` 与 `1240_content_revision.sql`。
- 符号类字符（`symbol`）强制锁定 `no_audio = true`，绝对禁止向 Audio 域创建发音槽位。
- C 端可见性守卫严密过滤草稿、待审与已下线内容。

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 宪法原则 (Principle) | 检查项与规则 | 状态 | 实施/规划依据 |
|---|---|:---:|---|
| **I. 权威优先级** | Spec/Plan 绝不覆盖物理迁移与领域事实 | `PASS` | 严格依循 `0400_content.sql`, `1240_content_revision.sql` 与 `domains/content/alphabet.md` |
| **II. 现有代码非需求权威** | 不从现有代码反推需求，冲突必报 | `PASS` | 仅以 `spec.md` 及决策纪要为唯一需求来源 |
| **III. 需求 ID 稳定性** | 保持 `FR-001` ~ `FR-009` 原生稳定 ID | `PASS` | 计划所有任务与追踪严格映射原始需求 ID |
| **IV. 可验证性** | 具备明确 Given/When/Then 与测试输入 | `PASS` | 验收用例与合约用例全覆盖 |
| **V. 状态机强制** | 涉及生命周期的实体必须有明确状态机 | `PASS` | `LaoCharacterRevision` 6 大状态合法转移与非法封堵全约束 |
| **VI. 真实契约映射** | 契约只引用真实存在的文件与符号，不臆造 | `PASS` | 映射真实端点与物理迁移列，无空想符号 |
| **VII. 决策预算 (LOCKED)** | LOCKED 决策严禁修改，私有拆解受控 | `PASS` | 锁定表列、分类枚举与发音槽位策略，严禁篡改 |
| **VIII. 冲突即停止 (STOP)** | 发现冲突立即上报，严禁自行平替 | `PASS` | 无未决冲突（状态为 NO CONFLICT） |
| **IX. 证据现实** | 交付以端到端和测试映射结果为证据 | `PASS` | 包含自动化集成与契约测试套件 |
| **X. Grounding Gate** | 锚定当前 main 分支基线提交 | `PASS` | 锚定 Base Commit `4d87b56` |
| **XI. 单一事实所有权** | Content 拥有字母事实，Audio 拥有音频生产 | `PASS` | 槽位与版本解耦，禁止跨域直写物理文件事实 |

---

## Locked Decisions *(per Constitution Principle VII)*

| Decision | Source | Why LOCKED |
|---|---|---|
| 统一使用公开 `public_id` 作为外部通信 UUID | `0400_content.sql`, ADR-004 | 隐藏内部 `bigint` 主键，防止跨域物理强耦合 |
| 存量 68 项字符统一纳管于 `LaoCharacter` | `alphabet-decisions.md` (A1) | 建立统一内容底座，保证音节与词汇正字法校验完整性 |
| 符号类（`symbol`）强制 `no_audio = true` 且 IPA 为 `-` | `alphabet-decisions.md` (A1), `audio-binding.md` | 杜绝向无发音符号派发无意义的录音/TTS 工单 |
| 组内展示排序通过独立 `sort_order` 维护 | `alphabet-decisions.md` (A2) | 解耦教学展示推进次序与字符本体/语言学分类 |
| 不可变版本修订模型（禁止原地修改已发布内容） | `1240_content_revision.sql`, ADR-003/006 | 保证历史教学快照与对外引用的一致性与可追溯性 |
| Active Work Guard 守卫（单条目同一时刻唯一活动工作版本） | `versioning-review.md` §1.1 | 防止并发编辑产生版本分叉与脏覆盖 |
| 字符/IPA 变更触发 `audio_input_hash` 更新与旧音频 `stale` 标记 | `audio-binding.md` §3, ADR-020 | 确保学习者 100% 听到与最新文本一致的准确发音 |

---

## Authority Snapshot

- **Base Commit**: `4d87b56`
- **Scope Type / ID**: `feature:alphabet` / `domain:content`
- **Referenced Authority Docs**:
  - `docs/docs/developer/reference/domains/content/alphabet.md`
  - `docs/docs/developer/reference/domains/content/decisions/alphabet-decisions.md`
  - `docs/docs/developer/reference/domains/content/versioning-review.md`
  - `docs/docs/developer/reference/domains/content/audio-binding.md`
  - `docs/docs/developer/reference/adr/ADR-004-learning-content-registry.md`
  - `docs/docs/developer/reference/adr/ADR-006-learning-content-lifecycle.md`
  - `docs/docs/developer/reference/adr/ADR-020-audio-production-domain.md`
  - `database/migrations/0400_content.sql`
  - `database/migrations/0600_audio.sql`
  - `database/migrations/1240_content_revision.sql`
- **Existing Code / Schema Checked**:
  - `database/migrations/`: 物理表已就绪（`content.contents`, `content.lo_letters`, `content.content_revisions`, `audio.audio_slots`）。
  - `apps/backend/src/modules/`: 规划在 `content` 模块下实现字母聚合、用例与 Fastify 路由。
  - `apps/admin/src/`: 规划接入设计系统表格与表单组件。
  - `apps/mobile/src/`: 规划接入 `LaoText`、`AudioService` 与 `ThemeProvider`。

---

## Project Structure

### Documentation (this feature)

```text
specs/002-lao-alphabet-management/
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md  # Requirements quality checklist
├── plan.md              # This file
├── research.md          # Phase 0 research & technical decisions
├── data-model.md        # Phase 1 data model & mapping
└── contracts/
    └── http-api.md      # Phase 1 HTTP interface contract
```

### Source Code Mapping

```text
apps/backend/src/modules/content/
├── domain/
│   ├── lao-character.ts          # LaoCharacter 实体与分类逻辑
│   ├── lao-character-revision.ts # 不可变修订版本聚合根
│   └── audio-role-policy.ts      # 发音槽位白名单策略
├── application/
│   ├── ports/repositories.ts     # 数据访问契约
│   └── use-cases/
│       ├── create-character-draft.ts
│       ├── submit-character-review.ts
│       ├── review-character.ts
│       ├── publish-character.ts
│       └── get-published-alphabet.ts
├── infrastructure/
│   └── postgres-content-repository.ts
└── http/
    ├── admin-routes.ts           # /api/v1/admin/content/letters
    └── public-routes.ts          # /api/v1/content/letters

apps/admin/src/features/content/alphabet/
├── api.ts                        # 后台管理 API 客户端
├── components/
│   ├── AlphabetTable.tsx         # 字母列表与状态展示
│   ├── AlphabetFormDialog.tsx    # 字母录入与编辑对话框
│   └── ReviewAuditDialog.tsx     # 审核与发布操作对话框
└── pages/AlphabetPage.tsx        # 字母管理页面

apps/mobile/src/features/alphabet/
├── api/alphabetApi.ts            # C 端查询 API 客户端
├── components/
│   ├── AlphabetSectionList.tsx   # 辅音/元音/符号分组列表
│   └── CharacterCard.tsx         # 字母卡片与发音交互
└── screens/AlphabetScreen.tsx     # 字母表学习浏览页
```

---

## Implementation Phases & Deliverables

### Phase 1: Backend Domain & APIs
1. 在 `apps/backend` 落地 `content` 模块核心实体（`LaoCharacter`, `LaoCharacterRevision`）与 `AudioRolePolicy`。
2. 实现数据库仓库（映射 `content.contents`, `content.lo_letters`, `content.content_revisions`, `audio.audio_slots`）。
3. 落地管理后台与 C 端公开 Fastify 路由。
4. 编写契约与集成测试（覆盖 Unicode 重复拦截、状态机流转、不可变性、音频槽位与 C 端可见性守卫）。

### Phase 2: Admin Content Management
1. 在 `apps/admin` 落地字母管理路由与权限保护（`content:write`, `content:publish`）。
2. 构建字母录入/编辑表单（支持分类、IPA 音标输入校验、`sort_order` 调整）。
3. 构建版本审核与发布工作台（状态流转、驳回原因批注、原子发布触发）。

### Phase 3: Mobile Learning Consumption
1. 在 `apps/mobile` 落地公开字母表获取与缓存层。
2. 构建标准三分类展示界面（辅音 27 组、元音 30 组、符号组）。
3. 接入 `AudioService` 实现点击发音与优雅静音降级。
