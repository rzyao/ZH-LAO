# Stage 6 — Legacy Executable Spec Retirement（遗留 Executable Spec 退休）

> **目标**：审计并安全退休旧 ZH-LAO Executable Spec System，重点处理 `content.spec.json` 中遗留的 55 个 `CNT-*` Requirement ID，确保没有任何产品事实或 Requirement 在退休过程中丢失。
> **执行日期**：2026-09-02 ｜ **仓库**：`C:\project\ZH-LAO`
> **前置**：Stage 3（Constitution 批准 + 旧系统标记 superseded）、Stage 4（Authority Consolidation）、Stage 5（Canonical Truth Repair）。

## 0. 约束遵守速览

| 约束 | 状态 |
| --- | --- |
| 不修改业务代码 | ✅ `apps/` 0 改动 |
| 不创造产品需求 | ✅ 仅归档 + 引用既有 canonical，未新增事实 |
| 不执行 `/speckit.specify` | ✅ 未执行 |
| 不生成新 Feature spec | ✅ 未生成 |
| 不机械转换 CNT-\* → FR-\* | ✅ 未注入任何 `FR-*`；旧 ID 仅作 historical |
| 不删除无法证明安全退休的事实 | ✅ 事实通过 COVERED/GAP 双通道保全；文件均未删 |
| 不把 CNT-\* 写进 `domains/` | ✅ `grep CNT-` 在 `domains/` 命中 0 |
| 55/55 全部分类 | ✅ 见 §1 |
| Operations RBAC 保持 SPEC_CONFLICT | ✅ 未裁决 `grant/revoke` vs `set/read` |
| 不覆盖 Stage 5 的 AUTHORITY_GAP / REPOSITORY_DRIFT | ✅ 本 Stage 仅新增 1 个 content 侧 GAP（RBAC keys），未触碰 Learning 4 / Audio 5 / migration 0000 / 1260 |

---

## 1. 55 个 CNT-\* 完整映射表

判定依据：
- **canonical authority** = `docs/docs/domains/content/*`（Stage 4 确立的单一权威层；`CONTENT_PRODUCT_SEMANTICS.md` 本 Stage 前已被标 `derived_from: domains/content/index.md` + `lifecycle: historical`，故其详节属 DERIVED，不计入 canonical）。
- 更高 authority：`database/migrations/0400_content.sql`、`1240_content_revision.sql`、Constitution（`ADR-018` 跨域 UUID/无物理 FK、`ADR-021` Content/Learning 拆分）。
- 代码/`tests` 仅作 **Engineering Evidence**，不作 Product Authority。

