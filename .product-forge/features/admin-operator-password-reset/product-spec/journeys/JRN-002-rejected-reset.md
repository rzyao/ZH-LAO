# JRN-002：越权或不符合资格的重置被拒绝

**Actor：** 已登录后台操作员。  
**前置条件：** actor 试图执行不满足资格规则的重置。

| Step | Action | Expected result | Component / contract |
| --- | --- | --- | --- |
| STEP-006 | 在受限目标上尝试重置 | UI 隐藏或禁用无权限入口；服务端仍独立校验 | CMP-Button / API-RESET |
| STEP-007 | 服务端校验 actor 与目标 | 返回安全、稳定错误，不更改凭证、会话或审计 | API-RESET / CMP-Toast |

**EDGE-003（P0）：** Given actor 无 `operations.operators.reset_password`，When 直接调用 API，Then 拒绝。  
**EDGE-004（P0）：** Given actor 等于目标，When 调用 API，Then 拒绝且无副作用。  
**EDGE-005（P0）：** Given 目标为 `super_admin` 而 actor 不是，When 调用 API，Then 拒绝且不泄露秘密。
