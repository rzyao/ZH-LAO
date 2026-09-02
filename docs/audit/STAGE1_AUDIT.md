# Stage 1 — Documentation Source-of-Truth Audit

> **只读审计产物**。本次审计未修改、删除或重命名任何现有文档，未裁定冲突双方的正确性，未调整任何产品需求。

| 项 | 值 |
|---|---|
| 审计日期 | 2026-09-02 |
| 审计范围 | `C:\project\ZH-LAO` 全仓 Markdown（排除 `node_modules` / `dist` / `build` / `.vitepress`） |
| 文档总量 | **375 份**，219,798 行 |
| 交叉验证源 | 19 个数据库迁移 SQL、`database/checks/expected-schema.json`、后端模块代码、57 份测试文件 |
| 仓库状态 | 审计期间 `git status` 无新增或变更 |
| 分析脚本 | `%TEMP%\zh-lao-audit\*.py`（已移出仓库，保持零污染） |
| 阶段边界 | 仅 Stage 1。**未**执行 Spec Kit 安装，**未**重写任何文档 |

---

## 0. 执行摘要

文档体系存在一个**结构性倒挂**：被治理文件声明为 canonical 的 `domains/` 层（55 份、10,093 行）只有 9 份自标 FROZEN；而定位为"实施轨"的 `development/` 层（107 份、44,027 行，占 `docs/docs` 正文 **71.5%**）却有 **52 份**自标 FROZEN。规范性负载与实际权威层级相反。

由此产生四个必须处理的问题：

| # | 问题 | 影响面 |
|---|---|---|
| 1 | **同一主题两份冻结契约**：39 份 `development/0X-*` 契约与 `domains/<x>/` 重叠声明，双方均 FROZEN | 39 份文档 |
| 2 | **Schema 三方漂移**：文档 / 迁移 SQL / `expected-schema.json` 对 `admin_credentials`、`content_revisions` 记载不一致 | 2 张表 |
| 3 | **事实源指针悬空**：治理台账 35 处把三份 `status: moved` 存根页列为"唯一事实源" | 11 份文档受影响 |
| 4 | **双 Spec 体系并存**：Spec Kit 已部分安装但 constitution 未填写，同时自有 Executable Spec 体系已定义 | 阻塞后续 Spec 迁移 |

**优先级建议**：问题 2 → 问题 3 → 问题 4 → 问题 1。问题 1 体量最大但属治理收敛，可分期；问题 2/3/4 会直接污染后续的 Spec 迁移。

---

## 1. 文档总量与分类统计

### 1.1 分类定义

| 分类 | 含义 | 判定依据 |
|---|---|---|
| **A** Product Truth Candidate | 产品真相候选 | 定义"产品是什么/为谁/做什么"，无下游可推导来源 |
| **B** Engineering Truth Candidate | 工程真相候选 | 定义契约、架构裁决、数据模型，被其他文档引用为权威 |
| **C** Derived / Duplicate | 派生或重复 | 可由 B 类推导、为导航/索引/能力卡片、或为会话导出物 |
| **D** Legacy / Superseded | 遗留或已被取代 | `status: moved` / `superseded`，或自述不再维护 |
| **E** Unclear / Conflict | 不明或冲突 | 与另一文档对同一事实同时声明权威，或体系归属未裁决 |

### 1.2 统计结果

| 分类 | 全仓 375 份 | 占比 | `docs/docs` 326 份 | 占比 |
|---|---:|---:|---:|---:|
| **A** Product Truth Candidate | 4 | 1.1% | 4 | 1.2% |
| **B** Engineering Truth Candidate | 93 | 24.8% | 90 | 27.6% |
| **C** Derived / Duplicate | 212 | 56.5% | 185 | 56.7% |
| **D** Legacy / Superseded | 8 | 2.1% | 8 | 2.5% |
| **E** Unclear / Conflict | 58 | 15.5% | 39 | 12.0% |

### 1.3 扫描范围分布

| 范围 | 份数 | 说明 |
|---|---:|---|
| `docs/docs/` | 326 | VitePress 站点正文 |
| `.claude/skills/` | 10 | Spec Kit 技能（已安装） |
| `_session/` | 8 | 会话导出物（gitignored） |
| `.specify/` | 6 | Spec Kit 模板与 constitution |
| `docs/sources/` | 6 | ChatGPT 分享导出 |
| `apps/` | 5 | 各应用 README / e2e 说明 |
| 仓库元文档 | 5 | 根 `README.md` 等 |
| `database/` | 4 | schema 检查与报告 |
| `.workbuddy/memory/` | 3 | 项目记忆 |
| `docs/_exports/` | 2 | 会话导出副本 |