| # | CNT-ID | authority_refs | canonical 等价（path → heading） | 裁决 |
| --- | --- | --- | --- | --- |
| 1 | CNT-UC-001 | USECASES/API | domains/content/index.md → 核心职责·课程体系；curriculum.md → 课程体系 | COVERED_BY_CANONICAL |
| 2 | CNT-UC-002 | USECASES/API | curriculum.md → 课程体系（courses.status draft/published/archived） | COVERED_BY_CANONICAL |
| 3 | CNT-UC-003 | USECASES/API | curriculum.md → 课程体系（Unit 无跨域 UUID） | COVERED_BY_CANONICAL |
| 4 | CNT-UC-004 | USECASES/API | curriculum.md → 课程体系；database.md → content_revisions（revision_public_id） | COVERED_BY_CANONICAL |
| 5 | CNT-UC-005 | USECASES/API | curriculum.md + practice.md（LessonItem aggregate-internal，无 public id） | COVERED_BY_CANONICAL |
| 6 | CNT-UC-006 | USECASES/API | database.md（public_id）+ index.md（Content Revision） | COVERED_BY_CANONICAL |
| 7 | CNT-UC-007 | USECASES/API | dictionary.md → 语义与关系·搜索策略（exact lookup） | COVERED_BY_CANONICAL |
| 8 | CNT-UC-008 | USECASES/API | dictionary.md → 搜索策略（exact>prefix>trigram，pg_trgm，无 ES） | COVERED_BY_CANONICAL |
| 9 | CNT-UC-009 | USECASES/API | dictionary.md → 语义与关系（equivalents/relations/tags） | COVERED_BY_CANONICAL |
| 10 | CNT-UC-010 | USECASES/API | practice.md → 作答历史归 Learning（answer 不写 Content） | COVERED_BY_CANONICAL |
| 11 | CNT-UC-011 | USECASES/API | practice.md → 作答历史归 Learning | COVERED_BY_CANONICAL |
| 12 | CNT-UC-012 | USECASES/API | knowledge.md → Content Registry（contents + subtype FK）；database.md → content_revisions | COVERED_BY_CANONICAL |
| 13 | CNT-UC-013 | USECASES/API | knowledge.md（content_type immutable、public_id immutable） | COVERED_BY_CANONICAL |
| 14 | CNT-UC-014 | USECASES/API | knowledge.md（lifecycle active/disabled/archived，不物理删除） | COVERED_BY_CANONICAL |
| 15 | CNT-UC-015 | USECASES/API | knowledge.md（meanings.sense_order 唯一） | COVERED_BY_CANONICAL |
| 16 | CNT-UC-016 | USECASES/API | knowledge.md → translations（canonical 仅人工确认；target≠source） | COVERED_BY_CANONICAL |
| 17 | CNT-UC-017 | USECASES/API | knowledge.md → pronunciations（知识属性，不写音频） | COVERED_BY_CANONICAL |
| 18 | CNT-UC-018 | USECASES/API | dictionary.md → content_equivalents / content_relations | COVERED_BY_CANONICAL |
| 19 | CNT-UC-019 | USECASES/API | curriculum.md → courses（learning_language check zh/lo，draft） | COVERED_BY_CANONICAL |
| 20 | CNT-UC-020 | USECASES/API | curriculum.md（scalars；public_id immutable） | COVERED_BY_CANONICAL |
| 21 | CNT-UC-021 | USECASES/API | curriculum.md（ReplaceCourseStructure，dense order） | COVERED_BY_CANONICAL |
| 22 | CNT-UC-022 | USECASES/API | database.md → content_revisions（publish/supersede） | COVERED_BY_CANONICAL |
| 23 | CNT-UC-023 | USECASES/API | index.md（archived 不进入 discovery；UUID/revision 不删） | COVERED_BY_CANONICAL |
| 24 | CNT-UC-024 | USECASES/API | curriculum.md → lessons（public_id immutable；optimistic concurrency） | COVERED_BY_CANONICAL |
| 25 | CNT-UC-025 | USECASES/API | curriculum.md（ReplaceLessonStructure；Section UUID 稳定） | COVERED_BY_CANONICAL |
| 26 | CNT-UC-026 | USECASES/API | database.md → content_revisions（lesson revision supersede） | COVERED_BY_CANONICAL |
| 27 | CNT-UC-027 | USECASES/API | practice.md（exercises public_id；expectedUpdatedAt） | COVERED_BY_CANONICAL |
| 28 | CNT-UC-028 | USECASES/API | practice.md（Exercise/Question 替换，dense order） | COVERED_BY_CANONICAL |
| 29 | CNT-UC-029 | USECASES/API | practice.md（question 校验题型/cardinality/rule） | COVERED_BY_CANONICAL |
| 30 | CNT-UC-030 | USECASES/API | practice.md + database.md（pin question revision；answer-redacted） | COVERED_BY_CANONICAL |
| 31 | CNT-UC-031 | USECASES/PUBLIC | index.md → 跨域引用（stable UUID，不暴露 persistence） | COVERED_BY_CANONICAL |
| 32 | CNT-UC-032 | USECASES/PUBLIC | database.md → content_revisions（pin immutable snapshot；history 可 resolve） | COVERED_BY_CANONICAL |
| 33 | CNT-UC-033 | USECASES/PUBLIC | index.md → 与 Audio Production 的契约；database.md（revision published） | COVERED_BY_CANONICAL |
| 34 | CNT-UC-034 | USECASES/PUBLIC | practice.md（trusted scoring view 归 backend；不映射 public） | COVERED_BY_CANONICAL |
| 35 | CNT-DB-001 | PRODUCT/DB_CORE | knowledge.md（Registry + subtype FK，创建即共存）；DB_CORE migration | COVERED_BY_CANONICAL |
| 36 | CNT-DB-002 | PRODUCT/PUBLIC/DB_CORE | index.md → 跨域引用；database.md；Constitution ADR-018（UUID/无物理 FK） | COVERED_BY_CANONICAL |
| 37 | CNT-STATE-001 | PRODUCT | knowledge.md（active/disabled/archived，不物理删除） | COVERED_BY_CANONICAL |
| 38 | CNT-STATE-002 | PRODUCT | curriculum.md → courses（draft→published→archived） | COVERED_BY_CANONICAL |
| 39 | CNT-STATE-003 | PRODUCT | curriculum.md → lessons（draft→published→archived） | COVERED_BY_CANONICAL |
| 40 | CNT-STATE-004 | PRODUCT/DB_REV | database.md → content_revisions（draft→published→superseded；immutable；单 current） | COVERED_BY_CANONICAL |
| 41 | CNT-CON-001 | PRODUCT/API | 产品不变式（无丢失更新）隐含于 canonical optimistic concurrency；机制为 HOW | IMPLEMENTATION_ONLY |
| 42 | CNT-CON-002 | PRODUCT/API | 发布原子性机制（HOW）；不变式由 content_revisions lifecycle 覆盖 | IMPLEMENTATION_ONLY |
| 43 | CNT-SEC-001 | PRODUCT/API | index.md + knowledge.md/curriculum.md（public 仅可见 current published） | COVERED_BY_CANONICAL |
| 44 | CNT-SEC-002 | PRODUCT/API/PUBLIC | practice.md（answer 归 Learning；public 不泄漏 answer key 原则） | COVERED_BY_CANONICAL |
| 45 | CNT-SEC-003 | PRODUCT/PUBLIC | index.md + operations 边界（Admin 需 permission；FF≠auth 原则） | COVERED_BY_CANONICAL |
| 46 | CNT-SEC-004 | API | API 输入校验机制（strict parse / 禁止 mass assignment 身份字段）— HOW | IMPLEMENTATION_ONLY |
| 47 | CNT-API-001 | PRODUCT/API | dictionary.md（pg_trgm，无 ES）；但 ranking 数值边界/query 长度属 HOW | IMPLEMENTATION_ONLY |
| 48 | CNT-API-002 | API | DTO 卫生 + 冻结错误码映射（HOW）；不暴露 BIGINT 已由跨域规则覆盖 | IMPLEMENTATION_ONLY |
| 49 | CNT-API-003 | PRODUCT/API | index.md + practice.md + curriculum.md（aggregate-internal 节点无 public UUID/CRUD） | COVERED_BY_CANONICAL |
| 50 | CNT-PUB-001 | PUBLIC | public contract 模块能力边界（不导出 repo/SQL/TM/BIGINT）— 代码架构约束 HOW | IMPLEMENTATION_ONLY |
| 51 | CNT-PUB-002 | PRODUCT/PUBLIC | database.md → content_revisions（pin revision；history 可 resolve） | COVERED_BY_CANONICAL |
| 52 | CNT-PUB-003 | PRODUCT/PUBLIC | index.md → 与 Media/Asset 契约 + 与 Audio Production 契约 | COVERED_BY_CANONICAL |
| 53 | CNT-CORE-001 | PRODUCT | knowledge.md → translations（canonical 归 Content；AI runtime 归 Learning） | COVERED_BY_CANONICAL |
| 54 | CNT-CORE-002 | PRODUCT | index.md（事件归属）+ dictionary.md（无 ES）+ PostgreSQL-first；Outbox 非必需 | COVERED_BY_CANONICAL |
| 55 | CNT-RBAC-001 | PRODUCT/OPS_RBAC | canonical 未枚举 Content 8 个精确 permission keys（见 §3） | AUTHORITY_GAP |

