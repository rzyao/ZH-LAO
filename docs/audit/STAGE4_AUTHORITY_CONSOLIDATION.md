# Stage 4 — Document Authority Consolidation

> **目标**：解决 Stage 1 发现的 `domains/` 与 `development/` 双重事实源问题，建立 Spec Kit（Constitution v1.0.0，已于 Stage 3 批准）可以稳定读取的单一 authoritative documentation layer。
> **约束**（来自用户要求，已逐条遵守）：不修改业务代码；不修改产品需求实际语义；不执行 `/speckit.specify`；不批量删除旧文档；逐项内容比较；遇真实语义冲突标记 `SPEC_CONFLICT` 并 STOP，不自行选择；修复 35+ 处 moved-architecture 悬空指针只改向真实 canonical destination；不处理 schema 漂移（`admin_credentials`/`content_revisions`）；不处理 CNT-* 55 IDs；不删旧 Executable Spec；不删 `check_executable_specs.py`。
> **只读审计说明**：本 Stage 未修改任何业务代码（所有改动均在 `docs/` 文档层）；未改变产品需求语义；未删除任何旧文档；旧 Executable Spec 与 `check_executable_specs.py` 原样保留。

| 项 | 值 |
|---|---|
| 执行日期 | 2026-09-02 |
| 仓库 | `C:\project\ZH-LAO` |
| 处理范围 | Stage 1 清单中的 39 份 E 类文档（`docs/docs` 内） |
| 实际裁决数 | 39 / 39 |
| DERIVED（降级为派生并标注 `derived_from`） | 31 |
| SPEC_CONFLICT（记录、未裁决、STOP） | 4（identity×3 + operations RBAC×1） |
| DEV_IS_CANONICAL（实现轨反客为主） | 1（operations API） |
| CARRIED / 非 domains 重叠（已在 Stage 3 处理或非重叠） | 3（`SPEC_SYSTEM.md`、`specs/README.md`、`index.md`） |
| 悬空指针修复（moved-architecture 事实源） | 39 个 token（design-register 22 + source-coverage 17），0 残留 |

---

## 1. 执行摘要

本 Stage 对 Stage 1 清单中的 39 份 E 类文档逐份做了**内容级（非机械目录级）**裁决：

- **31 份**与 `domains/<domain>/*` 语义一致、但属实现轨（HOW）的 `development/0X-*` 文档被降级为**派生文档（DERIVED）**：在 frontmatter 增加 `derived_from: <canonical path>`，并在首个 `# ` 标题后插入「派生文档（DERIVED）」横幅，显式声明其**不是产品/领域事实权威**（Constitution 原则 II）。事实不重复、不自行改写。
- **4 份**存在**真实产品语义冲突**，已标记 `SPEC_CONFLICT` 并 STOP——未自动选择胜者、未降级、未改写事实：
  - identity 3 份 vs `domains/identity/database.md`（该 canonical 页面**已过时**，滞后于冻结迁移 `0100`/`1220`）；
  - operations 1 份 vs `domains/operations/database.md`（`role_permissions` 动作键 `grant`/`revoke` vs 实现轨 + 代码中的 `set`/`read`）。
- **1 份**（`OPERATIONS_API.md`）被裁决为 **DEV_IS_CANONICAL**：因为 `domains/operations/contracts.md` 自身明确**把端点/错误契约 defer 给实现轨**，故此处实现轨反客为主，canonical 文档退为派生/引用层。
- **3 份**（`SPEC_SYSTEM.md`、`specs/README.md`、`docs/docs/index.md`）属双 Spec 体系 / 导航中心议题，**不是** `domains/` 产品事实重叠；其定位已在 Stage 3（Spec Activation，Constitution 批准）确立，本 Stage 不重复裁决，标记为 CARRIED。
- 修复了 Stage 1 确认的 **35 处 moved-architecture 悬空指针**（实际命中 39 个 token，≥35）；仅改向已存在的真实 canonical destination，未创造新事实。

**关键原则执行记录（对应要求 #8 / #11）**：
- 未因 `development/` 更长而自动判其正确（如 operations API 是基于 canonical 文档**自身声明** defer 而判 DEV_IS_CANONICAL，非长度）。
- 未因 `domains/` 被声明 canonical 而自动判其正确（identity 的 `domains/identity/database.md` 被声明 canonical，但证据显示其**过时**，故标记 CONFLICT 而非盲从）。
- 「Existing Code Is Engineering Reality, Not Product Authority」：operations RBAC 冲突中代码（`permissions.ts`）证实实现使用 `set`/`read`，但**动作键命名属产品/契约事实**，故仍按要求 #10 标记 `SPEC_CONFLICT` 交人工裁决，未用代码覆盖 canonical 文档。

