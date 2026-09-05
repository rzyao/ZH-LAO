---
status: frozen
last_updated: 2026-09-05
---

# ADR-029：课程与课节的 Revision Published View

**状态：** `已接受`

**日期：** `2026-09-05`

**相关：** [ADR-007 统一课程分层](ADR-007-unified-curriculum-hierarchy.md)、[ADR-018 全局数据库原则](ADR-018-global-database-design-principles-final.md)、[ADR-021 Content/Learning 拆分](ADR-021-content-and-learning-domain-split.md)、[Content 课程编排](../domains/content/curriculum.md)、[Content 版本复核](../domains/content/versioning-review.md)、[Content 数据库](../domains/content/database.md)、[Content API](../contracts/content/CONTENT_API.md)。

## 背景

课程和课节属于 Content 的 canonical 教学内容，必须走不可变 Content Revision 审核发布生命周期；Learning 只消费合法 published revision 并保存历史 revision UUID。冻结 `0400_content.sql` 已有 Course/Unit/Lesson/Section/Item 五级结构，`1240`/`1290` 已有 Content Revision 审核工作流，但 Course/Lesson 主表尚无当前正式或工作 revision 指针，LessonItem 也没有 revision pin 字段。

若由运行时“取最新 published revision”或 LessonItem 当前内容解析来推断正式视图，发布切换不能证明原子性，课程编排会被词条后续发布隐式改变，Learning 历史也失去稳定快照。

## 决策

1. **Course 与 Lesson 都是 revisioned aggregate root。** 二者分别维护 `published_revision_id` 与 `working_revision_id`；字段是同一 `content.content_revisions` 表的域内 BIGINT FK，仅作内部持久化，所有 HTTP 与跨域接口仍使用 immutable UUID logical/public ID。
2. **只能以 `published_revision_id` 解析 current published view。** `content_revisions` 中的 `entity_type='course'|'lesson'`、`entity_id=<Course/Lesson public UUID>` 和 `status='published'` 是该 pointer 的必要一致性条件，不得以“最高 revision number”或实体 `status` 推断当前版本。trusted history 必须显式按 revision UUID 解析。
3. **Revision snapshot 固定编排和引用版本。** Course snapshot 固定 Unit 顺序与所含 Lesson UUID/revision UUID；Lesson snapshot 固定 Section/Item 顺序，知识或练习挂载写入被引用实体的 logical UUID 与已发布 revision UUID。snapshot 仅保存编排和引用，不复制知识文本、释义、答案或其他 canonical 本体。
4. **发布只能在一个 Content 事务中完成。** 事务锁定 aggregate root 与目标 revision，校验 `expectedLockVersion`、精确权限、幂等键、完整结构和所有引用的 published revision；随后发布目标、原子切换 pointer、supersede 旧 published revision、更新/清理 working pointer，并写 Operations 审计与 Content 发布事件。任一校验失败则整体回滚。
5. **实体状态不是 revision 审核真相。** 现有 Course/Lesson `status` 继续是 aggregate availability projection：无 published pointer 时为 `draft`，有合法 published pointer 时为 `published`，`archived` 阻止 public visibility；它与 revision review 状态不可混用。已发布实体创建新 working revision 时仍保持 `published`。Lesson 的 `published_at` 是首次/当前 aggregate publish projection，必须与 pointer 切换在同一事务维护。
6. **课程与知识生命周期解耦。** 课程/课节修改创建其自身 working revision，不创建词条新版本；词条或练习后续发布也不得修改课程的 published snapshot 或已保存的 Learning history revision UUID。
7. **仅新增前向 migration。** 不修改冻结 `0400_content.sql`、`1240_content_revision.sql` 或 `1290_content_revision_review_workflow.sql`。新 migration、API/contract 与代码必须按本 ADR 的 pointer/snapshot 语义一致实现。

## 后果

- 管理端可显示草稿、待审核、已批准、已发布及历史 revision；draft 不可直接发布。
- public runtime 只读取有合法 pointer 的 published aggregate snapshot；草稿、待审核、驳回及 archived 内容不得泄露。
- Unit 与 LessonItem 仍无 public identity，客户端不得接收其内部 BIGINT 或伪造 UUID。
- 新增数据库字段、snapshot schema 和课程 revision API 是后续 Feature 的实现工作，不是本 ADR 已实施证据。
