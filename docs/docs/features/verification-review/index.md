---
feature_id: verification-review
title: 真人认证审核
portfolio_status: pending_decision
domain:
  - trust
  - operations
  - social
status:
  design: blocked
  backend: blocked
  admin: blocked
  mobile: na
  integration: blocked
  acceptance: blocked
mobile_pages: []
admin_pages: []
blocks:
  design: TRUST_VERIFICATION_DESIGN
  backend: TRUST_VERIFICATION_DESIGN
  admin: TRUST_VERIFICATION_DESIGN
  integration: TRUST_VERIFICATION_DESIGN
  acceptance: TRUST_VERIFICATION_DESIGN
---

# 真人认证审核

## 功能概览

Portfolio Status：`pending_decision`。

`verification-review` 是当前正式 Feature 清单中的功能。其领域事实以 trust、operations、social 文档为准。

## 设计

状态：blocked

范围：围绕“真人认证审核”确认用户/运营目标、范围边界、流程与跨域归属；权威事实来自 [trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

执行阶段与产物：[trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

Gate / 完成证据：阻塞证据：依赖 Gate `TRUST_VERIFICATION_DESIGN` 尚未在仓库形成 PASS 结论；相关上下文：[trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

阻塞原因：`TRUST_VERIFICATION_DESIGN`。

阻塞对象：TRUST_VERIFICATION_DESIGN；已完成内容：尚无该 Lane 的可确认完成产物。

等待条件：依赖 Gate `TRUST_VERIFICATION_DESIGN` 形成 PASS 结论并解除上游依赖。

下一步：解除阻塞后，从该 Lane 的设计/执行准备阶段重新核对范围并继续。

## Backend

状态：blocked

范围：覆盖“真人认证审核”在所属 Domain 的 API、Service、Repository、数据交互与错误处理；权威边界来自 [trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

执行阶段与产物：[trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

Gate / 完成证据：阻塞证据：依赖 Gate `TRUST_VERIFICATION_DESIGN` 尚未在仓库形成 PASS 结论；相关上下文：[trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

阻塞原因：`TRUST_VERIFICATION_DESIGN`。

阻塞对象：TRUST_VERIFICATION_DESIGN；已完成内容：尚无该 Lane 的可确认完成产物。

等待条件：依赖 Gate `TRUST_VERIFICATION_DESIGN` 形成 PASS 结论并解除上游依赖。

下一步：解除阻塞后，从该 Lane 的设计/执行准备阶段重新核对范围并继续。

## Admin

状态：blocked

范围：覆盖“真人认证审核”对应的运营工作台、权限、操作与审计；权威边界来自 [trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

执行阶段与产物：当前 Lane 尚未进入执行。

Gate / 完成证据：阻塞证据：依赖 Gate `TRUST_VERIFICATION_DESIGN` 尚未在仓库形成 PASS 结论；相关上下文：当前 Lane 尚未进入执行。

阻塞原因：`TRUST_VERIFICATION_DESIGN`。

阻塞对象：TRUST_VERIFICATION_DESIGN；已完成内容：尚无该 Lane 的可确认完成产物。

等待条件：依赖 Gate `TRUST_VERIFICATION_DESIGN` 形成 PASS 结论并解除上游依赖。

下一步：解除阻塞后，从该 Lane 的设计/执行准备阶段重新核对范围并继续。

## Mobile

状态：na

不适用：当前功能不需要该交付端。

## 集成

状态：blocked

范围：覆盖“真人认证审核”的跨端/跨域契约、依赖顺序、错误传播与发布前联调；依赖事实来自 [trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

执行阶段与产物：[trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

Gate / 完成证据：阻塞证据：依赖 Gate `TRUST_VERIFICATION_DESIGN` 尚未在仓库形成 PASS 结论；相关上下文：[trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

阻塞原因：`TRUST_VERIFICATION_DESIGN`。

阻塞对象：TRUST_VERIFICATION_DESIGN；已完成内容：尚无该 Lane 的可确认完成产物。

等待条件：依赖 Gate `TRUST_VERIFICATION_DESIGN` 形成 PASS 结论并解除上游依赖。

下一步：解除阻塞后，从该 Lane 的设计/执行准备阶段重新核对范围并继续。

## 验收

状态：blocked

范围：覆盖“真人认证审核”已定义范围的 E2E 场景、回归检查与最终交付判定；验收对象来自 [trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

执行阶段与产物：[trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

Gate / 完成证据：阻塞证据：依赖 Gate `TRUST_VERIFICATION_DESIGN` 尚未在仓库形成 PASS 结论；相关上下文：[trust](/domains/trust/)、[operations](/domains/operations/)、[social](/domains/social/)。

阻塞原因：`TRUST_VERIFICATION_DESIGN`。

阻塞对象：TRUST_VERIFICATION_DESIGN；已完成内容：尚无该 Lane 的可确认完成产物。

等待条件：依赖 Gate `TRUST_VERIFICATION_DESIGN` 形成 PASS 结论并解除上游依赖。

下一步：解除阻塞后，从该 Lane 的设计/执行准备阶段重新核对范围并继续。