> 备注：所有 55 个 requirement 在源文件中 `status: frozen`；`authority_refs` 键解析为 `development/05-content/*`（PRODUCT/USECASES/API/PUBLIC）、migration（DB_CORE/DB_REV）与 `OPS_RBAC`。`CONTENT_PRODUCT_SEMANTICS.md` 当前为 DERIVED（historical），其详节用于交叉验证，不作为 canonical 裁决依据。

---

## 2. 分类统计

| 裁决 | 数量 | 占比 |
| --- | --- | --- |
| COVERED_BY_CANONICAL | 48 | 87.3% |
| IMPLEMENTATION_ONLY | 6 | 10.9% |
| AUTHORITY_GAP | 1 | 1.8% |
| SPEC_CONFLICT | 0 | 0% |
| OBSOLETE | 0 | 0% |
| **合计** | **55** | 100% |

- **IMPLEMENTATION_ONLY（6）**：CNT-CON-001、CNT-CON-002、CNT-SEC-004、CNT-API-001、CNT-API-002、CNT-PUB-001 —— 均为 HOW / 实现约束；其底层产品不变式已由 canonical 覆盖，事实未丢失。
- **AUTHORITY_GAP（1）**：CNT-RBAC-001 —— 见 §3。
- **SPEC_CONFLICT（0）**：55 个 CNT-\* 的产品事实与 canonical `domains/content/*` 均无真实语义冲突（lifecycle / 所有权 / translation / revision / 跨域 UUID 均一致）。Stage 4/5 已记录的 Operations `grant/revoke` vs `set/read` 冲突**不在**这 55 个 content requirement 之内（属 `role_permissions` 动作动词层），本 Stage 不裁决、保持 SPEC_CONFLICT。
- **OBSOLETE（0）**：无 CNT-\* 被已接受的 ADR / frozen contract 正式取代；故无 OBSOLETE 裁决（避免无 authority 的误判）。