### 1.4 各层体量（`docs/docs` 内部，合计 61,564 行）

| 层 | 份数 | 行数 | 占比 | 自标 FROZEN |
|---|---:|---:|---:|---:|
| `development/` | 107 | 44,027 | **71.5%** | **52** |
| `domains/` | 55 | 10,093 | 16.4% | **9** |
| `features/` | 105 | 2,934 | 4.8% | 0 |
| 其余（`adr` / `architecture` / `governance` / `product` / `admin` / `mobile` / `guide`） | 59 | 4,510 | 7.3% | 1 |

> 全仓 219,798 行中有 149,093 行（67.8%）来自 16 份会话导出物（`docs/sources/`、`_session/`、`docs/_exports/`），最大单文件 18,049 行。这部分不参与文档体系治理。

### 1.5 C 类构成（212 份）

| 构成 | 份数 |
|---|---:|
| `features/` 能力卡片（含索引与模板） | 104 |
| 会话导出物 | 16 |
| `development/workflow/` 工作流与清单 | 12 |
| `development/02-identity/`（非契约部分） | 11 |
| `development/admin/`、`development/backend/` | 18 |
| `development/` 其他（顶层、mobile、各域剩余） | 20 |
| 记忆文件、应用 README、e2e 说明 | 8 |
| `domains/` 内派生页 | 3 |

---

## 2. A 类：Product Truth 候选（4 份）

| 文档 | 说明 |
|---|---|
| `docs/docs/product/product-overview.md` | 产品定位与范围（D-001~D-003 事实源） |
| `docs/docs/product/business-model.md` | 业务与商业模型 |
| `docs/docs/product/business-plan.md` | 首发后 12 个月业务规划 |
| `docs/docs/product/feature-rollout.md` | 功能开放与产品规则 |

**判定说明**：这是全仓唯一一组"无下游可推导来源"的产品层文档——它们不被任何代码、schema 或契约文档反向定义。

**关于 `features/` 的 104 份**：虽然描述"用户能完成什么"，但 `DEVELOPMENT_CONTROL_CENTER.md` 明示 *"Feature Page 不取代 Domain / Contract authority"*，且这些页面中位仅 23 行、无 status 字段、含 `delivery_evidence` 反向指针——它们是**能力卡片（派生视图）**，故归 C 而非 A。

---

## 3. B 类：Engineering Truth 候选（93 份）

| 组 | 份数 | 说明 |
|---|---:|---|
| `docs/docs/domains/**` | 54 | 11 个业务域的模型 / 流程 / 契约 / 数据设计（53 份 frozen） |
| `docs/docs/adr/ADR-001~021` | 22 | 架构裁决；ADR-018（全局规范）被引 40 次，为全站最高 |
| `docs/docs/architecture/**` | 9 | 长期架构、领域依赖、数据架构、API 标准（已排除 3 份 moved 存根） |
| `docs/docs/governance/**` | 4 | 决策台账（被引 68 次，全站最高）、未决事项、覆盖清单、文档规范 |
| `database/**` | 3 | schema 检查与冻结物理契约 |
| `docs/docs/development/DEVELOPMENT_CONTROL_CENTER.md` | 1 | 定义 Source of Truth 优先级与 Gate 规则 |

**强规范性文档 TOP 6**（按 FROZEN + 唯一事实源 + must-not 加权）：

| 文档 | FROZEN | canonical | must-not | must |
|---|---:|---:|---:|---:|
| `governance/design-register.md` | 124 | 18 | 37 | 11 |
| `development/02-identity/IDENTITY_IMPLEMENTATION_PLAN.md` | 20 | 13 | 29 | 48 |
| `development/01-foundation/APPLICATION_FOUNDATION_PLAN.md` | 7 | 18 | 27 | 26 |
| `development/05-content/CONTENT_DESIGN_BRIEF.md` | 19 | 19 | 17 | 26 |
| `development/06-learning/LEARNING_DESIGN_BRIEF.md` | 25 | 15 | 16 | 40 |
| `development/04-operations/OPERATIONS_RBAC_CONTRACTS.md` | 31 | 13 | 14 | 9 |

> 除台账外，强规范性文档全部落在 `development/` 层——这是倒挂的量化证据。

---

## 4. 重复 / 冲突清单

### 4.1 同一事实存在多个事实源（E 类主体，39 份）

