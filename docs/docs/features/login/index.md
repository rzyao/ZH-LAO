---
feature_id: login
title: 用户登录与会话
portfolio_status: active
domain:
  - identity
status:
  design: done
  backend: done
  admin: na
  mobile: active
  integration: todo
  acceptance: todo
mobile_pages:
  - mobile-login
  - mobile-otp
admin_pages: []
evidence:
  design:
    - /domains/identity/
  backend:
    - /development/backend/identity/
active_notes:
  mobile: LOGIN-MOBILE-DESIGN 已进入可执行阶段，真实 API 集成与设备验证推进中。
---

# 用户登录与会话

## 功能概览

Portfolio Status：`active`。

App 用户能够建立 Identity、恢复会话并安全退出；领域事实以 [Identity](/domains/identity/) 文档为准。

## 设计

状态：done

范围：围绕“用户登录与会话”确认用户/运营目标、范围边界、流程与跨域归属；权威事实来自 [identity](/domains/identity/)。

执行阶段与产物：[Identity Design Audit](/development/02-identity/IDENTITY_DESIGN_AUDIT.md)。

Gate / 完成证据：完成证据：[Identity Design Audit](/development/02-identity/IDENTITY_DESIGN_AUDIT.md)。Identity 领域完成证据包含 IDENTITY_GATE = PASS。

下一步：进入 Backend，以该 Lane 的真实 Gate 作为后续起点。

## Backend

状态：done

范围：覆盖“用户登录与会话”在所属 Domain 的 API、Service、Repository、数据交互与错误处理；权威边界来自 [identity](/domains/identity/)。

执行阶段与产物：[Identity Implementation Report](/development/02-identity/IDENTITY_IMPLEMENTATION_REPORT.md)。

Gate / 完成证据：完成证据：[Identity Implementation Report](/development/02-identity/IDENTITY_IMPLEMENTATION_REPORT.md)。Identity 领域完成证据包含 IDENTITY_GATE = PASS。

下一步：进入 Admin / Mobile，以该 Lane 的真实 Gate 作为后续起点。

## Admin

状态：na

不适用：当前功能不需要该交付端。

## Mobile

状态：active

范围：覆盖“用户登录与会话”在 Mobile 端的页面、导航、用户状态与真实接口接入；页面边界来自 [identity](/domains/identity/)。

执行阶段与产物：LOGIN-MOBILE-DESIGN 已进入可执行阶段，真实 API 集成与设备验证推进中。 相关产物为 [LOGIN-MOBILE-DESIGN](/development/mobile/auth/LOGIN_MOBILE_DESIGN_BRIEF.md)。

已完成内容：Mobile 设计 Brief 与 LOGIN_MOBILE_DESIGN_GATE 已通过。

当前进行内容：真实 Identity API 接入、Session Bootstrap 与设备验证。

Gate / 完成证据：相关产物：[LOGIN-MOBILE-DESIGN](/development/mobile/auth/LOGIN_MOBILE_DESIGN_BRIEF.md)；LOGIN_MOBILE_DESIGN_GATE = PASS，Mobile 实现与真实 API 集成仍在推进。

下一步：继续当前阶段并补齐实现/联调证据，再推进到下一 Lane。

## 集成

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。

## 验收

状态：todo

在此维护该 Lane 的范围、当前 Stage、相关工件、Gate 与下一步。
