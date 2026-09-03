# ZH-LAO Foundation Audit（正式开发前基础建设审计与整改）

> 文档性质：**Audit + Consolidation Planning（审计与整改规划）**，非实现。
> 本轮产出为审计报告与整改 Work Package 拆分；**不修改任何业务代码、不开始新 Feature、不重写 Feature 页面**。
> 审计日期：2026-09-04 ｜ 审计范围：仓库真实状态（已读取，未猜测）
> 远程仓库：`https://github.com/rzyao/ZH-LAO`

---

## 1. Executive Summary（执行摘要）

ZH-LAO 的基础建设**整体优于典型"迁移后"项目**：文档事实链、冻结的 PostgreSQL 领域 schema、后端架构护栏（模块边界 / 事务 Outbox / Zod 严格校验 / RBAC catalog）都已是强资产。但存在 **2 个 P0 Blocker**，会直接导致"Foundation Gate 无法判绿"与"客户端按冻结契约实现会全线失败"。

最关键的纠正（推翻旧认知）：后端实际为 **Fastify 5 + 原生 `pg`（无 ORM，裸 SQL）+ PostgreSQL 18（Zeabur 托管）**，并非记忆中的 NestJS/TypeORM/MySQL。数据库引擎冲突**不存在**——文档与运行时代码一致。

总体判定：**FOUNDATION NOT READY**（存在 2 个 P0 Blocker）。

| 维度 | 结论 |
|---|---|
| P0 Blocker 数量 | **2** |
| P1 整改项数量 | **9**（见 §16） |
| P2 整改项数量 | **10**（见 §16） |
| 最大基础风险 | API 错误信封违反冻结契约；Foundation CI 引用不存在的 `database/v2`；能力适配器层（TTS/翻译/音频/媒体/对象存储/缓存）全缺；幂等层缺失；文档验证漂移 2/103 |
| 建议整改 Work Package | **8 个**（§17），其中 5 个可并行 |
| Foundation Gate | **FOUNDATION NOT READY** |

---

## 2. Repository Baseline（仓库基线）

真实结构（已 `ls` 核实，与提示词假设的 monorepo 不同）：

```
ZH-LAO/
├── apps/
│   ├── backend/      Fastify 5 + pg（原生 SQL），Node 22，pnpm，vitest
│   ├── admin/        React 19 + Vite + @tanstack/router + Tailwind v4 + Playwright
│   └── mobile/       Expo RN 0.81 + React Navigation 7 + Tailwind v3 + jest
├── database/         PostgreSQL 18 迁移（forward-only），package name=zh-lao-v2-database
├── docs/            VitePress 文档站（docs/docs/developer 全景 + reference/*）
├── scripts/         只读检查/维护工具（Python + mjs）
├── specs/           Spec Kit 工件（001-user-login … 005-unified-api-contract）
├── .specify/        Spec Kit（canonical，被 AGENTS.md 引用）
├── .product-forge/  Product Forge CLI 配置（孤儿工具，见 §9/§15）
├── .claude/ .agents/ 代理工具目录（无根路由文档）
└── .github/workflows/foundation.yml   CI（backend/admin/docs 阻塞；mobile 非阻塞）
```

**关键事实**
- 无根 `package.json`、无 `pnpm-workspace.yaml` / `turbo` / `nx` / `lerna` → **不是统一 monorepo workspace**，三个 app 各自独立。
- 无 `packages/` `services/` `workers/` 根目录；后端之外无独立服务/Worker 进程（Outbox 轮询在 `apps/backend/src/worker.ts` 内）。
- 实际 DB 引擎 = PostgreSQL（backend `.env`：`postgresql://...@47.81.10.76:32471/zeabur`；`.env.example`：`postgresql://...@127.0.0.1:5432/zh_lao`）。
- 冻结 schema：11 业务 schema + `infrastructure`，约 122~127 张业务表，迁移至 `1270_platform_menus.sql`。

---

## 3. Foundation Matrix（基础矩阵）

状态仅用 PASS / PARTIAL / MISSING / CONFLICT；优先级 P0 阻塞正式开发 / P1 核心业务前完成 / P2 上线前完成。

