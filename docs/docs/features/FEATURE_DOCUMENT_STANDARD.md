---
status: active
last_updated: 2026-09-02
---

# Feature 文档规范 V5

## 1. Feature Page 定位

每个正式 Feature 在 `/features/<feature_id>/index.md` 拥有唯一页面，用于说明用户或运营目标、领域关系、责任边界、关联页面和当前可追溯证据。

Feature Page 是横向交付地图，不是第二份产品、领域、API、数据库、实施计划或完成状态事实源。真实执行与完成状态必须来自 Task Manifest、Stage、Execution Brief、Blueprint、Gate / Report、测试与实际页面实现。

## 2. Frontmatter

最小结构：

```yaml
feature_id: login
title: 用户登录与会话
portfolio_status: active
domain:
  - identity
mobile_pages:
  - mobile-login
admin_pages: []
contracts:
  owns:
    - 用户认证
  depends_on:
    - OTP Provider
delivery_evidence:
  - /domains/identity/
  - /development/backend/identity/
delivery_notes:
  - 当前实现状态以关联 Stage 与 Gate 为准。
```

规则：

- `feature_id` 必须与目录名及 `FEATURE_INVENTORY.json` 一致。
- `portfolio_status` 只表达 `active / deferred / pending_decision`，不证明设计或实现完成。
- `domain` 声明主要及参与领域，不改变 canonical ownership。
- `mobile_pages` / `admin_pages` 必须与页面文档中的 Feature 反向引用一致。
- `delivery_evidence` 和 `delivery_notes` 是可选字符串列表，只保存可追溯线索，不产生独立完成状态。
- 禁止过时元数据：`status`、`blocks`、`active_notes` 和按固定维度分组的 `evidence`。

## 3. Portfolio 状态

- `active`：当前产品组合仍保留该 Feature。
- `deferred`：明确不进入当前周期。
- `pending_decision`：必须先完成指定产品或架构裁决。

Portfolio 状态不等于 Stage 状态、Domain Gate、页面完成或端到端验收结果。

## 4. 页面正文

所有页面必须包含：

```text
# 功能名称
## 功能概览
```

功能概览应说明用户或运营目标、包含与不包含范围、主要与参与领域、canonical 文档、已知决策阻塞，以及真实 Stage、Gate、Report、页面或测试证据。

只有 Feature 自身确有复杂状态机、权限模型或验收模型时，才增加相应章节。不得为所有 Feature 生成固定占位章节。

## 5. Contract 与 Dependency

Feature Page 可以声明自身拥有、依赖和禁止侵入的能力，但不得复制完整 Contract：

```yaml
contracts:
  owns: []
  depends_on: []
  forbidden: []
```

依赖关系必须链接真实上游能力、外部服务或决策阻塞。数据库表、Repository、Worker 和内部技术组件不能伪造成独立 Feature。

## 6. Evidence 与完成事实

可接受证据包括 canonical 产品或领域文档、Task Manifest、Execution Brief、Blueprint、Implementation Report、Audit、Gate、代码、测试、CI、真实页面和 E2E 验收。

Feature Page 只引用这些证据。以下推断一律禁止：

```text
Migration 存在 = Backend 完成
Domain 冻结 = Feature 已交付
页面占位存在 = UI 已完成
计划存在 = Gate 已通过
```

## 7. Gate 与状态机

Gate 必须属于真实 Stage 或 Feature 验收过程，说明目标、输入、检查项、结果和证据。不得为了填充固定文档结构而创建 Gate。

涉及业务生命周期时，状态机必须明确实体、状态、迁移、权限、失败和回滚；多实体 Feature 分开描述。没有业务状态机的 Feature 不创建空章节。

## 8. Acceptance Criteria

Feature Page 应能够回答：

1. 功能解决什么问题？
2. 哪些内容属于或不属于它？
3. 哪些 Domain 拥有相关事实？
4. 当前有哪些真实 Stage、Gate、Report、页面或测试证据？
5. 哪些产品裁决或上游依赖仍然阻塞交付？
6. 如何确认端到端价值真正完成？

页面本身不得通过固定状态矩阵宣称完成。