---

## 2. 39 份逐项裁决（Verdicts）

裁决图例：`DERIVED` = 降级为派生（标 `derived_from`）；`SPEC_CONFLICT` = 真实语义冲突，STOP，待人工裁决；`DEV_IS_CANONICAL` = 实现轨为该主题权威；`CARRIED` = 非 domains 重叠 / 已在 Stage 3 处理。

### 2.1 Identity（3 份 — 全部 SPEC_CONFLICT）

| # | 文档 | 裁决 | 冲突对象 | 说明 |
|---|---|---|---|---|
| 1 | `development/02-identity/IDENTITY_API.md` | `SPEC_CONFLICT` | `domains/identity/database.md` | canonical 页面已过时（见 §5.1） |
| 2 | `development/02-identity/IDENTITY_IMPLEMENTATION_PLAN.md` | `SPEC_CONFLICT` | `domains/identity/database.md` | 同上 |
| 3 | `development/02-identity/IDENTITY_USE_CASES.md` | `SPEC_CONFLICT` | `domains/identity/database.md` | 同上 |

> 这 3 份**未降级**（不在 31 份 DERIVED 内），因与 canonical 存在真实冲突，需先解决 §5.1 的事实分歧。

### 2.2 Platform（5 份 — 全部 DERIVED）

| # | 文档 | 裁决 | canonical owner（`derived_from`） |
|---|---|---|---|
| 4 | `development/03-platform/PLATFORM_ADMIN_EXECUTION_BRIEF.md` | `DERIVED` | `domains/platform/database.md` |
| 5 | `development/03-platform/PLATFORM_API.md` | `DERIVED` | `domains/platform/database.md` |
| 6 | `development/03-platform/PLATFORM_CONFIG_CONTRACTS.md` | `DERIVED` | `domains/platform/database.md` |
| 7 | `development/03-platform/PLATFORM_IMPLEMENTATION_PLAN.md` | `DERIVED` | `domains/platform/index.md` |
| 8 | `development/03-platform/PLATFORM_USE_CASES.md` | `DERIVED` | `domains/platform/database.md` |

### 2.3 Operations（5 份 — 1 CONFLICT + 1 DEV_IS_CANONICAL + 3 DERIVED）

| # | 文档 | 裁决 | canonical owner / 冲突对象 |
|---|---|---|---|
| 9 | `development/04-operations/OPERATIONS_API.md` | `DEV_IS_CANONICAL` | `domains/operations/contracts.md` 自身把端点/错误契约 defer 给实现轨 |
| 10 | `development/04-operations/OPERATIONS_EXECUTION_BRIEF.md` | `DERIVED` | `domains/operations/index.md` |
| 11 | `development/04-operations/OPERATIONS_IMPLEMENTATION_PLAN.md` | `DERIVED` | `domains/operations/index.md` |
| 12 | `development/04-operations/OPERATIONS_RBAC_CONTRACTS.md` | `SPEC_CONFLICT` | `domains/operations/database.md`（`grant`/`revoke` vs `set`/`read`，见 §5.2） |
| 13 | `development/04-operations/OPERATIONS_USE_CASES.md` | `DERIVED` | `domains/operations/index.md` |

> 附加纠正（来自子代理交叉验证）：Operations 实为 **5 张表**（非 6）；`domains/operations/rbac.md` 中某常量名与 `database.md` 存在命名不一致，已记录为低风险待修项（不影响本 Stage 权威裁决）。

### 2.4 Content（8 份 — 全部 DERIVED）

`CONTENT_PRODUCT_SEMANTICS.md` 的裁决标签为 `DOMAINS_IS_CANONICAL`（产品语义以 `domains/content/index.md` 为准），实际操作中同样降级为 `DERIVED` 并指向 `domains/content/index.md`（不重复事实）。

