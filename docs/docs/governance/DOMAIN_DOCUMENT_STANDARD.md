# 文档系统与领域文档规范

**状态：ACTIVE / 文档治理规范**

本规范定义 ZH-LAO 文档的信息架构、中文显示规则、领域事实、功能交付以及 Backend / Admin / Mobile 三条实施轨的边界。

## 一、全站信息架构

```text
product/       产品层
architecture/  系统架构层
domains/       领域事实层
features/      功能交付层
development/   实施与证据层
governance/    设计治理层
adr/           架构决策记录
guide/         阅读与维护说明
```

### 1. `product/`

回答：为什么做、给谁用、提供什么价值、产品范围是什么。

### 2. `architecture/`

回答：系统长期如何组织。只保存跨领域、跨应用或基础设施级稳定结构。

### 3. `domains/`

回答：这个领域最终是什么。

领域设计按以下顺序组织：

```text
产品与范围
→ 业务设计 / 用例 / 工作流 / 状态机
→ 领域模型与事实所有权
→ 数据设计
→ API / Public / Cross-domain / Event Contract
→ 权限 / 安全 / 事务 / 并发 / 幂等 / 审计
```

数据库不是产品设计起点。必须先明确业务，再推导领域事实和数据模型。

### 4. `features/`

回答：用户或运营人员最终能完成什么。

Feature 是**横向交付地图**，不是第二份产品、领域、API 或数据库事实源。它只引用 authoritative 文档并组织端到端验收。

例如：登录、完成一课、音频生产、发现用户、发送消息、购买礼物、举报用户、后台审核。

### 5. `development/`

回答：当前如何实施、做到哪一步、证据是什么。

正式实施轴：

```text
development/backend/   领域驱动
development/admin/     页面 / 运营工作流驱动
development/mobile/    页面 / 用户流程驱动
development/workflow/  Task / Claim / Gate / Handoff 控制面
```

## 二、Domain Capability 与 Product Feature

必须明确区分：

```text
Domain Capability
= 某个领域稳定拥有的业务能力

Product Feature
= 用户或运营人员能够完成的端到端产品能力
```

它们是二维关系，不是目录父子关系。

### Domain 应回答

```text
我拥有哪些稳定业务能力？
我作为主要领域参与哪些 Feature？
我作为参与领域服务哪些 Feature？
```

当正式 Feature 已存在时，Domain 概览应维护：

```text
领域能力地图
参与的产品功能
```

### Feature 应回答

每个正式 Feature 推荐声明：

```yaml
feature_id: <slug>
feature_type: single-domain | cross-domain
primary_domain: <domain>
participating_domains: []
```

`primary_domain` 表示主要业务协调领域，不表示其它 Domain 从属于它，不改变 canonical ownership。

### 物理目录规则

Feature 始终保存在：

```text
docs/docs/features/<feature>/
```

不得复制到：

```text
domains/<domain>/features/
```

Domain 页面和侧边栏可以直接链接 `/features/<feature>/`，这只是导航别名，不是文件所有权。

详细规则见 [领域能力与产品功能关系模型](/domains/FEATURE_RELATIONSHIP_MODEL) 与 [功能文档规范](/features/FEATURE_DOCUMENT_STANDARD)。

## 三、Backend / Admin / Mobile 的组织规则

### Backend：领域驱动

后端实施单位默认是 Domain 或 Domain capability：

```text
development/backend/identity/
development/backend/content/
development/backend/learning/
development/backend/audio/
```

Backend 不按“登录页、聊天页、订单页”拆 Domain ownership，也不得按数据库表生成 CRUD 目录。

### Admin：页面与运营工作流驱动

后台目录以运营人员看到的页面、工作台或完整工作流组织：

```text
development/admin/access-control/
development/admin/platform-control/
development/admin/content-management/
development/admin/audio-production/
```

一个 Admin 工作台可以消费多个 Domain，但不能因此取得这些 Domain 的 canonical ownership。