| Foundation | Status | Current State | Problems | Risk | Required Action | Priority |
|---|---|---|---|---|---|---|
| Product | PASS | 10 要素齐全且自洽（reference/product 4 文件，status:baseline） | 根目录 4 个 research .md 为平行非权威副本 | 漂移 | 处置根 research md（归档/链接） | P2 |
| Domain | PASS | 11 域边界/职责/依赖方向明确，单一事实归属硬规则 | 多数域无对应 Feature 文档（覆盖缺口） | 覆盖 | 补充 Feature↔Domain 映射 | P2 |
| Architecture | PARTIAL | 通用技术基座扎实（DB/事务/Outbox/Worker/错误/日志/模块边界护栏，CI 级 lint 强制） | Translation/TTS/Audio/Media/Cache/ObjectStorage/外部适配器**统一能力层全缺**；7/11 业务域零代码 | 能力无法落地 | 建平台能力适配器层 | P1 |
| Technology | PARTIAL | 栈现代且基本冻结（Fastify/pg/Postgres/Zod/pino/React19/Vite/Expo） | 无 ORM（裸 SQL，决策待明示）、无缓存/Redis、无 Metrics；测试器 vitest vs jest、Tailwind v4 vs v3 分裂 | 一致性 | 冻结"裸 SQL"决策；统一测试器/Tailwind；补缓存 | P1 |
| Repository | PASS | 结构清晰稳定，无循环依赖（app 间无 workspace 链接） | 依赖重复（无共享包）；无根 workspace | 膨胀 | 评估是否抽取 shared 包 | P2 |
| Database | PARTIAL | 强治理（forward-only/咨询锁/SHA-256/禁跨域物理 FK） | 命名风格分裂（chat/commerce 用 search_path+前缀）；状态枚举大小写不一（rewards 大写）；软删除仅 2/12 schema；profile 镜像字段；审计字段未全域；迁移内嵌 seed；README 迁移顺序滞后 | 数据模型失控 | 一致性迁移 | P1 |
| API / Identity | PARTIAL | REST+Zod.strict+全局错误过滤器+认证守卫+RBAC catalog+双模分页+审计齐备 | **错误信封违反冻结契约（request_id 内层 + details 不序列化）**；幂等缺失；无全局限流；content 路由未挂载且 ad-hoc 错误 | 客户端全线失败 | STOP 裁决错误模型；补幂等/限流 | **P0** |
| Engineering | PARTIAL | 三端 TS strict 全开；ESLint 全端存在 | **无 Prettier/格式化器**；verify 路径不一致（admin 含 build、backend 不含）；jest vs vitest | 风格漂移 | 加 Prettier；统一 verify | P1/P2 |
| Documentation | PARTIAL | 强契约/事实链/下游规则（DOCUMENT_CONTRACT） | **2/103 Feature 页已核验**；.product-forge 孤儿工具与 Spec Kit 竞争；无根 AGENTS.md | 权威漂移 | 验证扫刷；清理工具；补根 AGENTS.md | P1 |
| Runtime / Ops | PARTIAL | 日志/密钥Fail-Fast/迁移流水线已文档化 | 无错误追踪(Sentry)/Metrics/Backup/Restore/Rollback/Release Runbook；健康检查弱（仅 DB readiness） | 上线风险 | 补可观测性与运维手册 | P2 |

---

## 4. Product Audit（F01）

**Status: PASS**

`docs/docs/developer/reference/product/` 4 个文件（status: baseline）覆盖全部 10 要素：
- 产品愿景/四大支柱（Learning/Social/Monetization/Operations）— `product-overview.md:11,30-49`
- 目标用户（老挝 vs 中文价值路径）— `:15-18`
- 核心场景 / MVP 范围 / Non-goals — `:54-73` 首期功能边界表
- Feature 优先级 / Feature Flag / V1 冻结 — `feature-rollout.md:8-27`
- 用户旅程 / 漏斗 KPI — `product-overview.md:54-61`、`business-plan.md:75-89`
- 商业化（双边飞轮 / Entitlement / Rewards）— `business-model.md`
- 术语表 — 跨 4 文件

**已透明处理的冲突（非缺陷）**：`product-overview.md:73` 记录 Chat 产品范围列"语音/翻译/语音转文字"但 Chat Domain 冻结仅 TEXT/IMAGE，已路由 `open-questions.md`，双方共存记录。

**问题（P2）**：根目录 `PRODUCT_RESEARCH_REPORT.md` / `MARKET_RESEARCH.md` / `USER_JOURNEY_RESEARCH.md` / `FEATURE_ARCHITECTURE_RESEARCH.md`（2026-09-02，"产品考古"）为下游分析，非 Source-of-Truth，且 `docs/` 内零引用 → 平行孤儿副本，当前与 `reference/product/` 无事实冲突但会漂移。

---

## 5. Domain Audit（F02）

**Status: PASS**

- 11 域（Identity / Content / Learning / Audio / Social / Chat / Commerce / Rewards / Trust / Operations / Platform），Community 并入 Social（`reference/domains/index.md:30-48`）。
- 依赖方向明确（`reference/architecture/domains/dependencies.md:27-59`）：`Identity→{Learning,Social,Chat,Commerce,Trust,Operations}`、`Content→{Learning,Audio}`、`Social→Chat`、`Trust→{Social,Chat}`、`Rewards→Commerce`、`Platform→Clients/Domains`。
- 禁止捷径（跨域 import/SQL/FK/复制 canonical fact）— `:17-25`。
- 单一事实归属为硬规则（constitution Principle XI；`trust.reports` 唯一举报源）。
- **未发现**：同事实多域维护、职责重叠、Feature 自定 Domain 边界、归属不明。

**覆盖缺口（P2）**：多数域在 index 中"已建立的产品功能"为 `—`（无 Feature 文档）。属路线图问题，非架构冲突。

---

## 6. Architecture Audit（F03）

**Status: PARTIAL**

**强项（最强架构资产）**：后端 `src/` 顶层统一技术基座 `bootstrap/ config/ logging/ database/ ids/ errors/ auth/ http/ events/ outbox/ jobs/ assets/`；模块边界有 CI 级机器化护栏（`scripts/check-architecture.mjs:26-32` 强制跨域只能 import `public/`、业务模块禁 `from 'pg'`、`http/` 禁 `.query(`、源码禁 `CREATE TABLE`；`src/modules/README.md` 同义）。Outbox Worker 真实存在（`src/worker.ts` + `build-worker.ts` 注册 `outbox-publisher` 轮询作业，租约+指数退避）。