---

## 3. AUTHORITY_GAP 完整清单

### CNT-RBAC-001 — Content V1 八个精确 permission keys 未在 canonical 定义

- **原始 statement**：Content V1 Admin 使用冻结的 8 个 exact permission keys；在开启依赖这些 key 的管理 route 前，Operations code catalog 必须加入这些 keys，并由现有 active `super_admin` 按 complete-set catalog evolution contract 显式 reconciliation；禁止 wildcard / bypass / 启动时自动补权限。
- **8 个 key（来自源 requirement 的 references → OPS_RBAC 文档）**：
  - `content.knowledge.read`、`content.knowledge.write`
  - `content.curriculum.read`、`content.curriculum.write`、`content.curriculum.publish`
  - `content.practice.read`、`content.practice.write`、`content.practice.publish`
- **source**：`docs/docs/development/specs/domains/content.spec.json` → `CNT-RBAC-001`；`authority_refs: [PRODUCT, OPS_RBAC]`；`contract_refs: [OPS_RBAC]`。
- **为何是 GAP**：canonical `domains/content/*` 不定义任何 permission（Content 域只描述教学内容，不持有 RBAC）。canonical `domains/operations/*` 定义了权限语法 `<domain>.<resource>.<action>`（如 `operations.role_permissions.grant/revoke`、`trust.cases.resolve`）并给出示例键，但**未枚举上述 8 个 Content 精确键**。因此该「产品/契约事实」在 canonical authority 中无对应定义。
- **处理**：**不删除、不自动 promote**。记录为 `AUTHORITY_GAP`，等待人工确认（建议：在 canonical `domains/operations/rbac.md` 或 `domains/content/index.md` 显式登记 Content 8 键后再关闭）。
- **与 Operations 动词冲突的关系**：本 GAP 关于「Content 需要哪些 permission keys」；Stage 4/5 的 `SPEC_CONFLICT` 关于 `role_permissions` 的**动作动词** `grant/revoke` vs `set/read`。两者维度不同（keys vs verbs），本 Stage **不裁决**动词冲突，仅记录 keys GAP。

> 其它被评估但未判为 GAP 的事实：content_revisions 的 `entity_type` 枚举（`content/course/lesson/exercise/question/translation`）与 `revision_public_id` 已在 Stage 5 promote 至 `domains/content/database.md`，故 COVERED；答案不泄漏原则已由 `practice.md`（answer 归 Learning）覆盖，故 COVERED。

---

## 4. SPEC_CONFLICT 完整清单

**无。** 本 Stage 未产生任何 `SPEC_CONFLICT`。

