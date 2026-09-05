# 测试计划：管理端通用数据表增强

> 创建：2026-09-05｜阶段：8A｜Feature：`admin-data-table-enhancement`

## 范围

覆盖 `/content/lo/letters` 的服务端查询、固定操作列与列设置、分页、跨页/当前筛选结果全选、批量提交/通过/驳回/软删除、原因校验、异步任务、结果重试和审计边界。

不覆盖上线/下线、导出、共享筛选视图，或未提供账号的真实部署环境登录。测试计划不改变 Content 的状态机、权限或幂等契约。

## 环境

- 管理端：`http://localhost:15173`；Chromium。
- API：现有 E2E 采用受控 Mock；真实 API/worker 测试使用 backend 的 PostgreSQL 集成套件。
- 认证：需要内容管理员权限；未提供真实测试账号。
- 自动可访问性：`@axe-core/playwright` 已安装，`a11y_gate: axe`。

## 覆盖与估时

| 类型 | 数量 | 预计 | 主要位置 |
| --- | ---: | --- | --- |
| 冒烟 | 5 | 5 分钟 | `test-cases.md`、现有 E2E |
| E2E | 8 | 20 分钟 | `playwright-tests/`、`apps/admin/e2e/content-management.spec.ts` |
| API | 10 | 10 分钟 | backend 合同/集成测试 |
| 回归 | 5 | 10 分钟 | admin Vitest、既有内容管理 E2E |
| 单元 | 8 | 5 分钟 | admin/backend Vitest |
| 集成 | 7 | 15 分钟 | backend PostgreSQL 集成测试 |
| **合计** | **43** | **约 65 分钟** | |

## 故事覆盖矩阵

| 故事 | 冒烟 | E2E | API/集成 | 回归 | 结果 |
| --- | --- | --- | --- | --- | --- |
| US-001 查询与分页 | SMK-001 | E2E-001..003 | API-001,002, INT-001 | REG-001 | 完整 |
| US-002 固定列与列设置 | SMK-002 | E2E-001 | UNIT-001,002 | REG-002 | 完整 |
| US-003 跨页选择 | SMK-003 | E2E-004,005 | API-003, INT-002 | REG-003 | 完整 |
| US-004 确认批量动作 | SMK-004 | E2E-006,007 | API-004..007, INT-003..005 | REG-004 | 完整 |
| US-005 任务结果与重试 | SMK-005 | E2E-006,008 | API-008..010, INT-006,007 | REG-005 | 完整 |

## 入口条件

- [x] Phase 7 无 CRITICAL，告警 F-011/F-013/F-015 已接受并记录。
- [x] Playwright 与 `@axe-core/playwright` 已安装。
- [ ] 真实环境执行时，提供受控测试账号、可重置数据和运行中的 API/worker。
- [ ] 安装 Chromium 浏览器（如当前机器尚未安装）：`pnpm --dir apps/admin exec playwright install chromium`。

## 退出条件

- 所有 P0 冒烟与 E2E 主路径通过；所有 P0/P1 边界已执行。
- 无开放 P0/P1 缺陷；P2 有记录、负责人和缓解措施。
- 运行结果写回追溯矩阵；未执行用环境缺口明确标注，不能伪报通过。

## 执行顺序

1. 运行 admin 与 backend 的特性覆盖命令，再运行既有 `content-management.spec.ts` 的三项 Lao 字母测试。
2. 用 PostgreSQL 套件验证查询、选择快照、批量任务、worker 和审计边界。
3. 具备真实环境后，以 `test-cases.md` 的步骤用 `playwright-cli` 复跑；记录截图、请求标识和缺陷。

## 已知限制

本轮没有环境地址以外的部署信息或账号。`playwright-tests/` 中的三个旅程模板以跳过方式防止在缺少真实环境时制造假阳性；Phase 8B 应优先运行已存在、含确定 Mock 的 `apps/admin/e2e/content-management.spec.ts`，真实环境就绪后再解除模板的环境保护。