**缺口（P1）**：
1. **业务能力适配器层全缺**：Translation / TTS / Audio Production / Media Processing / External Adapters 在 `src` 检索零命中；`.env.example` 无任何第三方 provider 配置。
2. **对象存储仅接口无实现**：`src/assets/object-storage.ts` 仅 4 行 `put()/delete()` 接口，无 S3/COS/OSS/MinIO 适配器；`assets` 表只落元数据 → audio(9 表)/content 音频链路无法落地。
3. **无缓存**：唯一"缓存"是进程内 `Map`（`login-rate-limiter.ts:33`，注释自陈单实例限制）。无 Redis。
4. **7/11 业务域零后端代码**：`src/modules/` 仅 `identity(50)/platform(36)/content(19)/operations(17)`；learning/social/chat/commerce/rewards/trust/audio 无目录。属分阶段推进（`src/modules/README.md:3`），非架构错误，但需在路线图显式承认。

---

## 7. Technology Audit（F04）

**Status: PARTIAL**

**已冻结（一致）**：Backend=Fastify 5 + `pg` + `pino` + `zod` v4 + `libphonenumber-js`；DB=PostgreSQL 18；Frontend admin=React 19 + Vite 8 + @tanstack/router+query + react-hook-form + Tailwind **v4** + Playwright；mobile=Expo 54 / RN 0.81 + React Navigation 7 + @tanstack/query + `axios` + Tailwind **v3** + nativewind；Runtime=Node 22（`>=22`）；PM=pnpm 10.20；TS ~5.9。

**待冻结/不一致（P1/P2）**：
- **无 ORM（裸 SQL）**：属明确技术决策但需正式冻结记录（"为何不引入 Drizzle/Prisma"），避免后续会话自行引入第二套。
- **无缓存/Redis、无 Metrics/Tracing**（与 F10 重叠）。
- **测试器分裂**：backend/admin=vitest，mobile=jest（P2 一致性）。
- **Tailwind v4(admin) vs v3(mobile)**（P2 一致性）。
- **无 Prettier/格式化器**（见 F08）。
- 无双 ORM / 双 PM / 混 JS-TS；状态管理统一 react-query+react-hook-form（mobile eslint 禁 zustand）。

---

## 8. Repository Audit（F05）

**Status: PASS**

- 无根 workspace，三个 app 独立，各自 `package.json`+`pnpm-lock.yaml`；`grep "workspace:"` 零命中 → 无共享内部依赖，app 间无法互相 import → **无循环依赖**。
- 命令清晰：backend `verify=typecheck&&lint&&test`、`build=manifest:check&&tsc -p tsconfig.build.json`、`test:integration`；admin `verify` 含 `build`、`e2e=playwright`；mobile `verify` 含 `audit`；database `migrate/validate/test`。
- 环境配置：每 app `.env`（backend/database 提交 `.env`+`.env.example`；admin/mobile 仅 `.env.example`），运行时 `--env-file-if-exists=.env`。

**问题（P2）**：依赖重复（react/zod/react-query 等在 admin/mobile 重复，pg 在 backend/database 重复）；无 `packages/` 共享层 → 膨胀与版本漂移风险。是否抽 `packages/` 待评估（非阻塞）。

---

## 9. Documentation Audit（F09，重点）

**Status: PARTIAL**

**强项（F09 核心已满足）**：`docs/docs/developer/DOCUMENT_CONTRACT.md` 显式定义事实链：
```
产品/Domain/架构事实 → reference/product、domains、architecture、ADR、governance
物理 DB 事实        → database/migrations/
执行证据           → 代码/测试/CI
机器规格           → .specify/ 与 specs/
全景页面           → 只做聚合/摘要/链接（不得成为架构/域隐式权威）
```
Feature 页**显式下游**（`DOCUMENT_CONTRACT.md:26,67`）；废弃文档政策（`:75` 禁平行 v2/final）；链接/状态规则（`:79`）；文档索引 `index.md`+生成 `feature-catalog.json`。**未恢复 Feature Lane 六栏模型**（符合禁令）。

**问题**：
1. **（P1）验证漂移**：103 个 Feature 页仅 2 个（登录、老挝字母）带 `last_verified_at`，其余 `not_evidenced`（`DOCUMENT_CONTRACT.md:49-53`）→ 页面存在/`active` 不应被当作实现/验收证据（全景已自陈）。
2. **（P1）工具蔓延冲突**：`.product-forge/config.yml`（17KB）定义**平行 Feature 生命周期**（20-phase、`features_dir: features` 写根 `features/`、`output_language: en`），而 AGENTS.md 声明 Spec Kit 为唯一 Feature Spec 工作流。`docs/` 内零引用 → **孤儿工具，与 canonical Spec Kit 竞争权威**，且路径/语言与中文 SoT 冲突。
3. **（P2）无根 `AGENTS.md`**：仅 `docs/AGENTS.md` 与 `apps/admin/AGENTS.md`；根 `.claude/` `.agents/` 无路由权威。
4. **（P2）根 research .md 孤儿**（见 F01）。

