# 功能文档规范

Feature 文档是端到端交付地图，不是新的 canonical 业务事实源。

## 一、Feature 与 Domain Capability

必须区分：

```text
Domain Capability
= 某个领域稳定拥有的业务能力

Product Feature
= 用户或运营人员能够完成的端到端产品能力
```

一个 Domain 可以服务多个 Feature；一个 Feature 也可以跨多个 Domain。

Feature 不物理放入某个 Domain 目录。正式 Feature 文档路径统一为：

```text
docs/docs/features/<feature>/
```

Domain 可以在自己的概览和侧边栏链接相关 Feature，这只是导航关系，不改变文件或事实所有权。

## 二、Feature Inventory 与正式 Feature 文档

AI 开发阶段矩阵必须尽可能完整记录已经从仓库事实识别出的产品能力，包括：

```text
active
planned
deferred
unresolved
```

但：

```text
Feature Inventory Row
≠
必须立即创建 Feature Markdown
```

只有当 Feature 正式进入设计/实施，或已经存在稳定交付事实需要说明时，才建立 `/features/<feature>/` 文档。

禁止为了“目录完整”创建空白、重复或没有 authority 的 Feature 页面。

完整进度查看 [AI 开发阶段矩阵](/development/DOMAIN_LIFECYCLE_MATRIX)。

## 三、Feature 元数据

正式 Feature 推荐声明：

```yaml
feature_id: login
feature_type: single-domain
primary_domain: identity
participating_domains: []
```

跨领域示例：

```yaml
feature_id: audio-production
feature_type: cross-domain
primary_domain: audio
participating_domains:
  - content
  - operations
```

矩阵 Inventory 额外维护：

```text
portfolio_status = active | planned | deferred | unresolved
```

| 状态 | 说明 |
| --- | --- |
| `active` | 已进入正式设计/实施/交付 |
| `planned` | 已识别且属于当前产品能力，但尚未启动正式 Task |
| `deferred` | 仓库明确延期，不进入当前开发主链 |
| `unresolved` | 产品范围或 Domain Contract 尚需裁决 |

`primary_domain` 不表示其它领域从属于它，也不得改变 canonical ownership。

没有单一业务 Domain owner 的系统级体验可以在矩阵中使用 System parent；一旦建立正式 Feature 文档，仍必须明确它消费哪些 Domain/Infrastructure authority。

## 四、标准结构

每个正式 Feature 至少回答：

1. **用户 / 运营目标**；
2. **入口与完整流程**；
3. **范围与明确不包含项**；
4. **主要领域与参与领域**；
5. **Backend 能力**；
6. **Admin 页面**（适用时）；
7. **Mobile 页面**（适用时）；
8. **跨域与基础设施依赖**；
9. **验收场景**；
10. **交付矩阵与 Feature Gate**。

Feature 只链接原 authority，不复制 Domain 事实。

## 五、双向索引

```text
Domain
→ 领域能力地图
→ 参与的产品功能

Feature
→ primary_domain
→ participating_domains
→ 各领域职责

AI Stage Matrix
→ 全量 Feature Inventory
→ 每个 Feature 的 AI Prompt Stage
```

详细关系模型见 [领域能力与产品功能关系模型](/domains/FEATURE_RELATIONSHIP_MODEL)。

## 六、禁止复制

Feature 页面不得保存：

- 完整数据库字段定义；
- 完整 API request/response schema；
- Domain 状态机 authoritative 定义；
- Public Contract 正文；
- Blueprint 伪代码；
- 第二份业务规则。

## 七、Feature Gate

Feature Gate 是消费者/E2E 验收结果，不得覆盖 Domain/Backend/Admin/Mobile Gate。

推荐交付状态：

```text
PLANNED
DESIGN_READY
IMPLEMENTING
INTEGRATION_PENDING
E2E_VALIDATING
BLOCKED
DELIVERED
```

只有所有 required track 满足并通过端到端验收后，才能标记 `DELIVERED`。

## 八、Deferred / Unresolved

明确延期能力必须保留在 Inventory 中，并以：

```text
⏸ 延期
```

显示，而不是删除行或伪装为未开始。

产品文档与冻结 Domain Contract 冲突时，以：

```text
⛔ 待裁决
```

保留可见性，并记录明确的 decision blocker；不得由文档维护者自行选择一边作为新产品事实。

## 九、命名

目录使用稳定英文 slug，例如：

```text
features/login/
features/audio-production/
features/send-gift/
```

页面标题和导航使用中文优先。