`development/0X-*/` 与 `domains/<x>/` 的逐字相似度普遍很低（非复制粘贴），属**语义重复**——同一事实、两种表述、双方均自标 FROZEN。

| 主题 | 源 A（`domains/`） | 源 B（`development/`） | 双方状态 |
|---|---|---|---|
| Operations RBAC | `domains/operations/rbac.md`（206 行） | `development/04-operations/OPERATIONS_RBAC_CONTRACTS.md`（965 行） | 均 FROZEN，第 4/5/6/8/9/11 章主题重合 |
| Operations 公共契约 | `domains/operations/contracts.md`（180 行） | `development/04-operations/OPERATIONS_API.md`（696 行） | 均 FROZEN |
| Identity API | `domains/identity/database.md`（124 行） | `development/02-identity/IDENTITY_API.md`（2,442 行） | 均 FROZEN |
| Audio 契约 | `domains/audio/contracts.md`（158 行） | `development/07-audio/AUDIO_PRODUCTION_CONTRACTS.md`（323 行）<br>`AUDIO_PUBLIC_CONTRACTS.md`（143 行） | 均 FROZEN |
| Content 语义 | `domains/content/index.md` | `development/05-content/CONTENT_PRODUCT_SEMANTICS.md` | 均 FROZEN |
| Learning 语义 | `domains/learning/index.md` | `development/06-learning/LEARNING_PRODUCT_SEMANTICS.md` | 均 FROZEN |

**E 类完整清单（`docs/docs` 内 39 份）**：

<details>
<summary>展开全部 39 份路径</summary>

```
development/02-identity/IDENTITY_API.md
development/02-identity/IDENTITY_IMPLEMENTATION_PLAN.md
development/02-identity/IDENTITY_USE_CASES.md
development/03-platform/PLATFORM_ADMIN_EXECUTION_BRIEF.md
development/03-platform/PLATFORM_API.md
development/03-platform/PLATFORM_CONFIG_CONTRACTS.md
development/03-platform/PLATFORM_IMPLEMENTATION_PLAN.md
development/03-platform/PLATFORM_USE_CASES.md
development/04-operations/OPERATIONS_API.md
development/04-operations/OPERATIONS_EXECUTION_BRIEF.md
development/04-operations/OPERATIONS_IMPLEMENTATION_PLAN.md
development/04-operations/OPERATIONS_RBAC_CONTRACTS.md
development/04-operations/OPERATIONS_USE_CASES.md
development/05-content/CONTENT_ADMIN_EXECUTION_BRIEF.md
development/05-content/CONTENT_API.md
development/05-content/CONTENT_DESIGN_BRIEF.md
development/05-content/CONTENT_EXECUTION_BRIEF.md
development/05-content/CONTENT_IMPLEMENTATION_PLAN.md
development/05-content/CONTENT_PRODUCT_SEMANTICS.md
development/05-content/CONTENT_PUBLIC_CONTRACTS.md
development/05-content/CONTENT_USE_CASES.md
development/06-learning/LEARNING_API.md
development/06-learning/LEARNING_DESIGN_BRIEF.md
development/06-learning/LEARNING_EXECUTION_BRIEF.md
development/06-learning/LEARNING_IMPLEMENTATION_PLAN.md
development/06-learning/LEARNING_PRODUCT_SEMANTICS.md
development/06-learning/LEARNING_PROGRESS_CONTRACTS.md
development/06-learning/LEARNING_PUBLIC_CONTRACTS.md
development/06-learning/LEARNING_USE_CASES.md
development/07-audio/AUDIO_API.md
development/07-audio/AUDIO_DESIGN_BRIEF.md
development/07-audio/AUDIO_IMPLEMENTATION_PLAN.md
development/07-audio/AUDIO_PRODUCTION_CONTRACTS.md
development/07-audio/AUDIO_PRODUCT_SEMANTICS.md
development/07-audio/AUDIO_PUBLIC_CONTRACTS.md
development/07-audio/AUDIO_USE_CASES.md
development/SPEC_SYSTEM.md
development/specs/README.md
index.md
```

</details>

> `docs/docs` 外另有 19 份 E 类：10 份 `speckit-*` 技能、6 份 `.specify/` 模板与 constitution（均未裁决归属）、`docs/AGENTS.md`、`docs/CHANGELOG.md`、`docs/PROJECT.md`。

### 4.2 文档 ↔ 代码 / Schema 不一致