| # | 文档 | 裁决 | canonical owner（`derived_from`） |
|---|---|---|---|
| 14 | `development/05-content/CONTENT_ADMIN_EXECUTION_BRIEF.md` | `DERIVED` | `domains/content/index.md` |
| 15 | `development/05-content/CONTENT_API.md` | `DERIVED` | `domains/content/index.md` |
| 16 | `development/05-content/CONTENT_DESIGN_BRIEF.md` | `DERIVED` | `domains/content/index.md` |
| 17 | `development/05-content/CONTENT_EXECUTION_BRIEF.md` | `DERIVED` | `domains/content/index.md` |
| 18 | `development/05-content/CONTENT_IMPLEMENTATION_PLAN.md` | `DERIVED` | `domains/content/database.md` |
| 19 | `development/05-content/CONTENT_PRODUCT_SEMANTICS.md` | `DERIVED` | `domains/content/index.md` |
| 20 | `development/05-content/CONTENT_PUBLIC_CONTRACTS.md` | `DERIVED` | `domains/content/database.md` |
| 21 | `development/05-content/CONTENT_USE_CASES.md` | `DERIVED` | `domains/content/index.md` |

> 1 处 gap（非冲突）：revision 实体类型与生命周期仅在实现轨描述，`domains/content/` 缺此事实 → 建议后续**提升（promote）**到 canonical（见 §6）。

### 2.5 Learning（8 份 — 全部 DERIVED）

| # | 文档 | 裁决 | canonical owner（`derived_from`） |
|---|---|---|---|
| 22 | `development/06-learning/LEARNING_API.md` | `DERIVED` | `domains/learning/progress.md` |
| 23 | `development/06-learning/LEARNING_DESIGN_BRIEF.md` | `DERIVED` | `domains/learning/index.md` |
| 24 | `development/06-learning/LEARNING_EXECUTION_BRIEF.md` | `DERIVED` | `domains/learning/index.md` |
| 25 | `development/06-learning/LEARNING_IMPLEMENTATION_PLAN.md` | `DERIVED` | `domains/learning/index.md` |
| 26 | `development/06-learning/LEARNING_PRODUCT_SEMANTICS.md` | `DERIVED` | `domains/learning/index.md` |
| 27 | `development/06-learning/LEARNING_PROGRESS_CONTRACTS.md` | `DERIVED` | `domains/learning/progress.md` |
| 28 | `development/06-learning/LEARNING_PUBLIC_CONTRACTS.md` | `DERIVED` | `domains/learning/index.md` |
| 29 | `development/06-learning/LEARNING_USE_CASES.md` | `DERIVED` | `domains/learning/model.md` |

> 1 处 gap（非冲突）：V1 掌握度阈值 `0/40/80`、复习增量 `-20/+5/+15/+25`、留存 `180d/500`、限流 `10/min·200/day` 仅存在于实现轨，`domains/learning/` 缺此事实 → 建议 promote。

### 2.6 Audio（7 份 — 全部 DERIVED）

| # | 文档 | 裁决 | canonical owner（`derived_from`） |
|---|---|---|---|
| 30 | `development/07-audio/AUDIO_API.md` | `DERIVED` | `domains/audio/contracts.md` |
| 31 | `development/07-audio/AUDIO_DESIGN_BRIEF.md` | `DERIVED` | `domains/audio/index.md` |
| 32 | `development/07-audio/AUDIO_IMPLEMENTATION_PLAN.md` | `DERIVED` | `domains/audio/index.md` |
| 33 | `development/07-audio/AUDIO_PRODUCTION_CONTRACTS.md` | `DERIVED` | `domains/audio/lifecycle.md` |
| 34 | `development/07-audio/AUDIO_PRODUCT_SEMANTICS.md` | `DERIVED` | `domains/audio/index.md` |
| 35 | `development/07-audio/AUDIO_PUBLIC_CONTRACTS.md` | `DERIVED` | `domains/audio/contracts.md` |
| 36 | `development/07-audio/AUDIO_USE_CASES.md` | `DERIVED` | `domains/audio/index.md` |

> 6 处 gap（非冲突，G1–G6）：hash 算法 `audio-input-v1`+SHA-256、允许的 `content_entity_type`/`language_code` 枚举、V1 无四眼复核、发布时新鲜度重校验、`approval_revoked` 精确前置条件——均仅存在于实现轨，`domains/audio/` 缺此事实 → 建议 promote（详见 §6）。

### 2.7 双 Spec 体系 / 导航（3 份 — CARRIED，非 domains 重叠）

