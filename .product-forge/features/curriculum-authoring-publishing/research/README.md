# Research Index：课程编排与发布

> Feature: `curriculum-authoring-publishing` · 输入完整度：8/8 · 模式：CONFIRM（用户提供了范围、排除项、权威顺序和门禁规则）
> 研究维度：仓库权威、数据库、代码、Feature 重叠、迁移风险。按用户要求未做脱离项目事实的竞品、UX、技术选型或 ROI 发散。

## 执行摘要

课程域的层级、可见性、Content Revision 生命周期、API 形状和 UUID 规则均已有上游事实。现实实现仍只覆盖语言知识的工作流和老挝字母管理；课程编排、管理端课程体验和学习端课程读取均未实现。研究定位到两个需 owner 接受的权威缺口：Course/Lesson 的 published pointer/current-view 模型，以及 LessonItem 的 revision 固定位置。

## 关键发现

| 维度 | 结论 |
|---|---|
| 权威 | Course → Unit → Lesson → LessonSection → LessonItem 固定；Content 拥有课程与 revision，Learning 只消费。 |
| 数据库 | 课程五表与 revisions 已真实存在于冻结迁移；没有课程/课节 published/working revision 指针。 |
| 后端 | 可复用知识 revision、授权、审计和公开投影模式；课程 aggregate use case/route/repository 尚未存在。 |
| Admin | 可复用 Content structured UI、TanStack Query 与 DataTable；没有课程页面或编排器。 |
| Mobile | 仅存在 alphabet published-only 读取；没有课程读取。 |
| 风险 | 已有 Content/Admin Feature 的文件级重叠；迁移只能前向，且必须先关闭 ADP-001/002。 |

## 研究文档

- [authority-and-gap-analysis.md](authority-and-gap-analysis.md) — 权威链、数据真实情况、MVP 与权限决策包。
- [codebase-analysis.md](codebase-analysis.md) — 三端实现盘点、可复用模式与未实现能力。
- [overlap-and-migration-risk.md](overlap-and-migration-risk.md) — Feature 冲突、迁移风险与 authority decision package。
- [digest.md](digest.md) — 下阶段手册。

## 是否建议进入 Product Spec

**有条件建议。** 产品目标、范围和权威边界足够进入 Product Spec 的用户流程设计；但 Product Spec 必须把 ADP-001/002 标为阻塞性 authority decision，不能自行定义课程 published pointer、snapshot 格式、LessonItem revision pin 或新增公开 API。建议先取得相应 owner 的接受，再启动 Product Spec，避免生成不可桥接的规格。