保留的外部 SPEC_CONFLICT（不在本 Stage 范围，未裁决）：
- Operations `role_permissions` 动作键 `grant/revoke`（canonical `domains/operations/database.md:311/359`）vs `set/read`（实现轨 `OPERATIONS_RBAC_CONTRACTS.md` + 代码 `permissions.ts`）。代码 `set/read` 仅作 Engineering Reality，不作 Product Authority。保持 SPEC_CONFLICT，待主会话裁决。

---

## 5. 旧 Executable Spec 文件最终状态

| 文件 | 改动 | 最终状态 |
| --- | --- | --- |
| `docs/docs/development/specs/domains/content.spec.json` | 顶部插入 `_source_of_truth:false`、`_superseded_by:[constitution, domains/content/]`、`_retired_at`、`_retirement_stage` | **archived / superseded**；55 个 requirement 完整保留为历史；非 Source of Truth |
| `docs/docs/development/specs/index.json` | 插入 `_source_of_truth:false`、`_note` | **archived / superseded**；`adopted_domains:[]` 不变 |
| `docs/docs/development/specs/executable-spec.schema.json` | `$comment` 强化为 SUPERSEDED + 指向 constitution/domains/content | **archived / superseded**；不再用于校验新 spec |
| `docs/docs/development/specs/README.md` | 新增 `## Retirement（Stage 6）` 段，明确 SoT=NO、canonical 指针、55 分类结论、checker 下线、NO_ACTIVE_SPEC_ANALYZE_CI | **superseded**（frontmatter 已于 Stage 3 标记） |
| `docs/docs/development/SPEC_SYSTEM.md` | 未改（Stage 3 已标 superseded） | 保留为历史 |
| `docs/docs/development/specs/evidence/*` | 不存在（从未生成 evidence 工件） | N/A |

**原则**：全部物理保留，无删除；明确 `status: superseded` + `source_of_truth: false`；指向 `.specify/memory/constitution.md` 与 `docs/docs/domains/content/`。

---

## 6. `check_executable_specs.py` 最终状态

- **文件**：`scripts/check_executable_specs.py` — **未删除、未修改**（本 Stage `git diff` 对该文件为空）。
- **角色**：旧 Executable Spec 的结构/traceability/evidence-drift checker，仅服务已退休的旧体系。
- **处置**：从 active validation workflow 下线（见 §7）；脚本保留以备人工/历史追溯，但**不再作为当前 Spec Gate**。
- **仍可用**：手动执行 `python scripts/check_executable_specs.py` 仍可运行（因 `index.json` 的 `adopted_domains:[]`，checker 对未 adopted scope 返回 PASS），但结果仅反映旧体系历史状态，不代表 canonical 合规。

---

## 7. `spec:check` 最终状态

- **`docs/package.json`**：已移除 `"spec:check": "python ../scripts/check_executable_specs.py"` 脚本条目（避免开发者误认为当前 Spec Gate）。
- **`.github/workflows/foundation.yml`**：`docs` job 中 `run: python scripts/check_executable_specs.py` 已注释下线（保留注释说明 SUPERSEDED / NO_ACTIVE_SPEC_ANALYZE_CI），不再在 CI 中执行。
- **结论**：`spec:check` 不再是任何 active workflow 或 package script 的当前 Gate。

---

## 8. active references 扫描结果

扫描范围：`docs/`、`scripts/`、`*.json/*.md/*.py/*.yml`、`.specify/`、`.github/`（排除 node_modules）。

- **仍称旧体系为 canonical / Source-of-Truth 的 active 文档**：**0**。仅 `docs/AGENTS.md:67` 提及，且明确写「已 `superseded`，仅作历史参考」——合规。
- **仍在 active workflow 调用 checker 的引用**：**0**（`foundation.yml` 已注释，`package.json` 已移除）。
- **历史 audit 报告（STAGE1–5）中的引用**：保留为 evidence，均明确标记 `superseded`/历史，不影响当前 canonical。
- **`domains/content/*` 中是否误注入 CNT-\* ID**：**0**（`grep CNT-` 在 `domains/` 命中为空）。

---

## 9. 是否存在 active Spec analyze CI

