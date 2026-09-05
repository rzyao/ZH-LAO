# 课程编排与发布：Feature 重叠与迁移风险

> Feature: `curriculum-authoring-publishing` · 2026-09-05

## 正在进行或未关闭 Feature 的关系

| Feature | 状态盘点 | 重叠/风险 | 处理 |
|---|---|---|---|
| `chinese-lao-content-hierarchy` | 状态记录为 completed，但涉及 Content 模块、Admin Content、Mobile、数据库且仍有未关闭生命周期阶段 | 高：共享 Content revision、Admin Content 文件和 Content public read。 | 仅复用其已实现的语言知识模式；不恢复、继续或修改它的范围。后续计划必须做文件级合并协调。 |
| `admin-data-table-enhancement` | 状态记录为 completed，工作区仍有 Admin shared DataTable 与 Content table 改动 | 中：课程列表要求复用通用表格能力。 | 依赖其稳定接口；不在本 Feature 顺手重构 DataTable。 |
| `menu-drag-reparent` | plan in progress | 低到中：可能触及 Admin 路由/导航。 | 课程入口路由在实现前与该 Feature 协调，不覆盖同一 router/menu 文件。 |
| `admin-operator-account-creation` | completed | 低：共享 Operations / Identity public contracts。 | 只消费现有 operator/RBAC/audit 契约。 |
| `backend` | backfill, completed | 中：覆盖 backend 目录。 | 仅以当前代码为工程现实；不将 backfill 视为课程需求或权限。 |

工作树在调研时已有大量非本 Feature 修改（含 Content、Admin、database、docs）；本 Feature 未触碰这些文件。任何下一阶段写入都应只写 Feature 目录，实施前再做精确 diff 与文件所有权核查。

## 数据库迁移风险

- `0400_content.sql`、`1240_content_revision.sql` 是冻结历史基线，`1290_content_revision_review_workflow.sql` 已是合规的前向扩展；绝不修改或重写它们。
- 课程与 Lesson 表的 `status` / `published_at` 同 Content Revision 的 `published` 状态并存。未裁决的“双发布状态”语义会导致草稿泄露、错误读取或非原子发布。
- Unit、LessonItem 没有 public UUID；这是既有契约，并不自动构成缺陷。外部 DTO 不得伪造其 public ID 或暴露 BIGINT。
- LessonItem 目前保存内部 FK，不含 Revision UUID；若 stable published composition 需要显式 pin，则必须以 owner 接受的前向 migration 与 contract 决策落地。
- 写路径至少需要 root row lock、`expectedUpdatedAt` / `lock_version`、唯一排序约束、幂等键与 audit；批量 reorder/structure replace 必须在单一事务先完成全量验证再写入。

## Authority decision package

### ADP-001：课程和课节发布指针 / published-view 模型

**Decision requested:** 在不修改冻结迁移的前提下，确认 Course 与 Lesson 的 current/working revision 如何表示、课程 aggregate snapshot 的边界，以及 public current / trusted history 的读取规则。

**Why now:** 领域版本权威要求原子 pointer switch；物理课程表没有 pointer。若不先裁决，Product Spec 将无法写出可验证的数据库、API、状态机和事务要求。

**Options for owner (not a recommendation):**

1. 通过新前向 migration 为 Course/Lesson 加 `published_revision_id` / `working_revision_id`，以 revision snapshot 为结构唯一发布载体。
2. 明确以 `content_revisions` 的唯一 published 行作为 current view，补充所有读取、锁与结构快照规则，并修订版本领域权威中 pointer 表述。
3. 选择其他已批准的模型，同时更新拥有该事实的 Domain/Architecture/Database/API authority。

**Required acceptance artifacts:** 对应 Domain Database / versioning-review 的精确补充，若外部 HTTP payload 变化则更新 frozen Content contract；随后才可进入 Bridge/Plan。

### ADP-002：LessonItem 的引用 revision 固定位置

**Decision requested:** 固定已发布 Content/Exercise revision 是仅存于 Course/Lesson revision snapshot，还是另有前向物理列；明确校验与历史读取的唯一规则。

**Constraint:** 不复制知识本体；不得向客户端暴露 BigInt；Learning 历史固定 revision UUID 后不可被后续发布重写。