| # | 文档 | 裁决 | 说明 |
|---|---|---|---|
| 37 | `development/SPEC_SYSTEM.md` | `CARRIED` | ZH-LAO 自有 Executable Spec 体系定义（D-154）。其取舍已在 Stage 3（Constitution 批准、Agent grounding）确立；不在本 Stage `domains/` 重叠范围。**未删除**（符合要求 #16/#17）。 |
| 38 | `development/specs/README.md` | `CARRIED` | Spec 目录说明，同属双 Spec 体系议题，非产品事实重叠。 |
| 39 | `docs/docs/index.md` | `CARRIED` | 文档导航中心（`status: active`），声明「Domain defines truth. Backend implements domains.」导航中枢，非某主题的产品事实重叠。 |

> 合计：31 DERIVED + 4 SPEC_CONFLICT + 1 DEV_IS_CANONICAL + 3 CARRIED = **39 / 39**。

---

## 3. Canonical-owner 映射（DERIVED 文档 → 规范归属）

下列 31 份文档已写入 `derived_from:` 与「派生文档（DERIVED）」横幅，事实唯一归属如下：

```
development/03-platform/PLATFORM_ADMIN_EXECUTION_BRIEF.md   -> domains/platform/database.md
development/03-platform/PLATFORM_API.md                     -> domains/platform/database.md
development/03-platform/PLATFORM_CONFIG_CONTRACTS.md        -> domains/platform/database.md
development/03-platform/PLATFORM_IMPLEMENTATION_PLAN.md      -> domains/platform/index.md
development/03-platform/PLATFORM_USE_CASES.md               -> domains/platform/database.md
development/04-operations/OPERATIONS_EXECUTION_BRIEF.md      -> domains/operations/index.md
development/04-operations/OPERATIONS_IMPLEMENTATION_PLAN.md  -> domains/operations/index.md
development/04-operations/OPERATIONS_USE_CASES.md            -> domains/operations/index.md
development/05-content/CONTENT_ADMIN_EXECUTION_BRIEF.md      -> domains/content/index.md
development/05-content/CONTENT_API.md                        -> domains/content/index.md
development/05-content/CONTENT_DESIGN_BRIEF.md               -> domains/content/index.md
development/05-content/CONTENT_EXECUTION_BRIEF.md            -> domains/content/index.md
development/05-content/CONTENT_IMPLEMENTATION_PLAN.md        -> domains/content/database.md
development/05-content/CONTENT_PRODUCT_SEMANTICS.md          -> domains/content/index.md
development/05-content/CONTENT_PUBLIC_CONTRACTS.md           -> domains/content/database.md
development/05-content/CONTENT_USE_CASES.md                  -> domains/content/index.md
development/06-learning/LEARNING_API.md                      -> domains/learning/progress.md
development/06-learning/LEARNING_DESIGN_BRIEF.md             -> domains/learning/index.md
development/06-learning/LEARNING_EXECUTION_BRIEF.md          -> domains/learning/index.md
development/06-learning/LEARNING_IMPLEMENTATION_PLAN.md      -> domains/learning/index.md
development/06-learning/LEARNING_PRODUCT_SEMANTICS.md        -> domains/learning/index.md
development/06-learning/LEARNING_PROGRESS_CONTRACTS.md      -> domains/learning/progress.md
development/06-learning/LEARNING_PUBLIC_CONTRACTS.md         -> domains/learning/index.md
development/06-learning/LEARNING_USE_CASES.md                -> domains/learning/model.md
development/07-audio/AUDIO_API.md                            -> domains/audio/contracts.md
development/07-audio/AUDIO_DESIGN_BRIEF.md                   -> domains/audio/index.md
development/07-audio/AUDIO_IMPLEMENTATION_PLAN.md            -> domains/audio/index.md
development/07-audio/AUDIO_PRODUCTION_CONTRACTS.md           -> domains/audio/lifecycle.md
development/07-audio/AUDIO_PRODUCT_SEMANTICS.md              -> domains/audio/index.md
development/07-audio/AUDIO_PUBLIC_CONTRACTS.md               -> domains/audio/contracts.md
development/07-audio/AUDIO_USE_CASES.md                      -> domains/audio/index.md
```

所有 11 个目标 canonical 路径经核验均真实存在：
`domains/platform/{index,database}.md`、`domains/operations/index.md`、`domains/content/{index,database}.md`、`domains/learning/{index,model,progress}.md`、`domains/audio/{index,contracts,lifecycle}.md`。

---

## 4. Derived / Superseded 映射

