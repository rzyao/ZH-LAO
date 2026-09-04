# Phase Digest：产品规格

## 关键决定

- 使用者为拥有 `operations.operators.create` 的后台管理员。
- 只覆盖一个核心旅程 `JRN-001`：创建独立后台登录账号和 Operator 映射。
- 不再输入 UUID；后台账号与 Mobile 注册独立；角色不自动分配。
- CR-001：初始密码由系统随机生成，仅在成功当次显示并支持复制；关闭后不可再次读取。
- 已收集 Admin 的 Dialog、FormField、Input、Button 与 Token 清单。

## 产出

- `product-spec.md`：7 项需求、5 个验收场景、范围和安全要求。
- `journeys/journeys.yml`：E2E 旅程及 P0 边界场景。
- `wireframes/wireframe-create-admin-operator.html`：基础 HTML 线框图。
- `mockups/component-map.yml`：界面到现有组件与代码路径的映射。
- `../design-system/manifest.yml`：只读设计系统清单。

## 开放风险

- 现有公共 HTTP 契约尚无“创建后台账号并建立 Operator”的真实端点。技术方案必须先定义并确认 Identity → Operations 编排边界，不能通过跨域 SQL 或内部 Repository 绕过。

## 交接

- 技术方案须把 FR-003 的原子性、错误语义、审计责任和密码处理映射到真实 API 契约。
- traceability 已建立 US → JRN → CMP；API 列待真实契约生成后补齐。
