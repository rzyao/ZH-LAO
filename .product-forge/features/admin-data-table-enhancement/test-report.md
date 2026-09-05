# 测试报告：管理端通用数据表增强

> 测试轮次：#1｜日期：2026-09-05｜结果：⚠️ 通过，附环境限制

## 摘要

已在仓库的隔离测试环境验证 Lao 字母列表的查询/分页、跨页选择、陈旧选择拒绝、异步批量任务和失败项重试。4 个核心 Chromium 流程、1 个自动 WCAG-AA 检查、51 个管理端特性测试及 103 个后端特性测试全部通过；没有发现产品缺陷。

本轮已验证真实本地后端 `http://127.0.0.1:18080`：测试账号可登录，但没有 `content.lo_letters.read` 权限，目标接口正确返回 `FORBIDDEN`，所以无法用该账号完成受权限保护的真实列表路径。交互式 `playwright-cli` 亦不在当前机器中，故浏览器功能验证采用项目原生 Playwright/Vitest 隔离测试。

## 结果

| 类型 | 通过 | 失败 | 阻塞 | 覆盖证据 |
| --- | ---: | ---: | ---: | --- |
| 冒烟 | 5 | 0 | 0 | 4 个核心 Chromium 流程 |
| E2E | 8 | 0 | 0 | TC-E2E-001..003 覆盖三个旅程及关键边界 |
| API | 10 | 0 | 0 | 后端 HTTP 合同套件（49 项） |
| 回归 | 5 | 0 | 0 | 管理端 51 项特性测试及既有内容管理旅程 |
| 单元 | 8 | 0 | 0 | admin/backend 覆盖套件 |
| 集成 | 7 | 0 | 0 | PostgreSQL、worker、审计集成套件 |
| **计划用例映射** | **43** | **0** | **0** | 见 `testing/test-cases.md` |

## 已执行命令

- `pnpm --dir apps/admin exec playwright test e2e/content-management.spec.ts --grep 'Lao 字母 URL|页内全选后|预览后集合变化|创建者观察'`：4/4 通过。
- `pnpm --dir apps/admin exec playwright test e2e/content-management.spec.ts --grep '十二个后台页面可直接访问并通过 WCAG-AA 自动检查'`：1/1 通过。
- `pnpm --dir apps/admin test:coverage:lo-letters`：51/51 通过，行覆盖 93.68%。
- `pnpm --dir apps/backend test:coverage:lo-letters`：103/103 通过，行覆盖 95.17%。

## 故事覆盖

| 故事 | 结果 | 主要证据 |
| --- | --- | --- |
| US-001 查询、筛选、排序与分页 | 通过 | 浏览器 TC-E2E-001、API/集成查询测试 |
| US-002 固定列与列设置 | 通过 | TC-E2E-001、DataTable 测试 |
| US-003 跨页选择 | 通过 | TC-E2E-002、陈旧选择拒绝测试 |
| US-004 受控批量动作 | 通过 | 批量任务/worker/审计测试 |
| US-005 结果、历史与重试 | 通过 | 混合结果与失败项重试浏览器测试 |

## 已知限制

1. 真实本地 API 与登录已验证；但当前测试账号缺少 `content.lo_letters.read`，无法完成受保护的 Lao 字母真实路径。
2. `playwright-cli` 不可用，未运行其逐步截图/trace 以及组件令牌运行时一致性脚本。
3. 自动 axe WCAG-AA 检查已通过，但仍需按测试计划完成一次人工键盘、焦点和 400% 缩放检查。

## 结论

隔离自动化测试满足核心功能和覆盖门槛，且无 P0/P1 缺陷。功能可进入发布就绪检查，但发布前应补做真实环境登录/API 验证并接受上述限制。
