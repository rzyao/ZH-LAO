---
status: active
last_updated: 2026-09-02
---

# Mobile 页面清单

Mobile 页面文档按当前代码路由与正式页面契约分组：

## Foundation

| 页面 | 当前路由 / 组件 | 页面文档 |
| --- | --- | --- |
| 概览 | `home` / `HomeScreen` | Foundation 实现，待补独立页面契约 |
| 能力实验室 | `lab` / `LabScreen` | Foundation 实现，待补独立页面契约 |
| 设置 | `settings` / `SettingsScreen` | Foundation 实现，待补独立页面契约 |
| 主题 | `settings/theme` / `ThemeScreen` | Foundation 实现，待补独立页面契约 |
| 语言设置 | `settings/language` / `LanguageSettingScreen` | Foundation 实现，待补独立页面契约 |
| 语言选择 | `settings/language/select` / `LanguageSelectScreen` | Foundation 实现，待补独立页面契约 |
| 资源详情 | `resource/:resourceId` / `ResourceDetailScreen` | Foundation 实现，待补独立页面契约 |

## 认证

- [登录页](login.md)（`mobile-login`，关联 `login` Feature）
- [OTP 验证页](otp.md)（`mobile-otp`，关联 `login` Feature）

页面文档补齐后，必须在对应 Feature Page 的 `mobile_pages` 中登记稳定 `page_id`，并在本页 frontmatter 反向列出 Feature。