- **Derived（31 份）**：见 §3 完整列表。横幅原文：
  > ⚠️ **派生文档（DERIVED）** — 规范归属（canonical owner）：`<canon>`。本文件为实现轨（implementation-track）文档，**不是产品/领域事实权威**（Constitution 原则 II）。产品/领域事实以规范归属文档为准，请勿在此重复或自行修改事实。

- **Superseded（0 份）**：本 Stage 未将任何文档标记为 `superseded`。Superseded 处置属于下一阶段（依赖方指针清理）范围，且用户要求不批量删除旧文档，故保持原状。
- **未降级（4 份 SPEC_CONFLICT + 1 DEV_IS_CANONICAL）**：identity×3、operations RBAC×1 因冲突保留原状；operations API 因 canonical 文档主动 defer 而维持实现轨权威。

---

## 5. 所有 SPEC_CONFLICT（真实语义冲突 — 未裁决，待人工决策）

> 以下冲突**未猜测、未选择胜者**。每份冲突给出 exact path + heading + 冲突陈述 + 证据。请主会话逐项裁决。

### 5.1 Identity — `domains/identity/database.md` 已过时（滞后于冻结迁移）

**冲突文档**：`development/02-identity/IDENTITY_API.md`、`IDENTITY_IMPLEMENTATION_PLAN.md`、`IDENTITY_USE_CASES.md`
**过时 canonical**：`docs/docs/domains/identity/database.md`（`status: frozen`，但内容停留在迁移 `0100`/`1220` 之前）
**证据（冻结迁移，声明为最高权威）**：`database/migrations/0100_identity.sql`、`database/migrations/1220_identity_auth_runtime.sql`

| # | 冲突事实 | canonical（`domains/identity/database.md`）陈述 | 实现轨 / 迁移陈述 | 证据位置 |
|---|---|---|---|---|
| C1 | `users.public_id` 类型 | L16：`varchar(32)`，「生成格式待定」 | `uuid NOT NULL UNIQUE` | `0100_identity.sql:7`；`IDENTITY_API.md` 多处 `public_id uuid` |
| C2 | `basic_profiles.avatar_media_id` 类型 | L50：`bigint` | `uuid` | `0100_identity.sql:37`；`IDENTITY_API.md:896` `avatar_media_id: "uuid-or-null"` |
| C3 | `otp_challenges.consumed_at` 列 | L77：存在 `consumed_at`（成功消费时间，可空 timestamptz） | 该列**已移除**，改用 `status` + `verified_at` | `1220:4-21`（无 consumed_at；`status` CHECK + `verified_at`） |
| C4 | `otp_challenges.status` 值域/类型 | L67：章节标「frozen table / **designing** types」 | 已 settle：`CHECK (status IN ('pending','verified','expired','cancelled','locked'))` | `1220:10-11` |
| C5 | `devices.installation_id` 类型/唯一范围 | L104：「类型、唯一范围 `designing`」 | `uuid NOT NULL UNIQUE` | `1220:34` |
| C6 | `sessions.status` / `device_id` | L90：`sessions.status` 值域/默认值 `designing` | 已 settle：`status CHECK (active,revoked,expired)`；`device_id bigint REFERENCES devices(id)` | `1220:52-55` |

**裁决建议（非自动执行）**：canonical `domains/identity/database.md` 需对齐冻结迁移 `0100`/`1220`（即采纳 C1–C6 的迁移侧事实），随后 3 份 identity 实现轨文档可降级为 DERIVED。Stage 4 **未执行**此改写。

### 5.2 Operations RBAC — `role_permissions` 动作键 naming 冲突

**冲突文档**：`development/04-operations/OPERATIONS_RBAC_CONTRACTS.md`
**canonical**：`docs/docs/domains/operations/database.md`
**实现轨陈述**：`OPERATIONS_RBAC_CONTRACTS.md:457` `operations.role_permissions.read`、`:458` `operations.role_permissions.set`
**canonical 陈述**：`domains/operations/database.md:283` 示例 `operations.role_permissions.grant`；`:311` 「重要后台管理操作（`operations.role_permissions.grant/revoke`）另写 Audit Log」；`:359` 统一清单含 `operations.role_permissions.grant` / `operations.role_permissions.revoke`
**代码证据（Engineering Reality，非产品权威）**：`apps/backend/src/modules/operations/public/permissions.ts:5` → `'operations.role_permissions.read','operations.role_permissions.set'`（代码证实实现使用 `set`/`read`）