| # | 事实 | 文档记载 | 代码 / Schema 实际 |
|---|---|---|---|
| 1 | `identity.admin_credentials` 表 | **0 处提及**（`domains/` 全文检索为空） | 存在于迁移 `1260_admin_credentials.sql`；**不在** `expected-schema.json` |
| 2 | `content.content_revisions` 表 | **0 处提及**；`domains/content/database.md` 声明 content 域 **31 张表** | 迁移 `1240_content_revision.sql` 建表，`expected-schema.json` 亦收录（实际 **32 张**） |
| 3 | PostgreSQL Baseline 报告 | `DEVELOPMENT_PROGRESS.md` 引用 `database/reports/_DATABASE_BASELINE_REPORT.md` | **文件不存在**（实际为 `V2_DATABASE_BASELINE_REPORT.md`，306 KB） |

**根因**：19 个迁移文件中 **8 个无 `Source` 注释**（`0000_infrastructure` 及 `1200`~`1260` 共 7 个后期增量迁移），这些迁移绕过了"由域文档机械生成"的流程，造成文档漂移。

**Schema 三方对账结论**：

| 来源 | 定位 | 与另两方的一致性 |
|---|---|---|
| `docs/docs/domains/<x>/database.md` | 声明为 canonical | 缺 2 张表 |
| `database/migrations/*.sql`（19 个） | 声明为最高权威 | 多 2 张表，且自述"由域文档机械生成" |
| `database/checks/expected-schema.json` | 独立检查基准 | 含 `content_revisions`，不含 `admin_credentials` |

### 4.3 事实源指针悬空

治理台账把三份 `status: moved` 存根页列为"唯一事实源"：

| 存根页 | 自述状态 |
|---|---|
| `docs/docs/architecture/domain-map.md` | `moved` — "不再承载事实、不出现在侧边栏" |
| `docs/docs/architecture/database.md` | `moved` — 同上 |
| `docs/docs/architecture/overview.md` | `moved` — 同上 |

引用分布：

| 引用方 | 引用次数 |
|---|---:|
| `governance/design-register.md` | 21 |
| `governance/source-coverage.md` | 14 |
| **合计** | **35**（分布在 11 份文档中） |

### 4.4 优先级循环

`DEVELOPMENT_CONTROL_CENTER.md` 声明的权威链：

```
Frozen Physical Migration → Accepted ADR → Canonical Product/Domain Docs → ...
```

但 11 个域迁移文件头部同时自述：

```
Generated mechanically from docs/docs/domains/<x>/database.md
Do not edit an applied migration
```

**矛盾**：迁移既是最高权威，又是领域文档的机械产物——二者互为源与产物，形成闭环，无法用于实际冲突裁决。

### 4.5 逐字重复（5-gram Jaccard 相似度）

| 文件 A | 文件 B | 相似度 | 性质 |
|---|---|---:|---|
| `docs/_exports/20260830/transcript.md` | `docs/sources/chatgpt_share_6a9356bb/transcript.md` | 1.000 | 会话导出副本 |
| `_session/chat/transcript.md` | `_session/shares/6a9329e5-refetch/transcript.md` | 1.000 | 会话导出副本 |
| `_session/commerce/transcript.md` | `_session/shares/6a933931-refetch/transcript.md` | 1.000 | 会话导出副本 |
| `.specify/memory/constitution.md` | `.specify/templates/constitution-template.md` | 1.000 | **模板未填写** |
| `features/interface-language/index.md` | `features/theme-settings/index.md` | 0.656 | 能力卡片模板化 |
| `features/promotions-coupons/index.md` | `features/social-membership-entitlements/index.md` | 0.500 | 能力卡片模板化 |

### 4.6 双 Spec 体系并存（阻塞后续 Spec 迁移）

**发现：Spec Kit 已部分安装**，并非"待安装"状态。

| 项 | 实际状态 |
|---|---|
| `.claude/skills/speckit-*`（10 个） | 已存在：analyze / checklist / clarify / constitution / converge / implement / plan / specify / tasks / taskstoissues |
| `.specify/memory/constitution.md` | 与模板**逐字相同**（`diff` 判定 IDENTICAL，未填写） |
| `.specify/templates/` | 6 份模板（checklist / constitution / plan / spec / tasks + 目录结构） |
| `.specify/scripts/powershell` | **空目录** |
| `docs/docs/development/SPEC_SYSTEM.md`（D-154） | 已定义 ZH-LAO 自有 Executable Spec 体系 |
| 实际 spec 文件 | 仅 `domains/content.spec.json` 一份 |

