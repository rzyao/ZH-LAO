---
status: ready
phase: 5A
phase_name: Content Admin Integration
artifact: execution_brief
entry_gate: CONTENT_GATE = PASS
last_updated: 2026-08-31
---

# ZH-LAO V2 — Content Admin Execution Brief

> 本文件是 Content Admin 集成执行会话入口。执行 AI 必须先使用 GitHub 连接器读取远程 `main` 的真实 Gate、API、权限与 Admin 代码，再开始工作。
>
> Content 后端产品语义、Use Cases、Public/API Contract 一旦已 `CONTENT_GATE = PASS`，Admin 只能消费冻结契约，不得重新设计 Content Backend。

## 1. Mission

```text
Repository Audit
→ Verify Content/Operations/Admin Gates
→ Read Frozen Content API
→ Content Admin IA
→ API / Query / Mutation Layer
→ Knowledge
→ Dictionary Management
→ Curriculum
→ Practice Definitions
→ Operations RBAC/Audit Integration
→ Tests / E2E / Audit
→ CONTENT_ADMIN_GATE
→ STOP
```

本任务不实现 Learning，不重做 Content Backend，不开始 Audio Production。

## 2. Mandatory GitHub Entry Audit

连接：

```text
repository = rzyao/ZH-LAO
branch = main
```

至少读取：

```text
latest HEAD
DEVELOPMENT_PROGRESS.md
ADMIN_FOUNDATION_REPORT.md
05-content/CONTENT_IMPLEMENTATION_REPORT.md if present
05-content/CONTENT_API.md
05-content/CONTENT_USE_CASES.md
05-content/CONTENT_PRODUCT_SEMANTICS.md
05-content/CONTENT_PUBLIC_CONTRACTS.md
05-content/CONTENT_DESIGN_AUDIT.md
04-operations current final report / RBAC contracts
apps/admin current source
apps/backend current admin/content routes
current CI workflows
```

必须确认：

```text
ADMIN_FOUNDATION_GATE = PASS
CONTENT_GATE = PASS
CONTENT_DOMAIN = FROZEN
OPERATIONS_GATE = PASS
```

如果任一正式 Gate 未通过：不得伪造最终集成，记录依赖并 STOP。

## 3. Frontend Authority

复用现有 Admin Foundation：

```text
React + TypeScript + Vite
TanStack Router / Query / Table
React Hook Form + Zod
Tailwind + shadcn/ui / Base UI
single ApiClient
AuthGuard / PermissionGuard / can()
DataTable / Form / Feedback / AppShell
```

不得新建第二套 router、QueryClient、API client、权限框架、表单框架或 design system。

组件禁止直接 `fetch()`。

## 4. Frozen Content Management Contract

严格读取当前 `CONTENT_API.md` 的 `/api/v1/admin/content/*` 管理契约。

不要按 31 张表生成 CRUD。

Admin 应围绕 capability：

```text
Knowledge authoring
Meanings / translations / examples / pronunciation metadata
Dictionary relationships / tags
Curriculum authoring / ordering / lifecycle
Practice definition authoring / lifecycle
Revision / publish semantics
```

如果 UI 需要后端未冻结能力：记录 `BACKEND_CONTRACT_GAP`，不要猜 endpoint。

## 5. Permission Integration

执行时从 Content/Operations 当前文档读取 exact keys。

设计阶段候选能力包括：

```text
content.knowledge.read
content.knowledge.write
content.curriculum.read
content.curriculum.write
content.curriculum.publish
content.practice.read
content.practice.write
content.practice.publish
```

以当前 frozen catalog 为准。

规则：

```text
no read => page unavailable
read only => all mutation UI disabled/hidden
write => authoring actions visible
publish => lifecycle publish actions visible
```

Frontend guard 只改善 UX；Backend Operations authorization 才是安全边界。

## 6. Content Admin Information Architecture

复用现有 `Content` Domain 导航入口。

建议页面按产品能力组织：

```text
/content
/content/knowledge
/content/dictionary
/content/courses
/content/lessons or course detail hierarchy
/content/practice
```

具体路由遵循当前 TanStack Router conventions。

不要给每张 DB 表创建菜单项。

## 7. Knowledge Authoring

必须使用 frozen discriminated Content model。

支持当前契约允许的：

```text
create canonical knowledge
edit mutable knowledge fields
manage meanings
manage canonical translations
manage examples
manage pronunciation metadata
manage equivalents/relations/tags
status/lifecycle commands
revision/publish operations where frozen
```

