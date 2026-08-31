---
feature_id: theme-settings
title: 主题设置
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

# 主题设置

## 功能概览

Portfolio Status：`active`。

`theme-settings` 是当前正式 Feature 清单中的 Mobile Foundation 功能。Feature Inventory 记录已交付 Lane 为设计、Mobile、验收；当前独立交付 surface 为 Mobile 与验收。

## 设计

状态：done

范围：Mobile Foundation 已落地 ThemeProvider、5 套主题 preset、typography 复用以及主题偏好持久化 / hydration，并把 Settings / Theme 迁移链纳入 Foundation。

Stage / 工件 / Gate：[Mobile Foundation Report](../../development/MOBILE_FOUNDATION_REPORT.md) 记录 MOB-F04、F05、F18、F20 的主题与代表性页面实现 / 验证，最终 `MOBILE_FOUNDATION_GATE` 对 Theme、reuse path 与 representative screen 均给出 PASS；本页不创建第二份虚构 Gate。

下一步：保留当前完成证据；未来若主题模型或产品语义扩展，应由新的 Design Stage 单独记录。

## Backend

状态：todo

范围：当前完成证据只覆盖 Mobile Foundation；未发现 `theme-settings` 专属 Backend API、服务端主题偏好同步 Contract 或 Backend 实现报告。

Stage / 工件 / Gate：[Mobile Foundation Report](../../development/MOBILE_FOUNDATION_REPORT.md) 明确记录 Real Domain APIs integrated = 0，真实 Domain API integration pending；未发现本 Feature 的 Backend Stage / Execution Brief / Gate。

下一步：等待后续明确的 Backend Stage / Contract；在此之前保持 `todo`，不把 Mobile 本地主题持久化视为 Backend 完成。

## Admin

状态：na

范围：当前 Feature Inventory 未把 Admin 列为 `theme-settings` 的交付 surface；本 Feature 的 canonical 已交付范围属于 Mobile 用户主题偏好。

Stage / 工件 / Gate：不适用；Admin Foundation 自身虽有后台主题能力，但那是后台 Foundation 能力，不是本 Feature 的 Admin Lane 交付证据。

下一步：无。仅在 canonical Inventory 后续增加 Admin surface 时重新启用。

## Mobile

状态：done

范围：Mobile Foundation 已提供 ThemeProvider、5 套主题 preset、偏好持久化 / hydration，并完成 Settings / Theme 屏迁移；该范围构成当前 Feature 的 Mobile 交付事实。

Stage / 工件 / Gate：[Mobile Foundation Report](../../development/MOBILE_FOUNDATION_REPORT.md) 记录 Theme 复用路径与 Settings/Language/Theme 屏迁移链，测试为 10 suites / 63 passed，最终 `MOBILE_FOUNDATION_GATE = PASS`。

下一步：保持当前交付；后续主题体验增强由新的 Mobile Stage 记录，不覆盖本次完成证据。

## 集成

状态：na

范围：当前 Feature Inventory 未声明独立 Integration surface；现有主题切换由 Mobile Foundation 内部 ThemeProvider 与偏好存储链完成，没有跨 Domain Feature 集成 Lane。

Stage / 工件 / Gate：不适用。[Mobile Foundation Report](../../development/MOBILE_FOUNDATION_REPORT.md) 同时确认 Real Domain APIs integrated = 0，因此不把不存在的跨域集成伪造成完成事实。

下一步：无。若未来 canonical scope 引入跨设备或跨服务同步，再由新的 Integration Stage 承载。

## 验收

状态：done

范围：验收覆盖 ThemeProvider、主题 preset、偏好持久化 / hydration、Settings / Theme 迁移链及相关回归检查。

Stage / 工件 / Gate：[Mobile Foundation Report](../../development/MOBILE_FOUNDATION_REPORT.md) 记录 typecheck、lint、10 suites / 63 tests、Expo config、Web、Android 与多项审计通过，并明确 `MOBILE_FOUNDATION_GATE = PASS`；该报告是本 Lane 的真实完成证据。

下一步：保留完成证据；当前无新的验收动作。
