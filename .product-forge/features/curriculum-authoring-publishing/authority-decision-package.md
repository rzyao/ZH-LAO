# Authority Decision Package：课程编排与发布

> Feature: `curriculum-authoring-publishing`  
> Submitted: 2026-09-05  
> Status: `accepted`  
> Requested owner scope: Content Domain / Architecture / Database and API Contract owners

## Purpose

此包记录 Research 发现的两处上游事实缺口及拥有者裁决。裁决已由 ADR-029、Content 领域/数据库/版本页面和 Content contracts 接受；冻结 migration 仍未修改，物理落地留给后续前向 migration。

## ADP-001 — Course/Lesson current published revision 模型

### Exact conflict

| Source | Exact fact |
|---|---|
| `docs/docs/developer/reference/domains/content/versioning-review.md` §3.1 | 内容主实体维护 `published_revision_id` 与 `working_revision_id`；发布在一个事务内切换指针。 |
| `database/migrations/0400_content.sql` | `content.courses` 没有 `published_revision_id` / `working_revision_id`；`content.lessons` 同样没有，仅有 `status` 和 `published_at`。 |
| `docs/docs/developer/reference/contracts/content/CONTENT_PUBLIC_CONTRACTS.md` §§4–6 | public current 与 trusted history 需要能区分当前已发布视图和 immutable revision。 |

### Decision requested

确认 Course 与 Lesson 的 current/working revision 的物理表达、course aggregate snapshot 的边界，以及 public current / trusted history 的唯一读取规则和事务边界。

### Owner options (no recommendation)

1. 以新前向 migration 增加 Course/Lesson revision pointers，并把指针切换作为唯一的 current published view。
2. 明确唯一 `content_revisions.status='published'` 行就是 current view，并对结构 snapshot、锁与 runtime read 作完整权威定义；相应修订 pointer 表述。
3. 选择另一模型，并同步修改拥有该事实的 Domain / Architecture / Database / API authority。

### Acceptance criteria

- 不修改 `0400_content.sql`、`1240_content_revision.sql` 或 `1290_content_revision_review_workflow.sql`。
- 明确 Course 与 Lesson 独立发布、修订、supersede、撤回批准和并发行为。
- 明确 current public view 只能读合法 published revision，历史固定 revision UUID 不可被后续发布回写。
- 明确一个 DB transaction 覆盖 revision 状态、current view、旧 published revision supersede 与审计/事件边界。

## ADP-002 — LessonItem 引用 revision 的固定位置

### Exact gap

| Source | Exact fact |
|---|---|
| `docs/docs/developer/reference/domains/content/curriculum.md` §1.2 | 编排只存引用，不复制本体；课程调整和词条版本发布解耦。 |
| `docs/docs/developer/reference/contracts/content/CONTENT_PUBLIC_CONTRACTS.md` §§4、6、7 | trusted history 按 immutable revision UUID 解析；Learning 保存的 revision UUID 必须保持历史快照。 |
| `database/migrations/0400_content.sql` | `content.lesson_items` 只有 `content_id` / `exercise_id` 内部 FK，无 revision UUID。 |

### Decision requested

确定 Course/Lesson revision snapshot 是否是 LessonItem 引用的唯一 revision pin 载体；如果不是，确定必须新增的 logical UUID 字段、写入时机、校验规则与 public DTO 语义。

### Acceptance criteria

- 引用必须指向合法 published Content/Exercise revision，不能引用 draft、pending-review、rejected 或 internal BIGINT。
- 不复制内容、答案或语言知识；不把进度/历史事实写进 Content。
- 词条后续发布不自动改变已发布课程编排，也不改变已固定的 Learning 历史。
- 若需 schema 变化，只能批准新的前向 migration；若需 HTTP 变化，先更新相应 frozen Content contract。

## Downstream impact after acceptance

接受后，Product Spec 才可把该决策转译为 Course/Unit/Lesson/Section/Item 编排故事、审核发布状态机、并发/幂等验收、Admin UI 和 Mobile published-only 阅读的 Spec Kit requirement。任何未被接受的选项不得进入 spec、plan、tasks 或代码。
