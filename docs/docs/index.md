---
status: active
last_updated: 2026-09-02
---

# ZH-LAO 文档中心

如果你是第一次接触项目，请先阅读 **[ZH-LAO 产品开发全景](developer/)**。它用非技术语言介绍产品画像、用户旅程、当前状态以及怎样参与开发。

如果你要同时了解产品画像、用户旅程、功能地图和真实开发状态，请进入 **[ZH-LAO 产品开发全景](developer/)**。它是面向人的开发者中心入口，不取代下方各类事实源。

`docs/AGENTS.md` 是 AI 文档规则入口；下面的分类用于查找更详细的专业文档。

- [产品](developer/reference/product/product-overview.md)：产品定位、范围、业务模型、首发后 12 个月业务规划与功能开放规则。
- [架构](developer/reference/architecture/index.md)：长期系统结构、领域边界、应用架构、基础设施与数据架构。
- [领域设计](developer/reference/domains/index.md)：十一个正式领域当前有效的业务模型、流程、状态机、契约与数据设计。
- [功能](developer/features/index.md)：把领域能力、后端、后台、移动端和跨域集成组合成可交付的用户/运营能力。
- [开发方式](developer/development-workflow.md)：产品全景、Spec Kit、代码/测试/CI 证据之间的当前职责分工。
- [产品开发全景](developer/index.md)：按产品、旅程、能力和交付状态组织的统一开发阅读入口。
- [治理](developer/reference/governance/design-register.md)：设计决策台账、未决事项、文档规范与来源覆盖。
- [ADR](developer/reference/adr/index.md)：架构决策的历史背景、取舍与长期裁决记录。

> 想判断某项功能现在是否真的可用，请查看[交付状态](developer/delivery-status.md)及各功能页的证据，不要仅根据产品规划或 Spec Kit 作出判断。

## 文档职责

```text
developer/     面向人的产品开发全景、功能目录与参考事实源
specs/         Spec Kit 需求工件（不作为实现证据）
```

产品层的阅读顺序为：[产品定位与范围](developer/reference/product/product-overview.md) → [业务与商业模型](developer/reference/product/business-model.md) → [首发后 12 个月业务规划](developer/reference/product/business-plan.md) → [功能开放与规则](developer/reference/product/feature-rollout.md)。

其中：

```text
Domain defines truth.
Backend implements domains.
Admin / Mobile implement experiences.
Feature connects them into deliverable value.
```

历史文档仍保留在 Git 历史中；新的文档和导航必须引用当前 canonical 入口，不再主动扩展已退役的功能目录。
