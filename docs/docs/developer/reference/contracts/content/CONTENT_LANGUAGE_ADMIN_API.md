---
status: baseline
last_updated: 2026-09-05
derived_from: domains/content/knowledge.md
---

# 中老语言内容管理 API 契约

本文定义 D-164 批准的中文与老挝语知识类别后台接口，以及 D-167 / ADR-028 批准的老挝语字母异步批量操作。领域字段和关系约束以 [Knowledge 规格](../../domains/content/knowledge.md) 为准，权限以 [Content 版本与审核](../../domains/content/versioning-review.md) 为准。

## 一、类别路径

| 语言 | 类别 | 管理路径 | 内容类型 |
| --- | --- | --- | --- |
| 中文 | 拼音元素 | `/api/v1/admin/content/zh/pinyin-elements` | `zh_pinyin_element` |
| 中文 | 中文音节 | `/api/v1/admin/content/zh/syllables` | `zh_syllable` |
| 中文 | 汉字 | `/api/v1/admin/content/zh/hanzi` | `zh_hanzi` |
| 中文 | 词语 | `/api/v1/admin/content/zh/words` | `zh_word` |
| 中文 | 句子 | `/api/v1/admin/content/zh/sentences` | `zh_sentence` |
| 老挝语 | 字母 | `/api/v1/admin/content/lo/letters` | `lo_letter` |
| 老挝语 | 音节 | `/api/v1/admin/content/lo/syllables` | `lo_syllable` |
| 老挝语 | 词语 | `/api/v1/admin/content/lo/words` | `lo_word` |
| 老挝语 | 句子 | `/api/v1/admin/content/lo/sentences` | `lo_sentence` |

中文与老挝语路径不得互相代理或自动转换。运行期不提供旧中文拼音模型的双读、双写、投影或旧管理接口。

## 二、通用操作

每个类别根路径 `/{category}` 支持以下操作：

```text
GET  /{category}
POST /{category}
GET  /{category}/{contentId}/history
GET  /{category}/{contentId}/references
POST /{category}/{contentId}/derive-working
PUT  /{category}/{contentId}/revisions/{revisionId}
POST /{category}/{contentId}/revisions/{revisionId}/submit
POST /{category}/{contentId}/revisions/{revisionId}/review
POST /{category}/{contentId}/revisions/{revisionId}/re-edit
POST /{category}/{contentId}/revisions/{revisionId}/publish
```

`contentId` 和 `revisionId` 均为逻辑 UUID，任何响应不得暴露数据库 BIGINT。

### 2.1 老挝语字母列表查询

`GET /api/v1/admin/content/lo/letters` 使用以下严格白名单；未知参数返回 `VALIDATION_ERROR`：

| 参数 | 语义 |
| --- | --- |
| `q` | trim 后最多 128 字符；对 `character`、`name`、`romanization` 做大小写不敏感的包含搜索；空字符串等同未提供 |
| `letter_type` | 逗号分隔多选：`consonant/vowel/tone_mark/other` |
| `letter_class` | 逗号分隔多选；值必须来自当前老挝语字母数据中登记的非空类别 |
| `content_status` | 逗号分隔多选：`active/disabled/archived` |
| `revision_status` | 逗号分隔多选：`draft/pending_review/approved/rejected/none`，匹配当前活动工作修订；无活动工作修订以 `none` 筛选 |
| `sort` | 单字段白名单：`sort_order/character/name/romanization/updated_at` |
| `order` | `asc/desc` |
| `page` | 从 1 开始，默认 1 |
| `page_size` | 默认 50，最大 500 |

默认排序为 `sort_order ASC NULLS LAST, public_id ASC`；任一显式排序均追加 `public_id ASC` 作为稳定并列键。响应 `data` 至少包含 `items/page/page_size/total/batch_actions`；`batch_actions` 只表达当前 Operator 按权限可发起的动作，不替代提交和执行阶段的逐项状态校验。