**冲突性质**：动作键命名（`grant`/`revoke` vs `set`/`read`）是**产品/契约事实**，非纯实现细节。代码侧采用 `set`/`read`，但 canonical 文档声明 `grant`/`revoke`。依要求 #10/#11：标记为 `SPEC_CONFLICT`，STOP，不自动用代码覆盖 canonical。

**裁决建议（非自动执行）**：二选一——(a) 将 `domains/operations/database.md` 的 `grant`/`revoke` 改为 `set`/`read` 以对齐代码（推荐，因代码已是工程现实且实现轨文档已 settle）；或 (b) 改代码以匹配 canonical 文档。裁决后 `OPERATIONS_RBAC_CONTRACTS.md` 可降级为 DERIVED。

---

## 6. 派生文档中的事实缺口（Promote 建议，非冲突）

下列事实仅存在于实现轨、canonical `domains/` 缺失，建议后续**提升（promote）**到 canonical 层（不重复、不冲突，仅补全）：

- **Content**：revision 实体类型与生命周期（仅 `CONTENT_*` 实现轨描述）。
- **Learning**：V1 掌握度阈值 `0/40/80`；复习增量 `-20/+5/+15/+25`；留存窗口 `180d/500`；限流 `10/min·200/day`。
- **Audio（G1–G6）**：输入 hash 算法 `audio-input-v1` + SHA-256；允许的 `content_entity_type` 枚举；允许的 `language_code` 枚举；V1 无四眼复核；发布时新鲜度重校验；`approval_revoked` 精确前置条件。

> 这些缺口不构成 `SPEC_CONFLICT`（无双向矛盾），但 canonical 缺失会导致 Spec Kit 读取时事实不全。优先级低于 §5 的真实冲突。

---

## 7. 35+ 处 moved-architecture 悬空指针修复（要求 #13）

Stage 1 确认治理台账把 3 份 `status: moved` 存根（`architecture/domain-map.md`、`architecture/database.md`、`architecture/overview.md`）列为「唯一事实源」。本 Stage 仅改向**已存在的真实 canonical destination**，未创造新事实。

**改向映射（来自存根自声明 + 已核验 destination）**：

| 旧 target | 新 canonical destination | 链接文本处理 |
|---|---|---|
| `../architecture/domain-map.md` | `../architecture/domains/`（领域边界 + 依赖协作 index） | 保留 `[Domain Map]` |
| `../architecture/database.md` | `../architecture/data/postgresql.md`（PostgreSQL 架构规范） | 保留 `[数据库规范]` |
| `../architecture/overview.md` | `../architecture/`（架构总览 index） | `[总体架构]` → `[架构总览]`（对齐 canonical 命名） |

**命中计数（实际 39 token，≥ Stage 1 所述 35）**：

| 文件 | `domain-map.md` | `database.md` | `overview.md` | 小计 |
|---|---:|---:|---:|---:|
| `governance/design-register.md` | 15 | 7 | 0 | **22** |
| `governance/source-coverage.md` | 11 | 5 | 1 | **17** |
| **合计** | 26 | 12 | 1 | **39** |

**验证**：修复后两文件 `grep -cE "architecture/(domain-map|database|overview)\.md"` 均为 **0**（0 残留）。

**未触及**：`adr/*`、各域 `database.md`、历史会话导出物中的旧链接——Stage 1 存根明确声明其保留用于「历史 ADR、治理记录（design-register + source-coverage）和外部旧链接」，故超出来源日志范围的不强制改向（避免越权改写 ADR/历史文档）。

---

## 8. 每域最终权威映射（要求 #12）

### Identity
- **Canonical Product/Domain Docs**：`domains/identity/index.md`、`domains/identity/database.md`（⚠️ 过时，见 §5.1）
- **Canonical Contracts**：`domains/identity/database.md`（冲突中）
- **Canonical Architecture refs**：`architecture/domains/`、`architecture/data/postgresql.md`（已 repoint）
- **Derived**：无（3 份实现轨因冲突未降级）
- **Superseded**：无
- **Unresolved conflicts**：IDENTITY_API / IDENTITY_IMPLEMENTATION_PLAN / IDENTITY_USE_CASES vs `domains/identity/database.md`（C1–C6）