---

## 10. Database Audit（F06）

**Status: PARTIAL**

**强治理**：迁移 forward-only（咨询锁 + SHA-256 入 `public.v2_schema_migrations` + 改已应用文件即报错）；**跨域物理 FK 全禁**（`checks/illegal_cross_domain_fk.sql` 必返回 0 行，已核查 20 迁移全为同 schema REFERENCES）；跨域引用统一逻辑 UUID + "不建 FK" 注释；全库 `timestamptz`；JSONB 普遍加 `CHECK (jsonb_typeof=object)`；迁移纪律 intact（仅 `0600:103`/`0800:175` 同文件内 ALTER 追加 FK，无改历史）。

**问题（按严重度）**：
- **（P1）命名风格分裂**：`chat`/`commerce` 用 `SET LOCAL search_path` + 冗余 `chat_`/`commerce_` 前缀（`0800:4`/`0900:4`），与其余 9 域 `schema.table` 显式限定冲突。
- **（P1）状态枚举大小写不一**：`rewards` 用大写 `'DRAFT','ACTIVE'`，其余域小写 `'active','draft'`；全库**未使用任何 Postgres ENUM**（均为 `varchar CHECK`），建议统一为 ENUM 或统一小写。
- **（P2）软删除未全域**：`deleted_at` 仅 social + `infrastructure.assets`；其余 9 域仅靠 status 生命周期。
- **（P2）profile 镜像字段**：`identity.basic_profiles` 与 `social.social_profiles` 重复 `display_name/gender/birth_date/country`，归属边界模糊。
- **（P2）actor 审计字段未全域**：`created_by/updated_by` 仅 audio/trust/content/commerce 局部；中央 `operations.operator_audit_logs` 承担但业务表未全域落地。
- **（P2）迁移内嵌 seed**：`1270_platform_menus.sql` 在迁移内 INSERT+setval，与"迁移/seed 分离"略有出入。
- **（P2）README 迁移顺序滞后**：仅列到 1240，缺 1250/1260/1270。
- Social/Chat/Commerce 三域表齐全、约束严谨（如 `social_matches` active 唯一对、commerce 钱包账本余额校验），成熟度足够。

---

## 11. API / Identity Audit（F07）

**Status: PARTIAL（含 P0 冲突）**

**齐备**：REST（无 GraphQL），版本前缀 `/api/v1/`；全局异常过滤器（`src/errors/error-handler.ts` 5xx 不外泄 + `normalizePostgresError`）；Zod 手写 `parse()` 且 `.strict()` 拒未知字段；认证守卫 `requireAuthentication` preHandler（provider 不可用 503 fail-safe）；**真 RBAC catalog**（`modules/operations/public/permissions.ts` 28 个 `domain.resource.action` 冻结键）；双模分页（offset + 审计 cursor）；审计日志（`OperatorAuditAdapter` 跨域桥接）。

**缺口（P0/P1）**：
1. **（P0 Blocker）错误信封违反冻结契约**：`api-standard.md:211` 规定 `request_id` 在**顶层**（不在 `error` 内层），且 `error.details` 应序列化字段级校验错误；但 `src/errors/error-handler.ts:18` 把 `request_id` 放进 `error` 内层，且 `AppError.details`（`app-error.ts:14`，路由已填充 `r.error.issues`）**从未被序列化输出** → 客户端拿不到字段级错误。代码 vs 冻结文档冲突，需 STOP 裁决（改代码 or 改文档）。
2. **（P1）幂等缺失**：全 `src` 检索 `Idempotency|idempotency_key` 零命中，而 `api-standard.md` 第 5 节规定关键写操作（支付/打赏/工单）必需 `Idempotency-Key`。commerce(16)+rewards(5) 表已冻结且依赖它防重放 → 必须在 commerce/rewards 落地前补齐。
3. **（P1）全局限流缺失**：仅登录/OTP 局部 429；限流器为进程内 `Map`，多副本即失效（代码自陈）。
4. **（P1）content 路由旁路**：`src/modules/content/http/*.ts` 未在 `main.ts` 注册，且用 ad-hoc 扁平错误结构（无 `request_id`、error 为字符串）→ 契约漂移入口 + 死代码。
5. **（P2）无 OpenAPI/Swagger 产物**：Fastify schema 未用于文档生成，契约靠 markdown 人工维护，漂移成本高。

---

## 12. Engineering Audit（F08）

**Status: PARTIAL**

- **TS strict 三端全开**：backend `strict+noUncheckedIndexedAccess+exactOptionalPropertyTypes`；admin `strict+noUnusedLocals+noUnusedParameters`；mobile `strict+noUncheckedIndexedAccess`。
- **ESLint 三端存在且强制** `no-explicit-any`/`no-unused-vars`（backend/admin 用 tseslint recommended；mobile 用 eslint-config-expo + `no-restricted-imports` 架构护栏）。
- **（P1/P2）无 Prettier/格式化器**：全 app `devDependencies` 与配置均无 prettier → 格式化无统一执行路径。
- **（P2）verify 路径不一致**：admin `verify` 含 `build`，backend `verify` 不含；mobile 加 `audit`；测试器 vitest vs jest。
- 统一 lint/typecheck/test/build 执行路径**存在但不完全一致**。

