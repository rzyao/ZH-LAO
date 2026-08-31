---
feature_id: course-catalog
title: 课程列表与课程详情
portfolio_status: active
domain:
  - learning
  - content
  - identity
status:
  design: done
  backend: blocked
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
---

# 课程列表与课程详情

## 功能概览

Portfolio Status：`active`。

`course-catalog` 覆盖课程列表、课程详情、课程结构与进入课程前的读取链路。课程/Lesson 定义、发布状态、结构与 revision 属于 Content；Learning 只在进入 user-owned 学习状态后持有进度、resume 等事实；Identity 只提供认证用户上下文，不成为课程内容 owner。

## 设计

状态：`done`。

- **Scope**：冻结课程列表、课程详情、课程结构读取以及 Learning 消费 Content logical UUID 的责任边界；不复制 Content catalog，不用 Learning 表保存课程 canonical data，也不重新设计 Identity contract。
- **Stage / Artifact**：`DESIGN_PASS`。主要工件为 `docs/docs/development/05-content/CONTENT_API.md`、`CONTENT_PUBLIC_CONTRACTS.md`、`docs/docs/development/06-learning/LEARNING_PRODUCT_SEMANTICS.md`、`LEARNING_USE_CASES.md`、`LEARNING_PUBLIC_CONTRACTS.md`。
- **Gate / Evidence**：`CONTENT_DESIGN_GATE = PASS` 已冻结 `GET /api/v1/content/courses`、课程详情与 structure contract；`LEARNING_DESIGN_GATE = PASS` 已冻结 Start/Resume Course 与 Content public-query boundary。证据见两域 Design Audit。
- **Next Action**：设计保持冻结；后续只按已冻结 Content read contract 和 Learning current-user contract实现，不新增跨域 SQL/FK 或重复 catalog 模型。

## Backend

状态：`blocked`。

- **Scope**：Content Backend 提供 course list/detail/structure public-current reads；Learning Backend 在认证用户进入课程后验证 Course UUID并创建/读取自己的 user-owned course state。两者通过 frozen public contract衔接，不允许 Learning direct SQL `content.*`。
- **Stage / Artifact**：`CONTENT_BLOCKED / IMPLEMENTATION_BLOCKED`。Content/Learning 设计均完成，但 Content runtime implementation 尚无正式 Implementation Report，Learning execution entry 仍为 blocked。
- **Gate / Evidence**：`LEARNING_EXECUTION_BRIEF.md` 明确要求 Content read API/DTO/event freeze 与 Content Gate 后才能开始 Learning implementation，并记录 `content_gate_status = NOT_PASS`；当前 `apps/backend/src/modules/` 不存在 Content/Learning module，Backend unit/integration tests 也没有课程目录或 Learning Core 测试。
- **Next Action**：先完成 Content runtime course read implementation并取得正式 Content Backend Gate PASS；随后按 `LEARNING_USE_CASES.md` 实现 Start/Resume Course 等 Learning 能力并补代码、测试和 Implementation Report evidence。

## Admin

状态：`na`。

不适用：本 Feature 是 learner runtime 课程消费链路；Content Admin 的课程运营能力属于 Content Feature，不在本页扩展。

## Mobile

状态：`todo`。

当前 Mobile 只有 Foundation，尚无可归属本 Feature 的 course catalog 业务实现；不将既有导航/HTTP client skeleton 记为课程列表或详情完成。

## 集成

状态：`todo`。

Content course runtime 与 Learning user-state 尚未形成真实跨域运行链路，暂不提前声明 integration artifact。

## 验收

状态：`todo`。

课程列表、详情、进入课程尚无端到端 Backend + Mobile acceptance evidence。