用于 `query_all` 的规范化查询对象包含 `q/letter_type/letter_class/content_status/revision_status/sort/order` 的规范值，不包含 `page/page_size`。多选值去重后按字典序排列；缺省排序展开为默认排序；字符串使用 Unicode NFC 并 trim。选择 hash 必须基于该规范化对象和 Content 定义的固定序列化规则计算。

## 三、草稿快照

创建请求：

```json
{
  "snapshot": {
    "fields": {},
    "composition": [{ "contentId": "下级内容 UUID", "position": 1, "role": "可选角色", "surfaceForm": "可选句中形式" }]
  }
}
```

`fields` 必须严格匹配所属类别在 Knowledge 规格中的字段，不接受未知字段。`composition` 只保存同语言的直接下一级引用；草稿允许为空，提交审核与发布要求非空、位置从 1 连续排列，且所有下级引用已有正式版本。

更新请求额外携带 `expectedLockVersion`。版本不一致返回 `STALE_VERSION_CONFLICT`，不得覆盖较新的草稿。

## 四、版本生命周期

```text
草稿 → 待审核 → 已批准 → 已发布 → 历史版本
             ↘ 已驳回 → 草稿
```

- 已发布内容只能通过 `derive-working` 从当前正式版本派生新草稿。
- 审核请求体为 `{ "action": "approve" }` 或 `{ "action": "reject", "remark": "原因" }`；驳回原因必填。
- 发布必须在单个数据库事务内完成原正式版本切换、新版本发布和专用结构表物化。
- 任一校验或数据库写入失败时，整个发布回滚，不得产生部分发布。

## 五、权限与审计

每个类别使用 `content.<resource>.read/write/review/publish` 四个独立权限。角色由 Operations 自定义配置，不预置固定业务角色矩阵。

创建、更新、提交审核、审核、退回编辑、发布和派生新版本成功后必须记录 Operations 成功操作审计。审计目标包含 Content logical UUID、内容类型、版本 UUID 和动作；失败操作不记录成功审计。

## 六、历史与反向引用

- `history` 按版本号倒序返回不可变快照、状态、审核意见和时间。
- `references` 从所属语言的专用组成表返回直接上级内容 UUID、上级类型和引用位置。
- 反向引用只用于影响分析，不允许调用方据此绕过上级类别权限执行写入。

## 七、错误与响应

响应继续遵守全局业务码信封。领域校验失败使用 `INVALID_DATA`，活动工作版本冲突使用 `ACTIVE_WORK_CONFLICT`，非法状态变更使用 `ILLEGAL_STATE_TRANSITION`，乐观锁冲突使用 `STALE_VERSION_CONFLICT`，实体不存在使用 `NOT_FOUND`。错误信息必须为可操作描述，不得泄露 SQL 或约束名称。

## 八、老挝语字母异步批量操作（D-167 / ADR-028）

本节仅适用于 `/api/v1/admin/content/lo/letters`，不得自动推广到其他内容类别。管理端“删除”对应 `archive`，只把 `contents.status` 改为 `archived`；不提供物理删除、批量上线或批量下线。

### 8.1 路径与权限

| 操作 | 路径 | 权限 |
| --- | --- | --- |
| 创建任务 | `POST /api/v1/admin/content/lo/letters/batch-tasks` | 按 action：`submit_review/archive` 使用 `content.lo_letters.write`；`approve/reject` 使用 `content.lo_letters.review`；`publish` 使用 `content.lo_letters.publish` |
| 预览当前查询全部 | `POST /api/v1/admin/content/lo/letters/selection-preview` | `content.lo_letters.read` |
| 任务历史 | `GET /api/v1/admin/content/lo/letters/batch-tasks` | `content.lo_letters.read`，且只返回当前 Operator 创建的任务 |
| 任务详情 | `GET /api/v1/admin/content/lo/letters/batch-tasks/{taskId}` | `content.lo_letters.read`，且 `requested_by_operator_id` 必须是当前 Operator |
| 重试失败项 | `POST /api/v1/admin/content/lo/letters/batch-tasks/{taskId}/retry-failed` | 与原任务 action 相同的权限，且只允许原创建 Operator |