**NO_ACTIVE_SPEC_ANALYZE_CI。**

- 仓库当前**没有**真实自动化 Spec Kit `analyze` CI。
- `foundation.yml` 的 `docs` job 原先只跑旧 `check_executable_specs.py`（已本 Stage 下线）；另一 workflow `f21-feature-docs-audit.yml` 仅做 feature 文档审计（detail pages / state machine），**不是** spec analyze。
- 按用户要求：**未伪造**任何 Spec Kit analyze CI replacement；明确记录 `NO_ACTIVE_SPEC_ANALYZE_CI`。

---

## 10. git diff

```text
.github/workflows/foundation.yml                        |  5 ++++-
 docs/docs/development/specs/README.md                   | 12 +++++++++++-
 docs/docs/development/specs/domains/content.spec.json   |  2 +-
 docs/docs/development/specs/executable-spec.schema.json |  1 +
 docs/docs/development/specs/index.json                  |  3 +++
 docs/package.json                                       |  3 +--
 6 files changed, 21 insertions(+), 5 deletions(-)
```

关键 diff 摘要：
- `foundation.yml`: `docs` job 注释下线 `check_executable_specs.py`，补 `NO_ACTIVE_SPEC_ANALYZE_CI` 说明（+4/-1）。
- `specs/README.md`: 新增 Retirement 段（+11）。
- `content.spec.json`: 顶部插入 `_source_of_truth:false` + `_superseded_by` 等（+1 行）。
- `executable-spec.schema.json`: `$comment` 强化（+1）。
- `index.json`: 插入 `_source_of_truth:false` + `_note`（+3）。
- `package.json`: 移除 `spec:check` 脚本（-1/+1 结构）。
- `scripts/check_executable_specs.py`: **无 diff（保留）**。

> 注：`git status` 另显示大量 `docs/**` 与 `database/**` 改动，均来自 Stage 3–5（尚未提交），本 Stage 未新增业务代码改动。

---

## 11. git status（Stage 6 本 Stage 新增/修改）

```text
 M .github/workflows/foundation.yml
 M docs/docs/development/specs/README.md
 M docs/docs/development/specs/domains/content.spec.json
 M docs/docs/development/specs/executable-spec.schema.json
 M docs/docs/development/specs/index.json
 M docs/package.json
```

验证项（均通过）：
- ✅ 无 `apps/` 业务代码改动。
- ✅ 未执行 `/speckit.specify`，未生成新 Feature spec。
- ✅ `check_executable_specs.py` 文件保留未删。
- ✅ `domains/` 未注入任何 `CNT-*` ID。
- ✅ 无 `FR-*` 机械生成。

---

## 12. 待人工确认（未猜测、已记录）

1. **CNT-RBAC-001（AUTHORITY_GAP）**：在 canonical `domains/operations/rbac.md` 或 `domains/content/index.md` 显式登记 Content 8 个精确 permission keys 后关闭。
2. **Operations RBAC 动词 SPEC_CONFLICT（外部，未裁决）**：`grant/revoke` vs `set/read` 待主会话裁决（代码 `set/read` = Engineering Reality，非 Product Authority）。
3. **Stage 5 遗留（本 Stage 未触碰）**：Learning 4 项 / Audio 5 项 AUTHORITY_GAP、migration `0000` / `1260` REPOSITORY_DRIFT，维持原状态。

---

## 13. 结论

旧 ZH-LAO Executable Spec System 已完成安全退休：55 个 `CNT-*` Requirement **55/55 全部分类**（48 COVERED + 6 IMPLEMENTATION_ONLY + 1 AUTHORITY_GAP + 0 SPEC_CONFLICT + 0 OBSOLETE），产品事实无丢失；4 个 spec 工件标记 `superseded` + `source_of_truth:false` 并指向 constitution / `domains/content/`；checker 从 CI 与 package script 下线、文件保留；明确 `NO_ACTIVE_SPEC_ANALYZE_CI`，未伪造替代 CI。所有约束（不修业务代码、不造需求、不执行 `/speckit.specify`、不机械转 FR、不删事实、不污染 canonical）均遵守。

**完成 Stage 6 后停止。**
