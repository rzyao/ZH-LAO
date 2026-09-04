# 最终核验报告：后台操作员账号创建

日期：2026-09-04
模式：Lite（经用户确认不生成 `spec.md` 与 `tasks.md`）
结论：**通过，但有两项流程警告。**

## 汇总

| 状态 | 数量 |
| --- | ---: |
| ❌ Critical | 0 |
| ⚠️ Warning | 2 |
| ✅ Passed | 10 |
| ⏭️ Skipped | 0 |

## 已通过的核验

| 核验项 | 证据 |
| --- | --- |
| 不再由创建者输入 UUID | `TC-HTTP-002`：旧 `auth_subject_id` 请求被拒绝且不进入编排。 |
| 独立后台账号与 Operator 编排 | `TC-UNIT-001`：Identity 与 Operations 写入端共用同一个事务 executor。 |
| 真实数据库原子回滚 | `TC-INT-001` 在本机 PostgreSQL 通过：审计写入失败后，Identity 凭据和 Operator 均未留存。 |
| 成功响应与初始密码防缓存 | `TC-HTTP-001`：仅接收用户名/显示名称，返回 `initial_password`，并设置 `Cache-Control: no-store` / `Pragma: no-cache`。 |
| 重复用户名 | `TC-HTTP-004`：返回 `ADMIN_USERNAME_CONFLICT`，不会暴露初始密码。 |
| 无创建权限 | `TC-HTTP-003`：返回 `FORBIDDEN`，不调用创建编排。 |
| 一次性密码界面 | `TC-UI-001`：当前弹窗展示并可复制；关闭、再打开后不再显示。 |
| 跨域认证与即时撤权 | 更新后的 Operations E2E 在本机 PostgreSQL 通过：创建独立账号、签发身份令牌、分配角色、即时撤销权限均被验证。 |
| 类型与后端回归 | Backend/Admin typecheck 通过；Backend 非集成回归 46 个文件、179 项测试通过。 |
| 文档质量 | `docs:audit`、`docs:lifecycle-audit`、`docs:build` 均通过。 |

## Warnings

### WARNING-001：Lite 追溯矩阵未使用标准 rows[]

追溯性脚本通过，且 3 个 P0 边界及每个旅程步骤都有测试绑定；但 Lite 流程没有 `spec.md`/`tasks.md`，矩阵未使用标准 `rows[]`。这是用户确认的流程例外。

### WARNING-002：未执行浏览器级 Playwright 冒烟

创建弹窗的一次性密码行为已由 React 组件测试覆盖；本次未启动浏览器级 Playwright。后端跨域 HTTP E2E 与真实 PostgreSQL 回滚已实际执行。

## 结论

此前 F-001/F-002 均已解决。实现符合“独立后台账号、系统随机初始密码、仅当次可复制、随后分配角色”的目标。

建议确认以上两项流程警告后，将 `verify` 标记为 completed。