---

## 13. Runtime / Operations Audit（F10）

**Status: PARTIAL（多为 P2 上线项）**

- ✅ 日志：Pino 结构化 + Request ID + 敏感字段脱敏 + 事务回滚/Worker 生命周期日志（`infrastructure/index.md:204-209`、`security.md:182`）。
- ✅ 密钥：Secret Fail-Fast（≥32 字符），每 app `.env`。
- ✅ 迁移流水线：真实且唯一权威（`database/`；`pnpm migrate/validate`；backend 不自动跑迁移；CI `manifest:check`）。
- ❌ 错误追踪：无 Sentry/同类。
- ❌ Metrics/Tracing：文档明示"属生产就绪阶段后续系统级设计，不在当前假设"（`infrastructure/index.md:212`）。
- ❌ Backup/Restore：未文档化。
- ❌ Rollback：仅事务回滚日志，无迁移回滚流程。
- ❌ Release Runbook：未文档化（CI 是唯一门禁）。
- ⚠️ 健康检查：仅 DB readiness 校验，无 `/health` HTTP 端点文档。
- **CI 门禁**：阻塞 = backend/admin/docs；非阻塞 = mobile（`continue-on-error: true`，注释明确未达 gate）。

---

## 14. Foundation Blockers（P0 阻塞项）

仅列符合严格 P0 定义（架构漂移 / 数据模型失控 / 域归属不明 / 多 Feature 冲突实现 / AI 无法确定权威来源 / 必然大规模返工 / 核心工程无法稳定 build/test）的项。

### Blocker B1 — API 错误信封违反冻结契约（代码 vs 文档权威冲突）
- **问题**：`src/errors/error-handler.ts:18` 将 `request_id` 置于 `error` 内层；`AppError.details` 从未序列化。直接违反 `reference/contracts/.../api-standard.md:211`（request_id 顶层、error.details 序列化）。
- **影响**：Admin/Mobile 若按冻结文档实现，将全线取值失败；且 `error.details` 缺失使字段级校验错误不可达客户端。
- **根因**：后端实现先于/偏离冻结契约，且缺契约一致性 CI 校验。
- **整改方案**：STOP 裁决——（a）以冻结文档为权威 → 改 `error-handler.ts` 把 `request_id` 提到顶层并序列化 `details`；或（b）若文档有误 → 改 `api-standard.md` 并走 ADR。二选一后加契约测试。
- **涉及文件**：`src/errors/error-handler.ts`、`src/errors/app-error.ts`、`modules/content/http/*.ts`、`reference/contracts/**/api-standard.md`。
- **依赖关系**：阻塞 B1 → WP-05（API 加固）、所有客户端端点扩展；需用户/设计权威裁决。
- **验收标准**：错误响应含顶层 `request_id` 且 `error.details` 含 zod issues；新增契约测试；admin/mobile 端到端打通。

### Blocker B2 — Foundation CI 引用不存在的 `database/v2`（核心工程无法稳定 validate）
- **问题**：`.github/workflows/foundation.yml:26/31/32` 执行 `pnpm --dir database/v2 install/test/validate`，但仓库仅 `database/`（package name=zh-lao-v2-database，"v2" 是包名非目录）→ `ls database/v2` 不存在。
- **影响**：backend CI 门的 DB 迁移/校验步骤失败 → Foundation Gate 无法判绿；DB 基线无法被 CI 证明。
- **根因**：重构目录时 CI 路径未同步（目录从 `database/v2` 扁平为 `database/`）。
- **整改方案**：将 `foundation.yml` 三处 `database/v2` 改为 `database/`；本地 `pnpm --dir database migrate/validate` 验证通过。
- **涉及文件**：`.github/workflows/foundation.yml`。
- **依赖关系**：无上游；应最先执行（1 行修复，解锁 Gate 验证）。
- **验收标准**：CI backend 门 `database` 步骤通过；`pnpm --dir database validate` 绿。

---

## 15. Conflict / Technical Debt Register（冲突与技术债台账）