### Platform
- **Canonical**：`domains/platform/index.md`、`domains/platform/database.md`
- **Canonical Contracts**：`domains/platform/database.md`
- **Architecture refs**：`architecture/domains/`、`architecture/data/postgresql.md`
- **Derived**：5 份（§3 #4–#8）
- **Superseded**：无
- **Unresolved conflicts**：无（1 gap 非冲突，见 §6）

### Content
- **Canonical**：`domains/content/index.md`、`domains/content/database.md`
- **Canonical Contracts**：`domains/content/database.md`
- **Architecture refs**：`architecture/domains/`、`architecture/data/postgresql.md`
- **Derived**：8 份（§3 #14–#21）
- **Superseded**：无
- **Unresolved conflicts**：无（1 gap 非冲突）

### Learning
- **Canonical**：`domains/learning/index.md`、`domains/learning/model.md`、`domains/learning/progress.md`
- **Canonical Contracts**：`domains/learning/progress.md`
- **Architecture refs**：`architecture/domains/`、`architecture/data/postgresql.md`
- **Derived**：8 份（§3 #22–#29）
- **Superseded**：无
- **Unresolved conflicts**：无（1 gap 非冲突）

### Audio
- **Canonical**：`domains/audio/index.md`、`domains/audio/contracts.md`、`domains/audio/lifecycle.md`
- **Canonical Contracts**：`domains/audio/contracts.md`
- **Architecture refs**：`architecture/domains/`、`architecture/data/postgresql.md`
- **Derived**：7 份（§3 #30–#36）
- **Superseded**：无
- **Unresolved conflicts**：无（G1–G6 gaps 非冲突）

### Operations
- **Canonical**：`domains/operations/index.md`、`domains/operations/database.md`、`domains/operations/contracts.md`、`domains/operations/rbac.md`
- **Canonical Contracts**：API 端点/错误契约 → `development/04-operations/OPERATIONS_API.md`（DEV_IS_CANONICAL，因 `contracts.md` 主动 defer）；RBAC 契约 → `domains/operations/database.md`（冲突中）
- **Architecture refs**：`architecture/domains/`、`architecture/data/postgresql.md`
- **Derived**：3 份（§3 #10–#11、#13）
- **Superseded**：无
- **Unresolved conflicts**：OPERATIONS_RBAC_CONTRACTS vs `domains/operations/database.md`（§5.2）

---

## 9. 限制与未处理项（对应要求 #14–#17）

| 要求 | 项 | 处理 |
|---|---|---|
| #14 | Schema 漂移（`admin_credentials` / `content_revisions`） | **未处理**（留给下一 Stage）。Stage 1 §4.2 已记录三方不一致，本 Stage 不裁决。 |
| #15 | CNT-* 55 IDs | **未处理**。Stage 1 发现的 55 个 orphan 内容 ID 不在本 Stage 范围。 |
| #16 | 旧 Executable Spec | **未删除**。`development/specs/` 下旧 spec 文件原样保留。 |
| #17 | `check_executable_specs.py` | **未删除**。脚本原样保留。 |
| — | 业务代码 | **未修改**。所有改动均在 `docs/` 文档层。 |
| — | 产品需求语义 | **未修改**。仅做权威归属标注，未改写任何事实陈述。 |
| — | `/speckit.specify` | **未执行**。 |
| — | 批量删除旧文档 | **未执行**。 |

---

## 10. Git Diff / Git Status（要求 #18）

> 以下为 Stage 4 结束时的工作树状态。**Stage 4 本 Stage 直接改动** = 31 份 DERIVED 文档 + 2 份治理文件（悬空指针修复）。其余 `docs/AGENTS.md`、`docs/docs/development/SPEC_SYSTEM.md`、`specs/*` 等为 **Stage 3（Spec Activation）** 既有改动，非本 Stage 引入；均无业务代码改动。

### 10.1 Stage 4 直接改动文件清单