**风险**：两套体系并存且关系未裁决，会形成**第四重事实源**。当前 constitution 未填写，Spec Kit 处于"装了但没启用"的悬置态。

### 4.7 文档 ↔ 代码覆盖度（正面结论）

| 项 | 文档声明 | 代码实际 | 一致性 |
|---|---|---|---|
| 已实现业务域 | `DEVELOPMENT_PROGRESS.md` 记录 identity / platform / operations | `apps/backend/src/modules/` 仅含 identity / operations / platform | ✅ 一致 |
| 测试文件 | — | 后端 40 份、admin 9 份、mobile 8 份（合计 57 份） | ✅ 与控制中心声明吻合 |

> 开发进度文档与实际代码状态一致，这是本次审计中的正面结论：进度类文档可信。

### 4.8 其他结构性问题

| 问题 | 详情 |
|---|---|
| 空 feature 目录 | `features/` 有 105 个目录但仅 102 份 `index.md`；`letter-management/`、`syllable-management/`、`word-management/` 为空目录 |
| 缺失工件 | `docs/docs/development/workflow/FEATURE_PAGE_INDEX.json`、`scripts/validate_feature_pages.py` 被文档引用但不存在 |
| 未解析链接 | 19 处为 VitePress 无扩展名写法（如 `domains/operations/rbac`），非硬死链 |
| 导航孤儿 | 主要为索引页可达，非实质问题 |

---

## 5. 建议废弃 / 降级清单

> 本节仅列"建议"，**未执行任何删除或改动**。执行前须先处理依赖方（尤其是前三项的引用指针）。

| 文档 | 体积 | 理由 | 前置动作 |
|---|---:|---|---|
| `architecture/database.md`、`domain-map.md`、`overview.md` | 存根 | `status: moved`，但被 35 处当事实源引用 | **先改 11 份文档的引用指针，再删** |
| `development/MASTER_DEVELOPMENT_PLAN.md` | 63 行 | `superseded`，仅作兼容入口 | 确认无引用后删 |
| `development/ADMIN_FOUNDATION_PLAN.md` | 1,966 行 | `superseded` | 同上 |
| `development/MOBILE_FOUNDATION_PLAN.md` | 2,370 行 | `superseded` | 同上 |
| `_session/*`（8 份）、`docs/_exports/*`（2 份） | 16 MB | 会话导出物，其中 3 份与 `docs/sources` 逐字重复 | 已 gitignored，可安全清理 |
| `features/letter-management/`、`syllable-management/`、`word-management/` | 空 | 无 `index.md` | 补充内容或删除目录 |
| `adr/_template.md`、`features/_template.md` | 模板 | 模板文件，非文档 | 移出站点或标注 |

---

## 6. 推荐的新 Source-of-Truth 结构

```
truth/
  product/                          产品真相 —— 唯一来源
    product-overview.md
    business-model.md
    business-plan.md
    feature-rollout.md

  contracts/                        唯一冻结契约层 —— 每个主题有且仅有一份
    <domain>/                       由 development/0X-* 与 domains/<x>/ 二选一收敛
    adr/                            ADR-001~021 保留为裁决历史（不改内容，只归档）
    governance/                     design-register + open-questions + source-coverage

  schema/
    domains/<x>.database.md         ← 唯一 schema 权威
    migrations/                     ← 机械产物，禁止手改（从优先级链顶端移除）
    expected-schema.json            ← 由 domains 生成，非独立源

specs/                              单一 spec 体系（ZH-LAO Executable Spec 与 Spec Kit 二选一）
```

### 四条收口规则

1. **一个主题一份冻结契约**
   `development/0X-*/` 与 `domains/<x>/` 的 39 处重叠必须逐对裁决：胜者进 `truth/contracts/`，败者降级为派生视图并显式标注 `derived_from:`。本项目**不代为判断谁正确**，需主会话逐项确认。

2. **打破迁移循环**
   迁移明确为 `domains/*/database.md` 的机械产物，从优先级链顶端移除。`expected-schema.json` 改为生成器输出，不再作为独立人工维护源。

3. **补齐 Schema 漂移**
   `admin_credentials` 与 `content_revisions` 二选一：
   - 方案 A：补进 `domains/` 文档并更新计数（identity 7→8、content 31→32）；
   - 方案 B：回滚对应迁移。
   建议同时补全 7 个无 `Source` 注释的增量迁移的来源声明。