| ID | 类型 | 描述 | 位置 | 严重度 | 处置 |
|---|---|---|---|---|---|
| C1 | 契约冲突 | 错误信封 request_id 位置 + details 未序列化 | error-handler.ts:18 / api-standard.md:211 | P0 | STOP 裁决（B1） |
| C2 | CI 缺陷 | `database/v2` 路径不存在 | foundation.yml:26/31/32 | P0 | WP-01 改路径 |
| C3 | 工具冲突 | .product-forge 平行 Feature 生命周期 vs Spec Kit | .product-forge/config.yml | P1 | WP-06 清理/降级 |
| C4 | 权威漂移 | 根 research .md 平行非权威 | PRODUCT_RESEARCH_REPORT.md 等 | P2 | WP-06 归档 |
| C5 | 数据模型 | chat/commerce 命名前缀风格 | 0800:4 / 0900:4 | P1 | WP-03 迁移 |
| C6 | 数据模型 | 状态枚举大小写不一（rewards 大写） | rewards L8 | P1 | WP-03 迁移/ENUM |
| C7 | 数据模型 | 软删除未全域 | social+infra 仅 | P2 | WP-03 增量 |
| C8 | 数据模型 | profile 镜像字段 | basic_profiles↔social_profiles | P2 | WP-03 归属裁决 |
| C9 | 架构缺口 | 能力适配器层全缺（TTS/翻译/音频/媒体/缓存/对象存储） | src/assets/object-storage.ts 仅接口 | P1 | WP-04 |
| C10 | API 缺口 | 幂等缺失 | src 零 Idempotency | P1 | WP-05 |
| C11 | API 缺口 | 全局限流缺失（进程内 Map） | login-rate-limiter.ts:33 | P1 | WP-05 |
| C12 | 文档漂移 | Feature 页 2/103 已验证 | DOCUMENT_CONTRACT.md:49-53 | P1 | WP-06 扫刷 |
| C13 | 工程缺口 | 无 Prettier | 三端 | P2 | WP-07 |
| C14 | 工程不一致 | verify 路径/测试器/Tailwind 分裂 | 三端 | P2 | WP-07 |
| C15 | 运维缺口 | 无 Sentry/Metrics/Backup/Rollback/Release | infra docs | P2 | WP-08 |
| C16 | 交付现实 | 7/11 业务域零后端代码 | src/modules/ | P1 | 路线图显式（post-gate） |

---

## 16. P0 / P1 / P2 Remediation Plan（整改计划）

**P0（阻塞正式开发，必须先行）**
- P0-1：修复 Foundation CI `database/v2` → `database/`（B2 / WP-01）
- P0-2：STOP 裁决并修复 API 错误信封契约（B1 / WP-02）

**P1（核心业务开发前完成）**
- P1-1：建立平台能力适配器层（Object Storage 实现 + TTS/翻译/音频/媒体外部适配器 + 缓存）（C9 / WP-04）
- P1-2：DB 一致性迁移（命名前缀、状态枚举、软删除/审计字段标准化、profile 归属）（C5–C8 / WP-03）
- P1-3：补幂等层 + 全局限流（C10/C11 / WP-05）
- P1-4：content 路由挂载 + 统一错误结构（C1 衍生 / WP-02+WP-05）
- P1-5：文档验证扫刷（2/103 → 目标覆盖）（C12 / WP-06）
- P1-6：清理 .product-forge 工具蔓延（C3 / WP-06）
- P1-7：显式承认 7/11 域分阶段交付路线图（C16）
- P1-8：冻结"裸 SQL 无 ORM"技术决策并文档化（F04）
- P1-9：统一三端测试器/Tailwind 决策（F04/F08，可 P2）

**P2（上线前完成）**
- P2-1：加 Prettier 格式化器（C13 / WP-07）
- P2-2：统一 verify 脚本（C14 / WP-07）
- P2-3：根 AGENTS.md + 根 research md 归档（C4 / WP-06）
- P2-4：错误追踪 Sentry（C15 / WP-08）
- P2-5：Metrics/Tracing（C15 / WP-08）
- P2-6：Backup/Restore 文档与脚本（C15 / WP-08）
- P2-7：Migration Rollback 流程（C15 / WP-08）
- P2-8：Release Runbook（C15 / WP-08）
- P2-9：/health HTTP 端点（C15 / WP-08）
- P2-10：迁移内嵌 seed 清理 + README 迁移顺序更新（C 衍生 / WP-03）

---

## 17. Work Package Breakdown（整改工作包拆分）

> 每个 WP 可独立分发给一个 AI 会话。Phase 边界：WP-01/02 解锁 Gate；WP-03/04/05/06/07/08 为整改主体；Feature Dev 在 Gate PASS 后。

### WP-01 — 修复 Foundation CI 数据库路径（P0）
- **目标**：使 backend CI 门的 DB 步骤可运行。
- **范围**：`.github/workflows/foundation.yml` 中 `database/v2` → `database/`（3 处）。
- **允许修改**：`.github/workflows/foundation.yml`。
- **禁止修改**：其余文件。
- **依赖**：无。
- **具体任务**：替换路径；本地 `pnpm --dir database validate` 验证；push 触发 CI 确认 backend 门绿。
- **验收**：CI backend 门 DB 步骤通过。
- **顺序**：最先。
- **并行**：无（应单独先落地）。

### WP-02 — 裁决并修复 API 错误信封契约（P0）
- **目标**：消除代码 vs 冻结文档的权威冲突。
- **范围**：STOP 裁决（代码服从文档 or 文档走 ADR 修订）；改 `src/errors/error-handler.ts`/`app-error.ts` 或 `api-standard.md`；统一 `modules/content/http/*.ts` 错误结构；加契约测试。
- **允许修改**：`src/errors/*`、`modules/content/http/*.ts`、`reference/contracts/**/api-standard.md`（若改文档需 ADR）、新增契约测试。
- **禁止修改**：其他业务域、数据库。
- **依赖**：需用户/设计权威对 B1 的裁决（code-vs-doc）。
- **具体任务**：①提交 STOP 裁决请求；②按裁决对齐代码/文档；③序列化 `error.details`；④content 路由注册并统一错误；⑤加响应契约测试。
- **验收**：错误响应含顶层 `request_id` + `error.details`；admin/mobile 端到端验证。
- **顺序**：P0-2，紧接 WP-01。
- **并行**：裁决期间可与 WP-03/04/06 并行（不互相改文件）。