必须尊重：

```text
content type immutable where frozen
language/type invariants
core knowledge no unsafe physical delete
stable public UUID
stale update conflict handling
```

不要将即时 AI translation request 归入 Content Admin；那属于 Learning runtime fact。

## 8. Dictionary Management

Dictionary Admin 只管理 canonical relationships/content metadata，不实现用户搜索历史。

支持当前契约中的：

```text
content equivalents
same-language relations
tags / content tags
canonical translation maintenance
```

避免万能 JSON 编辑器。

## 9. Curriculum

围绕：

```text
Course
→ Unit
→ Lesson
→ Section
→ Item
```

实现 frozen authoring/lifecycle。

重点 UX：

```text
ordering / reorder
expectedUpdatedAt conflict
published/draft/archive state
immutable logical IDs
aggregate editing
invalid reference errors
```

对 reorder / publish 等高影响操作应使用确认与冲突恢复。

不得为 Unit/Item 发明 schema 不存在的 lifecycle/public ID。

## 10. Practice Definitions

围绕 Exercise/Question aggregate，不创建 Option/Rule 行级 CRUD 产品。

支持：

```text
exercise authoring
question authoring
question contents
options
answer rules
ordering
publish lifecycle
```

Admin 可以编辑正确答案定义，但必须确保：

```text
correct-answer data does not leak into runtime/mobile response models
```

前端 API 类型应区分 Admin Authoring DTO 与 Runtime Redacted DTO。

## 11. Revisions

如果当前 backend/frozen API 使用 revision：

```text
show draft/published/superseded state
show revision identity where useful
support frozen publish flow
show stale/conflict errors
```

不要让 Admin 直接编辑 revision snapshot JSONB。

## 12. IDs / Boundary

Admin 只能使用 stable public/logical IDs。

禁止：

```text
internal BIGINT
raw database row IDs
cross-domain physical IDs
```

Content internal aggregate children若 API 不暴露 public ID，页面应按 frozen aggregate contract 操作，不猜内部 ID。

## 13. UX States

主页面至少覆盖：

```text
loading
empty
error + retry
forbidden
not found
conflict
mutation pending
success/failure feedback
```

写操作防重复提交。

## 14. Testing

Unit/component 至少：

```text
API schema mapping
permission guards
forms
status/lifecycle guards
conflict UX
ordering UI
revision state
answer leakage separation
query invalidation
```

Live E2E 至少覆盖代表性：

```text
Knowledge create/update
Curriculum edit/reorder/publish
Practice authoring/publish
permission denied
operator audit evidence
```

以当前 backend API 能力为准，不伪造假成功。

## 15. Security / Scope Audit

确认：

```text
direct fetch outside apiClient = 0
internal BIGINT exposure = 0
answer leakage to runtime types = 0
unprotected mutation = 0
permission key mismatch = 0
Learning user facts written by Content Admin = 0
Audio production state written by Content Admin = 0
```

## 16. Regression

运行当前适用：

```text
Admin typecheck/lint/unit/build/Playwright
Content backend regression
Operations regression
Docs build
CI validation
```

## 17. Documentation / Gate

最终生成：

```text
docs/docs/development/05-content/CONTENT_ADMIN_IMPLEMENTATION_REPORT.md
```

更新 `DEVELOPMENT_PROGRESS.md`。

只有：

```text
BLOCKER = 0
HIGH = 0
all mandatory tests = PASS
live RBAC/audit integration = PASS
```

才能：

```text
CONTENT_ADMIN_IMPLEMENTATION = COMPLETE
CONTENT_ADMIN_GATE = PASS
```

## 18. Out of Scope

不要：

```text
start Learning implementation
start Audio implementation
redesign Content DB/API
modify frozen Content migration
invent table CRUD UI
replace Admin Foundation
```

完成后 STOP。

## 19. Final Response

```text
CONTENT ADMIN RESULT
Repository HEAD = ...
Content Backend = PASS/FROZEN
Operations = PASS
Knowledge = PASS/FAIL
Dictionary = PASS/FAIL
Curriculum = PASS/FAIL
Practice = PASS/FAIL
RBAC = PASS/FAIL
Audit = PASS/FAIL
Admin tests = ...
BLOCKER/HIGH/MEDIUM/LOW = ...
CONTENT_ADMIN_GATE = PASS/FAIL
```

列出修改文件、页面、测试、报告路径与剩余 TECH_DEBT。
