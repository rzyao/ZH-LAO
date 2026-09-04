---
status: baseline
last_updated: 2026-09-04
derived_from: domains/content/knowledge.md
---

# 中老语言内容管理 API 契约

本文定义 D-164 批准的中文与老挝语知识类别后台接口。领域字段和关系约束以 [Knowledge 规格](../../domains/content/knowledge.md) 为准，权限以 [Content 版本与审核](../../domains/content/versioning-review.md) 为准。

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
