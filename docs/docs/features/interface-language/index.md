---
feature_id: interface-language
title: 界面语言切换
portfolio_status: active
domain: []
status:
  design: done
  backend: todo
  admin: na
  mobile: done
  integration: na
  acceptance: done
mobile_pages: []
admin_pages: []
evidence:
  design:
    - /development/mobile/foundation/
  mobile:
    - /development/mobile/foundation/
  acceptance:
    - /development/mobile/foundation/
---

# 界面语言切换

## 功能概览

Portfolio Status：`active`。

`interface-language` 是当前正式 Feature 清单中的 Mobile Foundation 功能。Feature Inventory 记录已交付 Lane 为设计、Mobile、验收；当前独立交付 surface 为 Mobile 与验收。

## 设计

状态：done

范围：Mobile Foundation 已落地 I18n Provider、中文 / 老挝语语言包结构、偏好持久化与 Settings / Language / Theme 迁移链，形成当前界面语言切换的基础设计与运行语义。

Stage / 工件 / Gate：[Mobile Foundation Report](../../development/MOBILE_FOUNDATION_REPORT.md) 记录 MOB-F04 / F05 / F18 / F20 相关实现与验证，并在最终 `MOBILE_FOUNDATION_GATE` 中确认 I18n / representative screen / reuse path 等检查通过；当前没有另造第二份 Feature Design Gate。

下一步：保留现有完成证据；若未来语言偏好语义或同步边界扩大，应先新开正式 Design Stage，而不是改写本次完成事实。

## Backend

状态：todo

范围：当前完成证据只覆盖 Mobile Foundation；未发现 `interface-language` 专属 Backend API、服务端偏好同步 Contract 或 Backend 实现报告。

Stage / 工件 / Gate：[Mobile Foundation Report](../../development/MOBILE_FOUNDATION_REPORT.md) 明确记录 Real Domain APIs integrated = 0，真实 Domain API integration pending；未发现本 Feature 的 Backend Stage / Execution Brief / Gate。

下一步：等待后续明确的 Backend Stage / Contract；在此之前保持 `todo`，不把 Mobile 本地偏好持久化视为 Backend 完成。

## Admin

状态：na

范围：当前 Feature Inventory 未把 Admin 列为 `interface-language` 的交付 surface，本 Feature 的已交付范围属于 Mobile 用户界面偏好。

Stage / 工件 / Gate：不适用；当前没有本 Feature 的 Admin Stage / Gate。

下一步：无。仅在 canonical Inventory 后续增加 Admin surface 时重新启用。

## Mobile

状态：done

范围：Mobile Foundation 已迁移 Settings / Language / Theme 屏，并完成 I18n Provider、语言资源与偏好存储 / hydration 路径；该范围构成当前 Feature 的 Mobile 交付事实。

Stage / 工件 / Gate：[Mobile Foundation Report](../../development/MOBILE_FOUNDATION_REPORT.md) 记录 MOB-F20 “Settings/Language/Theme 屏 → 新 Expo 57 运行时”迁移链，测试为 10 suites / 63 passed，最终 `MOBILE_FOUNDATION_GATE = PASS`。

下一步：保持当前交付；后续体验增强需由新的 Mobile Stage 单独记录，不覆盖本次完成证据。

## 集成

状态：na

范围：当前 Feature Inventory 未声明独立 Integration surface；现有完成范围由 Mobile Foundation 内部 Provider / 偏好存储链承载，没有跨 Domain Feature 集成 Lane。

Stage / 工件 / Gate：不适用。[Mobile Foundation Report](../../development/MOBILE_FOUNDATION_REPORT.md) 同时确认 Real Domain APIs integrated = 0，因此不把不存在的跨域集成伪造成已完成。

下一步：无。若未来 canonical scope 引入跨设备或跨服务集成，再由新的 Integration Stage 承载。

## 验收

状态：done

范围：验收覆盖 Mobile Foundation 中的 I18n、语言偏好、Settings / Language / Theme 迁移链及其回归检查。

Stage / 工件 / Gate：[Mobile Foundation Report](../../development/MOBILE_FOUNDATION_REPORT.md) 记录 typecheck、lint、10 suites / 63 tests、Expo config、Web、Android 与多项审计通过，并明确 `MOBILE_FOUNDATION_GATE = PASS`；该报告是本 Lane 的真实完成证据。

下一步：保留完成证据；当前无新的验收动作。
