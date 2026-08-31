# 功能文档规范

Feature 文档是端到端交付地图，不是新的 canonical 业务事实源。

## 标准结构

每个 Feature 至少回答：

1. **用户 / 运营目标**：谁要完成什么结果。
2. **入口与流程**：从哪里开始，到什么结果结束。
3. **范围**：本 Feature 包含和不包含什么。
4. **涉及领域**：链接到 `/domains/` authority。
5. **Backend 能力**：链接到 Backend/Public Contract/Task。
6. **Admin 页面**：适用时链接对应页面/工作流实施入口。
7. **Mobile 页面**：适用时链接对应 Screen/Flow 实施入口。
8. **跨域与基础设施**：只列依赖和 ownership，不复制内部实现。
9. **验收场景**：端到端 Given / When / Then 或等价可验证结果。
10. **交付矩阵**：各轨 Gate/状态与最终 Feature Gate。

## 禁止复制

Feature 页面不得保存：

- 完整数据库字段定义；
- 完整 API request/response schema；
- Domain 状态机 authoritative 定义；
- Public Contract 正文；
- Blueprint 伪代码；
- 第二份业务规则。

这些事实只链接原 authority。

## Feature Gate

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

## 命名

目录使用稳定英文 slug，例如：

```text
features/login/
features/audio-production/
features/send-gift/
```

页面标题和导航尽量使用中文。