### WP-03 — 数据库一致性迁移（P1）
- **目标**：消除冻结基线内的命名/枚举/软删除/审计不一致。
- **范围**：新增正向迁移——chat/commerce 去冗余前缀（或文档化例外）、状态枚举统一（建议 ENUM 或小写）、软删除策略、审计字段覆盖、profile 镜像归属裁决；清理 `1270` 内嵌 seed；更新 README 迁移顺序。
- **允许修改**：`database/migrations/`（新增文件）、`database/README.md`、`reference/domains/**`。
- **禁止修改**：后端业务代码（域实现尚未存在，安全）、其他 schema。
- **依赖**：WP-01（CI 可校验）；需在 commerce/rewards 域代码落地前完成。
- **具体任务**：①列每项不一致的正式决策；②写正向迁移；③跑 `validate`+`audit`；④更新文档。
- **验收**：`checks/illegal_cross_domain_fk.sql` 仍 0 行；`database validate` 绿；文档与 schema 一致。
- **顺序**：P1。
- **并行**：可与 WP-04/05/06/07/08 并行（仅动 DB 与文档）。

### WP-04 — 平台能力适配器层（P1）
- **目标**：补齐 Translation/TTS/Audio/Media/Cache/ObjectStorage 统一能力。
- **范围**：`src/assets/object-storage.ts` 实现（S3/COS/OSS/MinIO 适配器）；新增 `src/capabilities/{tts,translation,media,cache}/` 端口+适配器；缓存（Redis 或明确 deferred 路径）；外部 provider 配置约定（`.env` schema）。
- **允许修改**：`apps/backend/src/capabilities/**`、`src/assets/**`、`src/config/schema.ts`、后端 README。
- **禁止修改**：数据库、前端、其他域业务。
- **依赖**：WP-02（错误模型对齐，便于适配器报错一致）。
- **具体任务**：①定能力端口接口；②实现对象存储适配器；③实现 TTS/翻译/媒体最少一个端到端样例；④缓存决策；⑤provider 配置 schema。
- **验收**：对象存储可落真实文件；至少 TTS 链路端到端测试；架构护栏 `check-architecture.mjs` 通过。
- **顺序**：P1（架构使能，应在 audio/content 媒体 Feature 前）。
- **并行**：与 WP-03/05/06/07/08 并行。

### WP-05 — API 加固（幂等 + 全局限流）（P1）
- **目标**：补齐关键写操作幂等与全局限流。
- **范围**：`Idempotency-Key` 中间件（存储于 `infrastructure` 或 Redis）；全局 rate-limit 插件（替代进程内 Map）；content 路由注册。
- **允许修改**：`apps/backend/src/http/**`、`src/modules/content/**`、新增中间件、后端 `.env` schema。
- **禁止修改**：数据库 schema（除非幂等需新表，则联动 WP-03）、前端。
- **依赖**：WP-02（错误模型）；WP-04（若限流用 Redis 缓存）。
- **具体任务**：①幂等中间件+存储；②全局限流插件；③注册 content 路由并统一错误；④测试。
- **验收**：支付/打赏/工单端点带 `Idempotency-Key` 防重放；限流跨实例生效；架构护栏通过。
- **顺序**：P1，位于 WP-02 后。
- **并行**：与 WP-03/04/06/07/08 并行（文件不重叠）。

### WP-06 — 文档权威收口（P1）
- **目标**：消除验证漂移与工具蔓延。
- **范围**：Feature 页验证扫刷（`last_verified_at` 覆盖目标）；处置/删除 `.product-forge/`；归档根 research .md 或链接进 SoT；补根 `AGENTS.md`。
- **允许修改**：`docs/**`、`scripts/`（检查工具）、根 `AGENTS.md`（新建）、根 research .md（移动/归档）、`.product-forge/`（删除或降级说明）。
- **禁止修改**：数据库、后端/前端代码、reference 事实源内容（仅可补链接）。
- **依赖**：无（纯文档）。
- **具体任务**：①扩展 `audit_feature_detail_pages.py` 支持批量验证；②对现有 Feature 页跑代码/测试证据核验；③删除 `.product-forge` 或写降级说明（明确 Spec Kit 唯一）；④根 research md 移入 `docs/reference/product/evidence/` 或归档；⑤写根 `AGENTS.md` 指向 `docs/AGENTS.md`。
- **验收**：已知 Feature 页带 `last_verified_at`；`.product-forge` 不再与 Spec Kit 竞争；根 `AGENTS.md` 存在。
- **顺序**：P1，可与一切并行。
- **并行**：完全独立。

