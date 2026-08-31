---
feature_id: knowledge-learning
title: 词汇 / 句子 / 知识学习
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
blocks:
  backend: "Content runtime read implementation and formal Content Backend Gate are not yet complete; Learning Backend execution remains blocked."
evidence:
  design:
    - /development/05-content/CONTENT_DESIGN_AUDIT
    - /development/06-learning/LEARNING_DESIGN_AUDIT
---

# 词汇 / 句子 / 知识学习

## 功能概览

Portfolio Status：`active`。

`knowledge-learning` 只覆盖核心 Lesson 内词汇、句子与 Knowledge 内容的学习消费。Knowledge 内容、类型、meaning/example/revision 等 canonical fact 属于 Content；Learning 只承接用户在学习链中的 user-owned mastery/progress 事实。本 Feature 不包含收藏、词典搜索、即时翻译、翻译历史或标准音频生产/消费 Feature。

## 设计

状态：`done`。

- **Scope**：冻结 Content Knowledge UUID/typed view 被 Lesson 学习链消费，以及 required Knowledge 在 Lesson completion 后初始化 Learning mastery/review state 的边界；不把 Content knowledge schema复制到 Learning，也不并入 F07/F08 能力。
- **Stage / Artifact**：`DESIGN_PASS`。主要工件为 `docs/docs/development/05-content/CONTENT_API.md`、`CONTENT_PUBLIC_CONTRACTS.md`，以及 `docs/docs/development/06-learning/LEARNING_PRODUCT_SEMANTICS.md`、`LEARNING_USE_CASES.md`、`LEARNING_PROGRESS_CONTRACTS.md`。
- **Gate / Evidence**：`CONTENT_DESIGN_GATE = PASS` 已冻结 Knowledge runtime view；`LEARNING_DESIGN_GATE = PASS` 已冻结 required Knowledge resolve、Lesson completion 初始化 mastery/review 的规则，并明确 Learning 不拥有 Content semantic source。
- **Next Action**：保持 Knowledge canonical fact 在 Content、用户学习事实在 Learning；后续实现不得扩展到搜索/翻译/收藏/标准音频等本任务外 Feature。

## Backend

状态：`blocked`。

- **Scope**：Content Backend 提供可学习 Knowledge 的 current published typed view；Learning Backend 在认证用户完成相应 Lesson 时维护自己的 mastery/review state，并通过 Content UUID 校验引用。两域不得相互 direct SQL。
- **Stage / Artifact**：`CONTENT_BLOCKED / IMPLEMENTATION_BLOCKED`。相关 design contract 已 frozen，但 Content/Learning runtime implementation 与 Learning implementation report 尚不存在。
- **Gate / Evidence**：`LEARNING_EXECUTION_BRIEF.md` 明确 Content Gate 未 PASS 时禁止创建 Learning modules/routes/tables CRUD；当前 `apps/backend/src/modules/` 没有 Content/Learning module，现有 Backend unit/integration test 清单也无 Knowledge Learning 测试。
- **Next Action**：Content 先交付 frozen Knowledge/public read capability并取得 Backend Gate PASS；随后 Learning 按 progress contract实现 required Knowledge user-state 初始化与测试，再补真实 implementation evidence。

## Admin

状态：`na`。

不适用：Knowledge 内容后台管理属于 Content Feature；本 Feature 不重复声明 Admin 交付。

## Mobile

状态：`todo`。

当前 `apps/mobile/src/features/` 没有 Learning Core 业务实现；不提前设计词/句学习页面，也不把 Mobile Foundation 当作本 Feature evidence。

## 集成

状态：`todo`。

Content Knowledge read 与 Learning user-state 尚未进入真实集成阶段；不新增跨 Domain contract。

## 验收

状态：`todo`。

核心词/句知识学习尚无端到端实现与 acceptance evidence。