4. **单一 Spec 体系**
   先裁决 ZH-LAO Executable Spec（`SPEC_SYSTEM.md`）与 Spec Kit（`.specify/` + `.claude/skills/speckit-*`）的取舍，再决定 `.specify/` 去留。当前 constitution 未填写，是决策窗口期——此时收敛成本最低。

### 建议处理顺序

| 顺序 | 任务 | 理由 |
|---|---|---|
| 1 | 修复 35 处悬空指针（4.3） | 成本低、风险低，恢复治理台账可信度 |
| 2 | 补齐 schema 漂移（4.2） | 事实明确，二选一即可，避免后续 spec 基于错误表数 |
| 3 | 裁决 Spec 体系（4.6） | 阻塞后续所有 Spec 工作流，决策窗口期 |
| 4 | 逐对裁决 39 处契约重叠（4.1） | 体量最大，需主会话参与，可分期 |
| 5 | 清理 D 类与空目录（第 5 节） | 依赖前四步完成，最后执行 |

---

## 7. 未裁决事项（需人工决策）

本次审计**不判断冲突双方谁正确**。以下事项需主会话决策：

| # | 事项 | 待决选项 |
|---|---|---|
| 1 | Operations RBAC 契约以哪份为准 | `domains/operations/rbac.md` vs `development/04-operations/OPERATIONS_RBAC_CONTRACTS.md` |
| 2 | Identity API 契约以哪份为准 | `domains/identity/database.md`（124 行）vs `development/02-identity/IDENTITY_API.md`（2,442 行） |
| 3 | Content/Learning 语义以哪层为准 | `domains/*/index.md` vs `development/*/PRODUCT_SEMANTICS.md` |
| 4 | 迁移是否保留"最高权威"地位 | 保留 vs 降为机械产物 |
| 5 | `admin_credentials` / `content_revisions` 归属 | 补文档 vs 回滚迁移 |
| 6 | Spec 体系取舍 | ZH-LAO Executable Spec vs Spec Kit vs 融合 |
| 7 | `development/` 层的最终定位 | 降级为实施轨 vs 升为契约层（对应删除 `domains/` 冗余部分） |

---

## 附录 A：复现方法

分析脚本已移出仓库至 `%TEMP%\zh-lao-audit\`，可重新运行以复核任何数字：

| 脚本 | 用途 |
|---|---|
| `audit_scan.py` | 全仓 Markdown 元数据提取（frontmatter / 标题 / 行数）→ `audit_meta.json` |
| `audit_layers.py` | 按目录层输出结构分析 |
| `audit_links.py` | 内部链接解析与死链检测 → `audit_links.json` |
| `audit_dupes.py` | 5-gram Jaccard 两两相似度 → `audit_dupes.json` |
| `audit_normative.py` | 各层规范性语言密度统计（FROZEN / canonical / must / must-not） |
| `audit_schema.py`、`audit_schema3.py` | 迁移 SQL 来源注释提取 + 文档/SQL/JSON 三方对账 |
| `audit_sidebar2.py` | VitePress 侧边栏覆盖与孤儿文档检测 |
| `audit_classify.py` | A~E 五分类判定 → `audit_class.json` |
| `audit_final.py`、`verify.py` | 最终统计汇总 |

运行方式：

```bash
cd /c/project/ZH-LAO
python.exe "C:/Users/admin/AppData/Local/Temp/zh-lao-audit/audit_scan.py"
python.exe "C:/Users/admin/AppData/Local/Temp/zh-lao-audit/audit_classify.py"
```

> 注意：早期脚本会把中间 JSON 写到 `_session/`（已被 `.gitignore` 排除），不会污染 git 跟踪范围。

---

## 附录 B：分类边界说明

- **`features/` 归 C 而非 A**：`DEVELOPMENT_CONTROL_CENTER.md` 明示 Feature Page 不取代 Domain / Contract authority，且页面含 `delivery_evidence` 反向指针，属派生视图。
- **`.claude/skills/`、`_session/`、`docs/sources/`、`docs/_exports/` 主要归 C**：工具配置与会话导出物，非文档体系治理对象。
- **`docs/AGENTS.md`、`CHANGELOG.md`、`PROJECT.md` 归 E**：定位与权威层级未在治理文件中明确定义。
- **B 类中未包含 `development/0X-*` 契约**：因其与 `domains/` 存在未裁决的重叠声明（见 4.1），归入 E 而非 B。

---

*本文件为 Stage 1 审计产物，记录现状与建议，不构成对任何产品需求或架构决策的修改。*