### Mobile：页面与用户流程驱动

移动端以 Screen、Flow、Journey 组织：

```text
development/mobile/auth/
development/mobile/learning/
development/mobile/discovery/
development/mobile/chat/
```

前端目录不得机械照抄 Domain、数据库表或后端 Repository 结构。

## 四、Feature 的正确职责

Feature 负责把以下内容串成一个可交付能力：

```text
用户 / 运营目标
→ 用户流程
→ 主要领域 / 参与领域
→ Backend capability
→ Admin / Mobile experience
→ Cross-domain / Infrastructure
→ E2E acceptance
→ Feature Gate
```

Feature 文档禁止复制：

- 数据库字段清单；
- 完整 API schema；
- Domain 状态机定义；
- Public Contract 正文；
- Implementation Blueprint；
- 第二份业务规则。

这些内容必须链接到原 authority。

## 五、Authority 规则

```text
产品事实       → product/ 或 authoritative Domain product semantics
领域事实       → domains/
物理数据库事实 → frozen migration + Domain 数据设计
机器规格       → development/specs/
任务范围       → Task Manifest + Execution Brief
实现 HOW       → Implementation Blueprint
完成事实       → Gate / Audit / Implementation Report + tests/CI
功能交付状态   → features/ 的 derived delivery view
```

Feature Gate 不能覆盖 Domain Gate；UI 页面文档不能修改 API/Public Contract；Backend 文档不能反向决定产品应该有什么功能。

## 六、中文显示规则

面向人的内容默认中文：

- 顶部导航与侧边栏；
- 页面/章节标题；
- 表格列名；
- 业务状态说明；
- 字段的人类名称。

技术标识保持原值：

- schema / table / column；
- JSON/API 字段；
- HTTP method/path；
- TypeScript symbol；
- event type；
- permission key；
- Requirement ID / Gate ID；
- 文件路径、commit SHA、枚举值。

字段推荐双名称：

| 中文名称 | 技术字段 | 类型 | 说明 |
| --- | --- | --- | --- |
| 用户编号 | `user_id` | UUID | Identity 稳定逻辑编号 |
| 当前状态 | `status` | string | 当前业务状态 |

Domain 显示采用“中文优先 + 英文技术名”，例如“身份（Identity）”。

## 七、导航层级

1. 顶部导航按文档大类划分。
2. 每个区域拥有独立 sidebar。
3. 领域侧边栏按 11 个正式 Domain 折叠。
4. Domain 可以显示“相关功能”链接，但链接目标仍位于 `/features/`。
5. Backend 按 Domain 分组。
6. Admin / Mobile 按页面或工作流分组。
7. Feature 按用户/运营能力分组。
8. 左侧侧边栏原则上最多三级；页面内部章节交给右侧 outline。
9. ADR 不逐条常驻侧边栏，只保留索引入口。

## 八、实施文档路径

新任务从本规范启用后使用：

```text
Backend:
docs/docs/development/backend/<domain-or-capability>/

Admin:
docs/docs/development/admin/<page-or-workflow>/

Mobile:
docs/docs/development/mobile/<flow-or-screen-group>/
```

Task Manifest、Brief、Blueprint、Report 的 path 必须与 track 一致。

## 九、非追溯迁移

历史 `development/01-foundation`～`development/07-audio` 与根目录 Foundation 文档已经形成 Gate/Report 引用链，因此不为了目录整齐批量搬迁。

从本规范启用后：

- 旧 Phase 目录只读，不再创建新实施工件；
- 新 Task 必须进入 `backend/`、`admin/` 或 `mobile/`；
- 历史 Task 发生 Recovery、实质设计变更或新版实施时，新工件进入新目录；
- 旧文件继续作为历史 evidence，不自动成为新 Task authority；
- 正常侧边栏只展示新入口，不再展示数字 Phase 目录。

这叫**非追溯迁移**：改变未来工作方式，但不破坏既有证据链。
