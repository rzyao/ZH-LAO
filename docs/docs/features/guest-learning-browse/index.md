---
feature_id: guest-learning-browse
title: 游客浏览学习内容
portfolio_status: active
domain:
  - learning
  - content
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

# 游客浏览学习内容

## 功能概览

Portfolio Status：`active`。

`guest-learning-browse` 负责游客进入学习内容浏览链路。Content 是课程、Lesson 与已发布内容的 canonical owner；Learning 不为匿名浏览创建用户进度、历史或其它 user-owned 学习事实。需要进入用户态学习行为时，仍遵守 Learning runtime 的 authenticated / current-user ownership contract。

## 设计

状态：`done`。

- **Scope**：冻结“游客可消费 Content 的 current published read surface，但匿名浏览不产生 Learning user-state”的边界；不在本 Feature 重定义 Content persistence、Learning progress 或 Identity session contract。
- **Stage / Artifact**：`DESIGN_PASS`。有效工件包括 `docs/docs/development/05-content/CONTENT_API.md`、`docs/docs/development/05-content/CONTENT_PUBLIC_CONTRACTS.md`、`docs/docs/development/06-learning/LEARNING_PRODUCT_SEMANTICS.md`、`docs/docs/development/06-learning/LEARNING_USE_CASES.md`。
- **Gate / Evidence**：`CONTENT_DESIGN_GATE = PASS`，Content runtime 已冻结课程/Lesson 的 public-current API；`LEARNING_DESIGN_GATE = PASS`，Learning Use Cases 明确 runtime user-owned 能力为 authenticated，且 Learning 不接管 Content canonical facts。设计 Gate 证据见 `CONTENT_DESIGN_AUDIT.md` 与 `LEARNING_DESIGN_AUDIT.md`。
- **Next Action**：保持现有 owner boundary，不扩展匿名 Learning persistence；等待 Content Backend Gate 后再进入真实 runtime 接线。

## Backend

状态：`blocked`。

- **Scope**：本 Feature 的无状态浏览 Backend 依赖 Content 提供已发布课程/课程结构/Lesson 内容读取；Learning Backend 不应为游客写 `course_progress`、`lesson_progress`、activity 或其它用户事实。
- **Stage / Artifact**：`CONTENT_BLOCKED / IMPLEMENTATION_BLOCKED`。当前只有 frozen Content/Learning design contracts 与 execution brief，没有可作为完成证据的 Content/Learning runtime implementation report。
- **Gate / Evidence**：`docs/docs/development/06-learning/LEARNING_EXECUTION_BRIEF.md` 明确 `content_gate_status = NOT_PASS`，Learning implementation 入口被 Content Gate 阻塞；`apps/backend/src/modules/` 当前仅有 Identity、Operations、Platform，没有 Content/Learning module，现有 unit/integration test 清单也没有 Learning Core 测试。
- **Next Action**：由 Content execution owner 先按 frozen `CONTENT_API.md` / public contract 完成 runtime read capability并形成正式 Content Backend Gate / Implementation Report；Gate PASS 后再接入游客学习入口，并以真实代码与测试更新本 Lane。

## Admin

状态：`na`。

不适用：当前功能不需要该交付端。

## Mobile

状态：`todo`。

Mobile Foundation 已存在，但当前 `apps/mobile/src/features/` 仅有 foundation；尚无 Learning Core 业务 Feature 实现。不得在 Content/Learning runtime contract 可执行前把 Foundation 代码当成本 Feature 交付证据。

## 集成

状态：`todo`。

Content runtime 与实际客户端学习入口尚未进入可验收集成阶段；不提前设计跨 Domain 新 contract。

## 验收

状态：`todo`。

Backend 与 Mobile 尚未形成端到端实现，当前没有本 Feature 的 acceptance evidence。