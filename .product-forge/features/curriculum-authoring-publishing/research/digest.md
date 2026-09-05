# Research — Digest

> **Feature:** curriculum-authoring-publishing
> **Phase:** research
> **Generated at:** 2026-09-05T00:00:00+08:00
> **Artifact owner:** speckit.product-forge.research

## Diff since last approved state

Initial version — no prior state.

## Key decisions

- 使用标准模式、gated 流程与 classic Spec Kit；Research 后必须由用户门禁，不自动推进。
- Problem Discovery 为 not_applicable：课程问题已有上游 Content authority 且用户已明确确认。
- Course → Unit → Lesson → Section → Item 属于 Content；课程编排只保存引用与排序，不能复制知识。
- 已发布课程/课节的修改必须派生工作 revision，不能绕过审核；学习历史使用固定 revision UUID。
- ADP-001/002 是后续规格的 authority blocker，不能由 Product Forge 或代码推断解决。

## Artifacts produced

- `research/authority-and-gap-analysis.md` — 权威约束、数据库事实、MVP 和两个决策缺口。
- `research/codebase-analysis.md` — 三端可复用实现与未实现范围。
- `research/overlap-and-migration-risk.md` — 现有 Feature 重叠、冻结迁移风险和 decision package。
- `research/README.md` — 调研索引与是否进入 Product Spec 的结论。

## Open risks

- Unmitigated HIGH: Course/Lesson 缺少已发布 revision 指针或等价 current-view 的权威落地（ADP-001）。
- Unmitigated MEDIUM: LessonItem 对引用内容/练习 revision 的固定位置未裁决（ADP-002）。
- Mitigated by scope: 仅定义最小只读学习端闭环，排除进度、答题、推荐、付费与社交。

## Handoff notes for next phase

- Product Spec 只能在 ADP-001/002 得到 owner 接受后，把已批准模型编译为故事、状态机和验收条件。
- 后续实现需复用 Content/Operations 边界、UUID DTO、并发令牌、审计和现有设计系统；不得修改冻结迁移或恢复其他 Feature。
