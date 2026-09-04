# JRN-001：管理员创建独立后台操作员账号

权威步骤与边界场景见 [journeys.yml](./journeys.yml)。

- 主体：具备 `operations.operators.create` 的后台管理员
- 前置：已登录；目标用户名未被使用
- 成功：后台账号与 active Operator 已创建，创建者可复制仅当次展示的初始密码，并可继续分配角色
- 待办：新 HTTP 契约尚未确定，因此步骤中的 contract 保持 `pending`，由技术方案阶段落到真实契约工件。
