# 课程编排与发布：权威与实施缺口调研

> Feature: `curriculum-authoring-publishing` · Phase: Research · 2026-09-05
> 方法：仅盘点仓库中的 Product、Domain、ADR、冻结迁移、冻结契约与当前代码；不以代码反推权威。

## 结论摘要

课程的领域模型、冻结表结构、HTTP 契约与修订状态机已存在；当前应用实现则集中在结构化语言知识与老挝字母，未实现课程的管理端、后端或移动端最小闭环。课程编排必须保存对 Content 已发布实体/修订的引用，不得复制知识本体；课程编排变更和知识词条的新版本发布彼此独立。可开始 Product Spec 的前提是先由 authority owner 裁决课程“当前已发布 revision”的物理表示和读取语义。

## 权威约束（按优先级）

| 层级 | 来源 | 对本 Feature 的约束 |
|---|---|---|
| Product | `reference/product/product-overview.md` | Learning 支柱包括课程；Operations 是多人协作后台，不是简单 CRUD。 |
| Domain | `domains/content/curriculum.md` | 固定层级为 Course → Unit → Lesson → LessonSection → LessonItem；课程结构只维护引用与排序，不复制词条。 |
| Domain | `domains/content/versioning-review.md` | Draft → Pending Review → Approved → Published → Superseded；发布版本不可原地修改；所有关键流转有锁、幂等、审计与原子发布要求。 |
| ADR | ADR-007、ADR-021、ADR-018、ADR-019、ADR-023 | Course/Unit/Lesson 编排归 Content；Learning 仅消费；跨域只用 UUID；Operations 只拥有权限和审计；响应遵循统一业务码信封。 |
| Database | `0400_content.sql`、`1240_content_revision.sql`、`1290_content_revision_review_workflow.sql` | 已冻结，禁止修改；任何补齐只能新建前向 migration。 |
| API | `CONTENT_API.md`、`CONTENT_PUBLIC_CONTRACTS.md` | Runtime 仅 current published/active；Admin 用 aggregate structure replacement + 并发 token；DTO 不得泄露 BIGINT；权限为 `content.curriculum.read/write/publish`。 |

## 所有权与引用语义

| 事实 | 正式 owner | 本 Feature 的处理 |
|---|---|---|
| Course / Unit / Lesson / Section / Item 的层级与排序 | Content | 在 Content 边界内维护。Unit、LessonItem 没有 public identity。 |
| 知识实体与语言事实 | Content | LessonItem 只引用现有 Content logical UUID，绝不复制文本、释义或语言知识。 |
| Content Revision 与审核发布 | Content | 课程与 Lesson 使用同一不可变 revision 生命周期；引用发布修订用于稳定快照。 |
| RBAC 与后台操作审计 | Operations | 后端逐动作权限校验；Operations 记录谁在何时做了什么。 |
| 学习进度与历史 | Learning | 不在本 Feature 实现；历史固定 revision UUID 后不得随再发布变化。 |

课程挂载采用“固定已发布修订”而不是在学习读取时无条件追随当前内容：`CONTENT_PUBLIC_CONTRACTS.md` 要求历史读取通过 revision UUID 解析不可变快照，且课程文档要求课程编排与词条版本生命周期解耦。课程作者选择/校验的对象必须是合法 published Content/Revision；词条后续发布不得自动改动课程编排或已固定的历史快照。

## 数据库真实存在的内容

冻结 `0400_content.sql` 已建：

- `content.courses`：BIGINT 内部主键、`public_id UUID`、学习语言、标题、状态（draft/published/archived）、排序和时间戳。
- `content.units`：仅域内 BIGINT 与 `course_id`，按课程唯一排序；没有 public UUID。
- `content.lessons`：`public_id UUID`、Unit 归属、排序、状态与 `published_at`。
- `content.lesson_sections`：`public_id UUID`、Lesson 归属与排序。
- `content.lesson_items`：仅域内 BIGINT，引用 `contents.id` / `exercises.id` 或媒体；不含 revision UUID。
- `content.content_revisions`：`entity_type` 已允许 `course`、`lesson`；`entity_id` 是 UUID；`1290` 已前向补齐 pending-review、approved、rejected、`lock_version` 和单活动工作版本索引。

这说明表与版本基础设施不是“纯文档占位”；但课程实体尚没有与修订的应用层读写或明确的 published pointer 落表。

## 必须停止裁决的缺口

**ADP-001 — Course/Lesson 的当前正式版本锚点与发布读取方式（OPEN HIGH）。**

- 上游依据：`versioning-review.md` §3.1 要求主实体维护 `published_revision_id` / `working_revision_id` 并在一个事务中切换；`CONTENT_PUBLIC_CONTRACTS.md` 又要求 public current 与 revision history 可解析。
- 冻结事实：`0400_content.sql` 的 `courses` / `lessons` 仅有 `status`（Lesson 另有 `published_at`），没有 revision pointer；`lesson_items` 也没有 revision UUID。
- 影响：无法仅凭现有表证明“当前 published revision”如何与实体结构及学习端稳定读取一一绑定，更无法证明发布切换的事务边界。
- 需要 Owner 决策：前向 migration 是否为 Course/Lesson 增加当前/工作 revision pointer；课程 revision snapshot 是否完整封装 Unit/Section/Item 及其引用 revision UUID；以及 runtime “current published”到底读取指针还是唯一 published revision。
- 禁止动作：不得从现有 `status` 字段或代码行为自行选择一种模型，不得改写冻结 migration 或 Public API。

**ADP-002 — LessonItem 对知识/练习的 published revision 固定字段（OPEN MEDIUM）。**

`curriculum.md` 要求引用已上线内容，`CONTENT_PUBLIC_CONTRACTS.md` 要求历史按 revision UUID 读取；现有 `lesson_items` 仅有内部 FK。需要确认 revision 固定在 aggregate snapshot 中是否足够，还是应新增显式 UUID 引用列；这直接影响新 migration 与 API payload，须在 ADP-001 的 owner 决策中一并裁决。

## 推荐的 MVP 边界

在 ADP-001/002 被接受后，第一版应仅包括：Course 列表/详情/创建/编辑、Unit → Lesson → Section → Item aggregate 编排和排序、引用已发布 Content/Revision 的服务端校验、课程/课节 revision 的提交审核/审核/驳回/发布与版本历史、事务发布、审计/RBAC/并发保护，以及移动端只读 course catalog/structure/lesson content。

明确延期：学习进度、答题和练习运行态、推荐/搜索、付费/权益、社交、字典建设、音频生产、语言知识层级重建、通用表格重构，以及其他未关闭 Feature 的修复。
