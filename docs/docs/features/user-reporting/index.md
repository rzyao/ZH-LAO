---
feature_id: user-reporting
title: 用户举报提交
portfolio_status: active
domain:
  - trust
  - identity
  - social
  - chat
  - commerce
status:
  design: todo
  backend: todo
  admin: na
  mobile: todo
  integration: todo
  acceptance: todo
mobile_pages: []
admin_pages: []
---

# 用户举报提交

## 功能概览

Portfolio Status：`active`。

用户从 Social / Chat / Commerce 等业务入口提交举报后，唯一 canonical 举报事实必须写入 `trust.reports`。`reason_code` 与 `description` 只表达举报者观点，不等于 Moderation Decision，也不等于任何 Enforcement 已成立。业务域只提供举报入口，不得自建第二套 report fact。

本 Feature 只负责 **Report 提交**；后续 `Moderation Case → Evidence → Decision → Enforcement Action → Appeal` 属于 Trust 治理链的后续能力。

## 设计

状态：todo

范围：定义用户举报提交的产品/API 边界：已登录举报者、`subject_domain + subject_type + subject_id` 稳定对象引用、举报原因与补充说明，并保证所有入口最终只形成 `trust.reports` 这一份 canonical Report。

执行阶段与产物：仓库没有本 Feature 独立的 Design Stage / Brief。可用设计输入已经冻结在 [Trust & Safety](/domains/trust/)、[Moderation](/domains/trust/moderation) 与 [Contracts](/domains/trust/contracts)；数据模型见 [Trust 数据库](/domains/trust/database)。

Gate / 完成证据：Trust canonical 已冻结，`database/v2/migrations/1100_trust.sql` 已物理创建 `trust.reports`，数据库基线报告为 PASS；但仓库没有“用户举报提交”Feature 级 Design Gate，因此本 Lane 保持 `todo`，不把 Domain/DB 完成误写为 Feature Design 完成。

下一步：建立本 Feature 的正式设计阶段，基于既有 canonical fact 冻结请求/响应、鉴权、错误码与重复提交策略；不得新增 Social / Chat / Commerce 举报事实表。

## Backend

状态：todo

范围：实现用户举报 Application Service / Public API，只负责校验举报者与 subject 三元组并写入 `trust.reports`；不得把 Report 当成违规结论，也不得直接修改被举报对象所属 Domain 状态。

执行阶段与产物：[后端开发](/development/backend/) 当前没有 Trust Backend 任务目录，`apps/backend` 也没有 Trust 模块；现有 `1100_trust.sql` 仅证明数据库事实已落地。

Gate / 完成证据：数据库基线验证了 `trust.reports` 的物理表、UUID logical reference 与跨域 FK 边界，但没有举报 API、Service、Repository 或对应测试/Gate 证据。

下一步：创建 Trust Backend Execution Brief，并实现 Report 写入契约、鉴权/校验、幂等或重复提交策略以及单元/集成测试，再形成 Backend Gate。

## Admin

状态：na

范围：用户举报“提交”是用户侧能力，不在 Admin 页面完成；运营人员处理举报后的 Case / Evidence / Decision 属于“审核案件 / 证据 / 决定工作台”。

执行阶段与产物：[后台开发](/development/admin/) 没有为本 Feature 定义独立 Admin 页面。

Gate / 完成证据：不适用；本 Feature 的 Admin 责任被明确排除，不能通过新增后台举报事实来替代 `trust.reports`。

下一步：无；后续运营处理进入 `moderation-workbench` Feature。

## Mobile

状态：todo

范围：在 Social / Chat / Commerce 的合适对象上下文提供举报入口，采集 reason/description，并把业务对象稳定 logical UUID 作为 subject 三元组提交给 Trust。

执行阶段与产物：[Mobile 页面清单](/mobile/pages) 当前没有举报页面或已登记 `page_id`，本 Feature `mobile_pages` 为空；当前 Mobile 源码也没有 Trust/举报 Feature 实现。

Gate / 完成证据：没有 Mobile 设计、实现或测试 Gate；业务入口未来只能消费 Trust 举报 API，不能在客户端或业务域定义第二套举报状态。

下一步：在 Backend 合同稳定后，为实际需要举报入口的业务页面补交互与错误态，并登记对应 Mobile page contract 与测试。

## 集成

状态：todo

范围：打通业务入口 → Trust Report 的单向写入契约；Social / Chat / Commerce 只传递 canonical subject reference，后续 Case/Decision/Enforcement 不由入口域自行推断。

执行阶段与产物：当前只有 [Trust Contracts](/domains/trust/contracts) 的跨域边界与数据库 logical UUID 约束，没有本 Feature 的 Integration Stage 或跨端联调产物。

Gate / 完成证据：数据库基线证明跨域引用没有非法物理 FK，但没有真实入口调用 Trust API 的集成测试，也没有“唯一 `trust.reports` 写入”E2E 证据。

下一步：Backend 与实际举报入口就绪后，增加跨域契约测试，验证每次成功提交只创建 canonical Report，并验证业务域不持有重复 report fact。

## 验收

状态：todo

范围：验证用户可从真实业务对象发起举报、失败可解释、成功后只产生 `trust.reports`，且 Report 不被误当作 Moderation Decision 或 Enforcement 结果。

执行阶段与产物：仓库没有本 Feature 的 Acceptance Stage / Report；现有数据库 baseline 只能作为数据层前置证据。

Gate / 完成证据：尚无用户举报端到端测试与验收 Gate。

下一步：在 Backend、Mobile/入口集成完成后补 E2E：合法/非法 subject、鉴权、重复提交策略、Report 唯一事实边界，以及后续治理链不反向篡改 Report。
