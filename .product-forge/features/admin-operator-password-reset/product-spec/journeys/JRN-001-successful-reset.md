# JRN-001：授权管理员成功重置其他操作员密码

**Actor：** 持有精确权限的 active 后台操作员。  
**前置条件：** 目标为另一个 active Operator；若目标持有 `super_admin`，actor 同样持有该角色。

| Step | Action | Expected result | Component / contract |
| --- | --- | --- | --- |
| STEP-001 | 在目标操作员行选择“重置密码” | 打开带目标名称和会话失效警示的确认对话框 | CMP-ConfirmDialog |
| STEP-002 | 读取影响说明 | 可见“旧密码失效、全部会话结束、密码仅显示一次” | CMP-ConfirmDialog |
| STEP-003 | 确认重置 | 按钮进入加载并禁止重复提交 | CMP-Button / API-RESET |
| STEP-004 | 服务端成功响应 | 凭证、会话和成功审计已一起提交 | API-RESET |
| STEP-005 | 复制并关闭结果 | 临时密码仅显示在结果 Dialog；关闭后从组件内存清除 | CMP-Dialog / CMP-Button |

**EDGE-001（P0）：** Given 凭证、会话或审计任一步失败，When 命令结束，Then 全部回滚且不显示密码。  
**EDGE-002（P1）：** Given 目标首次以临时密码登录，When 认证成功，Then 只可完成改密后继续。
