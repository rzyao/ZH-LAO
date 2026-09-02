---
status: active
last_updated: 2026-09-02
---

# ZH-LAO 文档中心

如果你是第一次接触项目，请先阅读 **[ZH-LAO 项目说明书](guide/project-guide.md)**。它用非技术语言介绍项目是什么、目前做到哪里以及怎样在本机查看。

`PROJECT.md` 是面向研发流程和 AI 的仓库级知识入口；下面的分类用于查找更详细的专业文档。

- [产品](product/product-overview.md)：产品定位、范围、业务模型、首发后 12 个月业务规划与功能开放规则。
- [架构](architecture/index.md)：长期系统结构、领域边界、应用架构、基础设施与数据架构。
- [领域设计](domains/index.md)：十一个正式领域当前有效的业务模型、流程、状态机、契约与数据设计。
- [功能](features/index.md)：把领域能力、后端、后台、移动端和跨域集成组合成可交付的用户/运营能力。
- [开发](development/index.md)：Backend、Admin、Mobile 三条实施轨及 Workflow、Spec、Blueprint、Gate、Report 与进度证据。
- [治理](governance/design-register.md)：设计决策台账、未决事项、文档规范与来源覆盖。
- [ADR](adr/index.md)：架构决策的历史背景、取舍与长期裁决记录。

> 想判断某项功能现在是否真的可用，请查看[开发进度](development/DEVELOPMENT_PROGRESS.md)，不要仅根据产品规划或 Spec Kit 作出判断。

## 文档职责

```text
product/       产品为什么存在、提供什么价值
architecture/  系统长期如何组织
domains/       各领域当前最终是什么
features/      用户或运营人员最终能完成什么
development/   各实施轨如何开发、开发到哪里
governance/    如何治理设计事实与未决事项
adr/           为什么作出重要架构决策
```

产品层的阅读顺序为：[产品定位与范围](product/product-overview.md) → [业务与商业模型](product/business-model.md) → [首发后 12 个月业务规划](product/business-plan.md) → [功能开放与规则](product/feature-rollout.md)。

其中：

```text
Domain defines truth.
Backend implements domains.
Admin / Mobile implement experiences.
Feature connects them into deliverable value.
```

历史链接可能通过旧路径继续可访问，但新的文档和导航必须引用当前 canonical 入口，不再主动扩展旧 Phase 目录。