### WP-07 — 工程一致性（P2）
- **目标**：补格式化器、统一 verify。
- **范围**：三端加 Prettier + 配置；统一 `verify` 脚本（是否含 build）；测试器/Tailwind 决策（vitest 统一 or 文档化分裂）。
- **允许修改**：三端 `package.json`、`eslint.config.js`、新增 `.prettierrc*`、`tsconfig*`。
- **禁止修改**：业务代码逻辑。
- **依赖**：无。
- **具体任务**：①加 prettier+lint 整合；②统一 verify；③Tailwind/测试器决策文档化。
- **验收**：三端 `pnpm verify` 一致通过；格式化无争议。
- **顺序**：P2。
- **并行**：与 WP-03/04/05/06/08 并行。

### WP-08 — 运行时/运维补齐（P2）
- **目标**：补可观测性与运维手册。
- **范围**：错误追踪（Sentry）、Metrics/Tracing、Backup/Restore、Migration Rollback、Release Runbook、`/health` 端点；更新 `infrastructure/index.md`。
- **允许修改**：`apps/backend/src/**`（health/metrics）、`docs/docs/developer/reference/architecture/infrastructure/**`、运维脚本。
- **禁止修改**：业务域逻辑、数据库 schema（除必要运维表）。
- **依赖**：无（多数为新增/文档）。
- **具体任务**：①`/health` 端点；②Sentry 接入；③Metrics 基线；④Backup/Restore+Rollback 文档与脚本；⑤Release Runbook。
- **验收**：健康检查/错误追踪/指标可用；运维手册评审通过。
- **顺序**：P2（上线前）。
- **并行**：与 WP-03/04/05/06/07 并行。

---

## 18. Parallelization Plan（并行化计划）

**必须串行**
- WP-01 →（解锁 Gate 验证）→ WP-02 裁决需在 Feature 端点扩展前完成。
- WP-03（DB 一致性）必须在 commerce/rewards 业务域代码落地前完成（避免返工）。
- WP-02 → WP-05（API 加固依赖错误模型）。

**可以并行**
- WP-03、WP-04、WP-05、WP-06、WP-07、WP-08 彼此文件不重叠，可并行分发。
- WP-06（纯文档）完全独立，建议立即并行启动。
- WP-04（能力层）与 WP-05（API 加固）仅通过错误模型（WP-02）间接相关，可并行。

**必须等待上游**
- 所有"Feature Development"等待 Gate PASS（WP-01+WP-02 完成，且 P1 主体落地）。
- commerce/rewards 域实现等待 WP-03（DB 一致）+ WP-05（幂等）。

**建议并发度**：WP-01 单独（快）→ 随后 WP-02 裁决 + WP-03/04/06/07/08 并行（6 路）；WP-05 在 WP-02 裁决后并入。

---

## 19. Foundation Gate（准入标准）

| Foundation | Gate 要求 | 当前 | 判定 |
|---|---|---|---|
| Product | PASS | PASS | ✅ |
| Domain | PASS | PASS | ✅ |
| Architecture | PASS | PARTIAL | ❌ P1 |
| Technology | PASS | PARTIAL | ❌ P1 |
| Repository | PASS | PASS | ✅ |
| Database | PASS | PARTIAL | ❌ P1 |
| API / Identity | PASS | PARTIAL（含 P0） | ❌ P0 |
| Engineering | PASS | PARTIAL | ❌ P1 |
| Documentation | PASS | PARTIAL | ❌ P1 |
| Runtime / Ops | P2 项允许未完成 | PARTIAL | ⚠️ P2 允许 |

**FOUNDATION NOT READY**

理由：存在 **2 个 P0 Blocker**（B1 API 错误信封契约冲突、B2 CI `database/v2` 路径缺陷），且 Architecture/Technology/Database/API/Engineering/Documentation 均 PARTIAL（P1 未完）。Runtime/Ops 的 P2 项按规则允许未完成。

---

## 20. Recommended Next Step（推荐下一步）

**当前结果**：FOUNDATION NOT READY（P0×2，P1×9，P2×10）。

**建议立即执行序列（等待指令，不自行开工）**：
1. **WP-01（立即可做，1 行修复）**：将 `foundation.yml` 的 `database/v2` → `database/`，解锁 CI Gate 验证。无设计决策，建议直接执行。
2. **WP-02 STOP 裁决（需你/设计权威拍板）**：API 错误信封冲突——以冻结文档为权威改代码，还是修订文档走 ADR？请确认方向，我再落地 WP-02 + 联动 WP-05 的 content 路由统一。
3. **并行启动（Gate 解锁后）**：WP-06（文档验证+工具清理，纯文档、零风险）与 WP-03（DB 一致性迁移）可立即并行分发，不互相阻塞。

**最大 5 个基础风险回顾**：
1. API 错误信封违反冻结契约（B1，P0）——客户端按文档实现全线失败。
2. Foundation CI `database/v2` 路径缺陷（B2，P0）——Gate 无法判绿。
3. 平台能力适配器层全缺（TTS/翻译/音频/媒体/缓存/对象存储）（C9，P1）——audio(9 表)/content 媒体链路无法落地。
4. 幂等层缺失（C10，P1）——commerce/rewards 金钱端点重放风险。
5. 文档验证漂移 2/103 + .product-forge 工具蔓延（C12/C3，P1）——权威源漂移风险。

**请指示**：是否授权执行 WP-01？以及对 B1 的裁决方向（代码服从文档 / 修订文档）？确认后我按 §17/§18 分发后续 Work Package。
