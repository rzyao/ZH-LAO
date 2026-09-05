# Wireframes：课程编排与发布

## Course list

`PageHeader` + `CMP-DataTable` 展示语言、标题、availability、working revision 状态、更新时间；`CMP-Button` 创建课程。必须支持 loading、empty、permission-denied 与 stale reload 状态。

## Course editor

`CMP-EditPageLayout` 包含课程基础信息、可排序的 Unit/Lesson/Section/Item 树、已发布 revision 引用选择与保存栏。保存失败精确标出非法 Item 位置；不展示任何内部 ID。

## Revision review

`CMP-StatusBadge` 展示 draft/pending_review/approved/published/rejected/superseded；按权限显示 submit、approve、reject、re-edit、publish。发布通过 `CMP-ConfirmDialog` 二次确认，失败保留当前状态并展示安全错误。

## Mobile reader

课程 catalog、structure 和 lesson content 只渲染 runtime published DTO；没有合法 current published view 时使用 empty/not-public state，不能提供 includeDraft 开关。