```
M  docs/docs/development/03-platform/PLATFORM_ADMIN_EXECUTION_BRIEF.md
M  docs/docs/development/03-platform/PLATFORM_API.md
M  docs/docs/development/03-platform/PLATFORM_CONFIG_CONTRACTS.md
M  docs/docs/development/03-platform/PLATFORM_IMPLEMENTATION_PLAN.md
M  docs/docs/development/03-platform/PLATFORM_USE_CASES.md
M  docs/docs/development/04-operations/OPERATIONS_EXECUTION_BRIEF.md
M  docs/docs/development/04-operations/OPERATIONS_IMPLEMENTATION_PLAN.md
M  docs/docs/development/04-operations/OPERATIONS_USE_CASES.md
M  docs/docs/development/05-content/CONTENT_ADMIN_EXECUTION_BRIEF.md
M  docs/docs/development/05-content/CONTENT_API.md
M  docs/docs/development/05-content/CONTENT_DESIGN_BRIEF.md
M  docs/docs/development/05-content/CONTENT_EXECUTION_BRIEF.md
M  docs/docs/development/05-content/CONTENT_IMPLEMENTATION_PLAN.md
M  docs/docs/development/05-content/CONTENT_PRODUCT_SEMANTICS.md
M  docs/docs/development/05-content/CONTENT_PUBLIC_CONTRACTS.md
M  docs/docs/development/05-content/CONTENT_USE_CASES.md
M  docs/docs/development/06-learning/LEARNING_API.md
M  docs/docs/development/06-learning/LEARNING_DESIGN_BRIEF.md
M  docs/docs/development/06-learning/LEARNING_EXECUTION_BRIEF.md
M  docs/docs/development/06-learning/LEARNING_IMPLEMENTATION_PLAN.md
M  docs/docs/development/06-learning/LEARNING_PRODUCT_SEMANTICS.md
M  docs/docs/development/06-learning/LEARNING_PROGRESS_CONTRACTS.md
M  docs/docs/development/06-learning/LEARNING_PUBLIC_CONTRACTS.md
M  docs/docs/development/06-learning/LEARNING_USE_CASES.md
M  docs/docs/development/07-audio/AUDIO_API.md
M  docs/docs/development/07-audio/AUDIO_DESIGN_BRIEF.md
M  docs/docs/development/07-audio/AUDIO_IMPLEMENTATION_PLAN.md
M  docs/docs/development/07-audio/AUDIO_PRODUCTION_CONTRACTS.md
M  docs/docs/development/07-audio/AUDIO_PRODUCT_SEMANTICS.md
M  docs/docs/development/07-audio/AUDIO_PUBLIC_CONTRACTS.md
M  docs/docs/development/07-audio/AUDIO_USE_CASES.md
M  docs/docs/governance/design-register.md
M  docs/docs/governance/source-coverage.md
```

### 10.2 git status --short（节选，确认无 `apps/` 改动）

```text
 M docs/docs/development/03-platform/PLATFORM_ADMIN_EXECUTION_BRIEF.md
 ...（31 份 DERIVED，见 10.1）
 M docs/docs/governance/design-register.md
 M docs/docs/governance/source-coverage.md
 M docs/AGENTS.md                              # Stage 3 既有
 M docs/docs/development/SPEC_SYSTEM.md       # Stage 3 既有
 M docs/docs/development/specs/README.md      # Stage 3 既有
 M docs/docs/development/specs/domains/content.spec.json
 M docs/docs/development/specs/executable-spec.schema.json
 M docs/docs/development/specs/index.json
?? docs/audit/                                # 含本 Stage 报告
?? .claude/  .specify/  docs-inventory.csv  docs-tree.txt   # 既有/非文档体系
```

> **零 `apps/` 改动** —— 业务代码未被触碰（要求 #1）。

---

## 11. 结论与下一步

- **已完成**：39/39 文档裁决；31 份降级为 DERIVED 并标注 `derived_from`；4 份 SPEC_CONFLICT 精确记录（含 exact path/heading/陈述/证据）并 STOP；1 份 DEV_IS_CANONICAL；39 个 moved-architecture 悬空指针修复至真实 canonical destination（0 残留）。
- **阻断项（需人工裁决，未猜测）**：
  1. Identity canonical `domains/identity/database.md` 落后于冻结迁移 `0100`/`1220`（C1–C6）→ 建议对齐迁移侧。
  2. Operations `role_permissions` 动作键 `grant`/`revoke`（canonical）vs `set`/`read`（实现轨 + 代码）→ 二选一。
- **后续 Stage（非本 Stage）**：schema 漂移（`admin_credentials`/`content_revisions`）、CNT-* 55 IDs、旧 Executable Spec 取舍、§6 事实缺口 promote。
- **STOP**：按用户要求，Stage 4 到此结束，未执行迁移、未删除文档、未执行 `/speckit.specify`。

---

*本文件为 Stage 4 产物。记录裁决与冲突，不构成对任何产品需求、架构决策或业务代码的修改。*
