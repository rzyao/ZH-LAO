# 课程编排与发布：当前实现盘点

> Feature: `curriculum-authoring-publishing` · Codebase: repository root · 2026-09-05

## 当前可复用实现

| 层 | 已有模式 | 可复用范围 |
|---|---|---|
| Backend Content | `structured-content` application/domain/infrastructure/http 分层 | 结构化内容的 draft、derive working revision、update、submit、review、re-edit、publish 流程与 Zod/HTTP 边界。 |
| Backend revision | `derive-working-revision.ts`、`manage-structured-content.ts` 与 Postgres repository | 不可变工作版本、锁版本、审核状态机、发布原子性模式；必须扩展而非把字母模型直接冒充课程模型。 |
| Backend HTTP | `structured-admin-routes.ts`、`public-routes.ts`、统一响应 error handler | authenticated route、精确授权、业务码信封、public safe projection。 |
| Operations | `operations/public` contracts/permissions 与 audit 调用 | Operator identity、exact permission、操作审计；Content 不直接拥有该事实。 |
| Admin | `features/content/structured`、TanStack Query、通用 DataTable | 内容列表、筛选、版本状态展示、审核/发布确认与 stale-error 处理；课程 UI 必须复用既有设计系统和表格能力。 |
| Mobile | `features/alphabet`、HTTP client、React Query 基础设施 | published-only REST client、loading/error/empty state、导航与展示组件。 |

## 已实现、未实现与证据

| 能力 | 真实状态 | 证据 |
|---|---|---|
| Content Revision 审核/发布（语言知识） | 已实现，有测试 | `apps/backend/src/modules/content/application/use-cases/manage-structured-content.ts`、`structured-admin-routes.ts`、`apps/backend/test/integration/content-http.test.ts`。 |
| 老挝字母管理、审核、发布与后台列表 | 已实现（现有未关闭 Feature 还在改变其相关文件） | `apps/admin/src/features/content/structured/`、`lo-letter-*` 文件、`1340_content_letter_batch_tasks.sql`。 |
| Course/Unit/Lesson 的 application port、repository、use case、HTTP route | 未找到 | Content module 文件列表与 `rg course|curriculum` 未出现课程业务实现。 |
| 课程管理端列表、详情、编排编辑器 | 未找到 | Admin Content feature 仅为 structured language content / lo-letter UI。 |
| 课程移动端 catalog/structure/lesson content | 未找到 | Mobile 仅发现 alphabet feature 调用 `/api/v1/content/letters`。 |
| Runtime Course API | 文档冻结、代码未落地 | `CONTENT_API.md` 定义 `/content/courses` 等；backend routes 没有相应实现。 |

## 集成点与风险

| Integration | 建议范围 | 风险 |
|---|---|---|
| `apps/backend/src/modules/content` | 新增课程 aggregate 的 domain/application/infrastructure/http，复用模块边界 | 不能把课程编排混入语言知识实体实现或跨域直连。 |
| `apps/backend/src/modules/operations/public` | 使用现有精确权限和 audit contract | 不能新增固定角色；审核、发布权限必须独立。 |
| `apps/admin/src/features/content` | 新增课程页面/编排 UI，复用 DataTable 和既有 query/error pattern | 与 `admin-data-table-enhancement`、`chinese-lao-content-hierarchy` 修改同一区域存在合并风险。 |
| `apps/mobile/src/features` | 新增只读课程 feature | 不得引入进度、答题、推荐或付费。 |
| `database/migrations` | 仅在 authority decision 已接受后新增前向 migration | 冻结 `0400`/`1240`/`1290` 不可变更；课程 published pointer 缺口是高风险。 |

## 生命周期解耦

课程的工作版本修改不会创建词条新版本；课程 revision snapshot 固定的是编排与受控引用。词条的新 revision 发布也不会自动改变 Course/Unit/Lesson 的位置、结构或已固定的学习历史。学习历史保存 revision UUID 时，后续课程/词条发布只能创建新的 current published view，不能回写旧 UUID 所代表的快照。

## 结论

实现复杂度为高：涉及四个 workspace、冻结数据库与 API/状态机约束。可复用的 Revision、权限、审计、表格和公开读取模式足够明确；课程聚合、引用 revision 固定模型和学习端读取尚需在 Owner 决策后从零实现。
