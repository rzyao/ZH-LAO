# ZH-LAO 文档中心

`PROJECT.md` 是仓库级项目知识总入口；本站按文档职责进入。

- [产品](product/product-overview.md)：产品定位、范围、业务模型与功能开放规则。
- [架构](architecture/index.md)：长期系统结构、领域边界、应用架构、基础设施与数据架构。
- [领域设计](domains/index.md)：十一个正式领域当前有效的业务模型、流程、状态机、契约与数据设计。
- [开发](development/index.md)：开发流程控制、任务边界、执行简报、实现蓝图、Gate、报告与进度证据。
- [治理](governance/design-register.md)：设计决策台账、未决事项、文档规范与来源覆盖。
- [ADR](adr/index.md)：架构决策的历史背景、取舍与长期裁决记录。

## 文档职责

```text
product/       产品为什么存在、提供什么价值
architecture/  系统长期如何组织
 domains/      各领域当前最终是什么
 development/  当前如何开发、开发到哪里
 governance/   如何治理设计事实与未决事项
 adr/          为什么作出重要架构决策
```

历史链接可能通过极小的迁移入口继续可访问，但新的文档和导航必须引用当前 canonical 路径，不再主动引用已迁移的旧页面。

仓库维护规则见根文档目录的 `AGENTS.md`。实现者不得把历史讨论、`deferred` 设想或未冻结设计自行解释成当前契约。