`taskId` 为任务 `public_id` UUID。任务提交后不可取消，不提供取消或物理删除接口。任务及逐项结果长期保留。

`selection-preview` 接受 `{ "query": <规范化查询对象> }`，返回 `{ "query": <规范化查询对象>, "expected_count": 126, "selection_hash": "..." }`。该接口只建立短期确认快照，不创建任务；若管理员随后提交时目标 UUID 集合或数量变化，创建任务仍须返回 `BATCH_SELECTION_CHANGED`。空结果可预览，但不能创建任务。

### 8.2 创建任务

请求必须携带 `Idempotency-Key` 请求头，并使用以下严格请求体：

```json
{
  "action": "submit_review | approve | reject | publish | archive",
  "selection": {
    "mode": "explicit_ids",
    "content_ids": ["Content logical UUID"],
    "expected_count": 1
  },
  "reason": "reject/archive 必填，其他动作不得提交"
}
```

跨页选择使用 `query_all`：

```json
{
  "action": "approve",
  "selection": {
    "mode": "query_all",
    "query": {},
    "expected_count": 126,
    "selection_hash": "64 位小写 SHA-256"
  }
}
```

`query` 必须是本接口 `GET /api/v1/admin/content/lo/letters` 已登记查询参数的规范化对象，不接受分页参数、任意字段或查询表达式。`selection_hash` 对规范化查询与其当前稳定有序 Content UUID 集合计算；服务端在单一事务中重新解析完整目标集合、比较 hash 与 `expected_count`、写入任务及全部明细。任何不一致整体返回 `BATCH_SELECTION_CHANGED`，不得排队，也不得静默增删目标；管理员刷新结果并重新确认后方可提交。

成功返回 `202` 语义的统一信封（实际 HTTP 仍按 ADR-023 为 200），`data` 至少包含：

```json
{
  "task_id": "UUID",
  "status": "queued",
  "action": "approve",
  "selection_mode": "query_all",
  "target_count": 126,
  "created_at": "ISO-8601"
}
```

相同 Operator、相同 `Idempotency-Key` 和相同规范化请求返回原任务；同 key 不同请求返回 `CONFLICT`。

### 8.3 执行、状态与重试

任务状态为 `queued/running/completed/completed_with_issues/failed`，逐项状态为 `queued/running/succeeded/failed/skipped`。Worker 使用服务端配置的小批次认领，不存在产品数量上限；队列容量保护使用通用 `RATE_LIMITED`，并返回 `retry_after_seconds`。

每项在独立事务中重取 Content/Revision，重新校验当前 Operator 状态、action 权限、锁版本、内容状态机和发布依赖。权限被撤销后，尚未处理的项目记为 `skipped`，错误码为 `FORBIDDEN`；单项失败不得阻断其他项目。成功项使用现有 action key 记录 Operations 审计，并在 metadata 中增加 `batch_task_id`。

只有 `completed_with_issues` 或 `failed` 且至少有一个 `failed` 明细的任务可以重试。重试只把失败项重新排队，不重复成功或跳过项；不满足条件返回 `BATCH_TASK_NOT_RETRYABLE`。服务端处理批次大小、并发数和吞吐速率属于运行配置，不构成产品可见上限。

### 8.4 查询任务结果

任务历史使用 `page`、`page_size` 分页，默认 `page=1`、`page_size=20`，最大 `page_size=100`，按 `created_at DESC, id DESC` 稳定排序。详情返回任务汇总及逐项结果；逐项结果使用同样的分页默认值和上限，并允许按 `status` 精确筛选。响应至少包含 `items/page/page_size/total`，不得暴露数据库 BIGINT。
