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

Feature 不物理放入某个 Domain 目录。真实路径统一为：

```text
docs/docs/features/<feature>/
```

Domain 可以在自己的概览和侧边栏链接相关 Feature，这只是导航关系，不改变文件或事实所有权。

## 二、Feature 元数据

每个正式 Feature 推荐在 frontmatter 中声明：

```yaml
feature_id: login
feature_type: single-domain
primary_domain: identity
participating_domains: []
```

跨领域功能示例：

```yaml
feature_id: audio-production
feature_type: cross-domain
primary_domain: audio
participating_domains:
  - content
  - operations
```

字段含义：

| 中文名称 | 技术字段 | 说明 |
| --- | --- | --- |
| 功能编号 | `feature_id` | 稳定英文 slug |
| 功能类型 | `feature_type` | `single-domain` 或 `cross-domain` |
| 主要领域 | `primary_domain` | 主要业务协调领域 |
| 参与领域 | `participating_domains` | 其它提供能力的正式 Domain |

`primary_domain` 不表示其它领域从属于它，也不得改变 canonical ownership。

## 三、标准结构

每个 Feature 至少回答：

1. **用户 / 运营目标**：谁要完成什么结果。
2. **入口与流程**：从哪里开始，到什么结果结束。
3. **范围**：本 Feature 包含和不包含什么。
4. **主要领域与参与领域**：链接到 `/domains/` authority，并说明每个 Domain 的职责。
5. **Backend 能力**：链接到 Backend/Public Contract/Task。
6. **Admin 页面**：适用时链接对应页面/工作流实施入口。
7. **Mobile 页面**：适用时链接对应 Screen/Flow 实施入口。
8. **跨域与基础设施**：只列依赖和 ownership，不复制内部实现。
9. **验收场景**：端到端 Given / When / Then 或等价可验证结果。
10. **交付矩阵**：各轨 Gate/状态与最终 Feature Gate。

## 四、双向索引

Feature 必须链接涉及的 Domain；Domain 在存在正式 Feature 文档时，也应在概览中维护“参与的产品功能”。

推荐关系：

```text
Domain
→ 领域能力地图
→ 参与的产品功能

Feature
→ primary_domain
→ participating_domains
→ 各领域职责
```

详细关系模型见 [领域能力与产品功能关系模型](/domains/FEATURE_RELATIONSHIP_MODEL)。

## 五、禁止复制

Feature 页面不得保存：

- 完整数据库字段定义；
- 完整 API request/response schema；
- Domain 状态机 authoritative 定义；
- Public Contract 正文；
- Blueprint 伪代码；
- 第二份业务规则。

这些事实只链接原 authority。

## 六、Feature Gate

Feature Gate 是消费者/E2E 验收结果，不得覆盖下游依赖的 Domain/Backend/Admin/Mobile Gate。

推荐状态：

```text
PLANNED
DESIGN_READY
IMPLEMENTING
INTEGRATION_PENDING
E2E_VALIDATING
BLOCKED
DELIVERED
```

只有所有 required track 都满足并通过端到端验收后，才能标记 `DELIVERED`。

## 七、命名

目录使用稳定英文 slug，例如：

```text
features/login/
features/audio-production/
features/send-gift/
```

页面标题和导航尽量使用中文。
