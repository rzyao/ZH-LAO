---
status: frozen
last_updated: 2026-08-30
schema: audio
source_conversation_id: 6a935c18-6ae4-83ea-a292-78914bc8eddc
source_share_url: https://chatgpt.com/share/6a93716e-8a28-83ea-abbd-355679b38fe2
---

# Audio 数据库总览

Audio Production Domain 最终冻结 **9 张业务表**。主键统一 UUID；Domain 内建立真实 physical FK；跨 Domain 只存稳定 logical UUID，不建跨域物理 FK（ADR-018）。表名为 `audio_*` 复数带前缀，与 Schema 名一致，符合全局复数规则。

```text
audio
├── audio_slots
├── audio_tasks
├── audio_generation_attempts
├── audio_asset_versions
├── audio_reviews
├── audio_task_events
├── audio_task_batches
├── audio_task_batch_items
└── audio_default_presets
```

主链路：

```text
slot → task → generation_attempt（仅 TTS）→ asset_version → review → publish → slot.official_asset_version_id
```

类型口径：状态类字段按全局规范用 `varchar(32) + CHECK`；时间为 `timestamptz`；下表「类型」列为会话定稿的逻辑类型。

## audio.audio_slots

定位：某个业务对象的某种**逻辑音频槽位**（非具体文件）。一个内容可因 `language_code` / `audio_role` 不同拥有多个 Slot。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | Slot 稳定 ID |
| `source_domain` | varchar | NOT NULL | 来源 Domain，如 `content`（词汇/句子/课程等 canonical 教学内容一律指向 `content`，不得再写历史的 `learning`） |
| `content_entity_type` | varchar | NOT NULL | 来源业务实体类型 |
| `content_entity_id` | UUID | NOT NULL；跨域 logical ref | 来源业务实体稳定 UUID |
| `language_code` | varchar | NOT NULL | 语言代码 |
| `audio_role` | varchar | NOT NULL | 音频用途/角色（如 `pronunciation`） |
| `required_content_revision_id` | UUID | NOT NULL；跨域 logical ref | 当前要求的内容 Revision |
| `required_audio_input_hash` | varchar | NOT NULL | 当前要求的音频输入哈希 |
| `status` | varchar(32)+CHECK | `active` / `offline` | Slot 生命周期状态；停用不物理删除 |
| `official_asset_version_id` | UUID | NULL；Domain 内 FK（同 Slot 约束） | 当前正式 Asset Version |

关键约束与索引：

- `UNIQUE(source_domain, content_entity_type, content_entity_id, language_code, audio_role)`——同一业务对象 + 语言 + 角色只有一个 Slot。
- `official_asset_version_id` 必须引用**属于同一个 Slot** 的 Asset Version；用 Domain 内 composite FK / 等价数据库约束保证，不能引用其他 Slot 的 Asset。
- 索引：`(content_entity_type, content_entity_id)`；`(status)`。

## audio.audio_tasks

定位：一次**业务层面的音频生产意图**（非一次 HTTP 调用、非一次 TTS retry）。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | Task 稳定 ID |
| `slot_id` | UUID | NOT NULL；FK → audio_slots | 所属 Slot |
| `predecessor_task_id` | UUID | NULL；self FK | 审核 Reject 后的前驱 Task（successor 链） |
| `production_method` | varchar(32)+CHECK | `tts` / `human_recording` | 生产方式 |
| `status` | varchar(32)+CHECK | 见下表 | 当前 Task 状态 |
| `content_revision_id` | UUID | NOT NULL；跨域 logical ref | 创建 Task 时内容 Revision 快照 |
| `text_snapshot` | text | 业务定 | 生产文本快照 |
| `pronunciation_snapshot` | text / jsonb | 业务定（可 NULL） | 生产时规范发音快照 |
| `audio_input_hash` | varchar | NOT NULL | 本次生产输入哈希 |
| `tts_preset_key` | varchar | TTS 必填；人工录音为空 | 当次实际使用的 Preset Key |
| `assignee_operator_id` | UUID | NULL；跨域 logical ref（Operations） | 当前任务处理人 |
| `created_by_operator_id` | UUID | NOT NULL；跨域 logical ref（Operations） | 创建任务的管理员/操作者 |
| `client_idempotency_key` | varchar | UNIQUE | 创建 Task 接口幂等 |
| `lock_version` | integer | NOT NULL | 乐观并发控制版本 |
| `created_at` | timestamptz | NOT NULL | 创建时间 |
| `started_at` | timestamptz | NULL | 开始生产时间 |
| `completed_at` | timestamptz | NULL | 业务完成时间 |
| `updated_at` | timestamptz | NOT NULL | 更新时间 |

Task status 完整枚举：

```text
pending_assignment   等待分配生产人员/处理者
assigned             已分配，尚未开始生产
producing            正在生产
pending_review       已形成候选 Asset，等待审核
production_failed    技术生产失败，可在同 Task 下继续 Attempt
approved             审核通过，尚未正式 Publish（仍属 active 集合）
rejected             审核拒绝，当前 Task 结束
published            对应 Asset 已发布为 Slot 当前正式版本
canceled             任务取消
```

关键约束：

- **每个 Slot 同时只能存在一个活动 Task**——partial UNIQUE：

```sql
UNIQUE(slot_id)
WHERE status IN (
    'pending_assignment','assigned','producing',
    'pending_review','production_failed','approved'
)
```

`approved` 属于 active 集合（尚未 publish，未退出生产主流程）。

- 早期讨论的 `needs_regeneration` 主状态未保留，用 `rejected` + successor Task 表达。
- `predecessor_task_id` 用于审核 Reject 后建立重新生产链。
- `lock_version` 用于 optimistic concurrency control，防两个后台操作同时改 Task 状态互相覆盖。

## audio.audio_generation_attempts

定位：**仅记录 TTS 异步执行 Attempt**；人工录音不写此表。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | Attempt 稳定 ID |
| `task_id` | UUID | NOT NULL；FK → audio_tasks | 所属 TTS Task |
| `attempt_no` | integer | NOT NULL | 同 Task 内递增序号 |
| `request_id` | varchar | UNIQUE | 向 TTS 发起请求的幂等 ID |
| `external_job_id` | varchar | NULL；非空 partial UNIQUE | TTS 外部任务 ID |
| `status` | varchar(32)+CHECK | 见下 | 当前执行状态 |
| `transport_retry_count` | integer | NOT NULL | 传输/提交层重试次数 |
| `next_retry_at` | timestamptz | NULL | 允许下一次重试时间 |
| `lease_until` | timestamptz | NULL | worker lease，防并发重复处理 |
| `failure_code` | varchar | NULL | 失败代码 |
| `failure_message` | text | NULL | 失败详情 |
| `created_at` | timestamptz | NOT NULL | 创建时间 |
| `submitted_at` | timestamptz | NULL | 成功提交到 TTS 时间 |
| `completed_at` | timestamptz | NULL | Attempt 完成时间 |

Attempt status：`queued` / `submitting` / `processing` / `retry_wait` / `succeeded` / `failed` / `dead_letter` / `canceled`。

约束与语义：

- `UNIQUE(task_id, attempt_no)`——序号不重复。
- `UNIQUE(request_id)`——向 TTS 请求幂等。
- `external_job_id` 非空时 partial UNIQUE。
- 网络/提交层重试在 Attempt 内体现（`transport_retry_count` / `next_retry_at`）；真正重新生成则新增 Attempt。
- 同一 Task 可有多个 Attempt（如 Attempt1 network failure、Attempt2 timeout、Attempt3 succeeded），技术失败重试仍属同一 Task。

## audio.audio_asset_versions

定位：不可变的实际音频产物事实表；**一个版本只有一个文件**；`version` 按 Slot 独立递增。

**Media/Asset 边界（D-152，frozen）**：物理文件事实（storage provider / bucket / object key / mime / size / checksum / codec）的唯一 canonical owner 是 **Media/Asset Infrastructure**（D-127）。Audio 只保存对最终文件的 **`asset_id` logical UUID 引用**与音频业务事实（审核 / 发布 / 版本关系 / 音频技术属性）；**不保存 `storage_key`、`mime_type`、`size_bytes`、`checksum_sha256`、`codec` 等存储元数据，也不维护物理文件删除重试状态**（物理文件生命周期由 Asset Infrastructure 依据 Audio 的业务裁决执行）。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | Asset Version 稳定 ID |
| `slot_id` | UUID | NOT NULL；FK → audio_slots | 所属 Slot |
| `task_id` | UUID | NOT NULL；UNIQUE；FK → audio_tasks | 来源 Task；一 Task 最多一个 Asset |
| `version` | integer | NOT NULL | 按 Slot 独立递增版本号 |
| `generation_attempt_id` | UUID | NULL；非空 UNIQUE；FK → attempts | TTS 生产来源 |
| `producer_operator_id` | UUID | NULL；跨域 logical ref（Operations） | 人工录音生产人 |
| `content_revision_id` | UUID | NOT NULL；跨域 logical ref | 实际生产使用的 Revision |
| `audio_input_hash` | varchar | NOT NULL | 实际生产输入哈希 |
| `asset_id` | UUID | NOT NULL；UNIQUE；跨域 logical ref（Asset Infrastructure） | 生产文件的 Media/Asset logical UUID；两个 Asset Version 不得指向同一文件资产 |
| `duration_ms` | integer / bigint | NOT NULL | 时长毫秒（音频技术属性，归 Audio） |
| `sample_rate_hz` | integer | NULL | 采样率 |
| `channels` | smallint | NULL | 声道数 |
| `review_status` | varchar(32)+CHECK | `pending_review` / `approved` / `rejected` | 当前审核状态 projection |
| `first_published_at` | timestamptz | NULL | 首次正式发布时间 |
| `created_at` | timestamptz | NOT NULL | 创建时间 |
| `updated_at` | timestamptz | NOT NULL | 更新时间 |

唯一约束：`UNIQUE(slot_id, version)`、`UNIQUE(task_id)`、`generation_attempt_id` 非空时 UNIQUE、`UNIQUE(asset_id)`。

生产来源 CHECK（production source 约束）：

- TTS Asset：`generation_attempt_id IS NOT NULL`。
- Human Recording Asset：`generation_attempt_id IS NULL AND producer_operator_id IS NOT NULL`。

Asset 上明确不保存：`validity`、`source_type`、preset configuration、**以及任何物理存储元数据（storage_key / mime / size / checksum / codec）与物理删除重试状态**（来源从 Task / Attempt 关系推导；Preset 使用事实在 `audio_tasks.tts_preset_key`；文件事实在 Asset Infrastructure）。

## audio.audio_reviews

定位：append-only 审核事实历史；每次审核动作 INSERT 新行，不能 UPDATE 老 Review 改历史。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | Review 事实 ID |
| `asset_version_id` | UUID | NOT NULL；FK → audio_asset_versions | 被审核 Asset |
| `reviewer_operator_id` | UUID | NOT NULL；跨域 logical ref（Operations） | 审核员 |
| `decision` | varchar(32)+CHECK | `approved` / `rejected` / `approval_revoked` | 审核决策 |
| `reject_reason` | varchar(32)+CHECK | NULL | `pronunciation_error` / `speed_too_fast` / `speed_too_slow` / `noise` / `clipping` / `truncated` / `text_mismatch` / `other` |
| `remark` | text | NULL | 补充说明；`approval_revoked` 时必填 |
| `request_id` | varchar | UNIQUE | 审核动作幂等 ID |
| `created_at` | timestamptz | NOT NULL | 审核事实时间 |

CHECK 语义：

```text
decision = rejected           → reject_reason NOT NULL
decision ≠ rejected           → reject_reason IS NULL
decision = approval_revoked   → remark NOT NULL
```

示例历史（不可覆盖）：`Review #1 approved → Review #2 approval_revoked → Review #3 approved`。`approval_revoked` 主要用于正式发布前；已发布音频的版本切换只由 official pointer 控制。

## audio.audio_task_events

定位：Task 生命周期 **append-only 审计日志**；明确**不是 Event Sourcing**——当前事实仍由 `audio_tasks.status`、`audio_asset_versions.review_status`、`audio_slots.official_asset_version_id` 持有。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | Event ID |
| `task_id` | UUID | NOT NULL；FK → audio_tasks | 所属 Task |
| `event_type` | varchar(32)+CHECK | 见下 | 事件类型 |
| `actor_type` | varchar(32)+CHECK | `operator` / `system` / `tts` | 动作主体类型 |
| `actor_id` | UUID | NULL | 主体 logical UUID；system/tts 可为空 |
| `from_status` | varchar | NULL | 状态变化前 |
| `to_status` | varchar | NULL | 状态变化后 |
| `request_id` | varchar | UNIQUE | 事件写入幂等 ID |
| `payload` | jsonb | NULL | 补充审计上下文 |
| `created_at` | timestamptz | NOT NULL | 事件发生时间 |

event_type 最终枚举（12 种）：`task_created` / `assigned` / `production_started` / `production_retry` / `production_failed` / `asset_created` / `review_approved` / `review_rejected` / `review_revoked` / `successor_created` / `published` / `canceled`。

- 索引：`(task_id, created_at)`；`(event_type, created_at)`。
- 只记录 Task 生命周期，**不记录** `slot_offlined` / `slot_activated` / `default_preset_changed` 等非 Task 事件。

## audio.audio_task_batches

定位：批量创建 Audio Tasks 的一次请求；**不是**长期跟踪子任务执行进度的 Workflow。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | Batch ID |
| `production_method` | varchar(32)+CHECK | `tts` / `human_recording` | 本批默认生产方式 |
| `tts_preset_key` | varchar | NULL；TTS 时可用 | 本批默认 Preset |
| `client_idempotency_key` | varchar | UNIQUE | 批量创建请求幂等 |
| `request_hash` | varchar | NOT NULL | 请求内容哈希，防 key 错误复用 |
| `status` | varchar(32)+CHECK | `creating` / `completed` / `failed` / `canceled` | 仅表示批量创建阶段状态 |
| `requested_count` | integer | NOT NULL | 请求条数 |
| `created_count` | integer | NOT NULL | 成功创建 Task 数 |
| `skipped_count` | integer | NOT NULL | 跳过数 |
| `failed_count` | integer | NOT NULL | 失败数 |
| `created_by_operator_id` | UUID | NOT NULL；跨域 logical ref（Operations） | 发起人 |
| `created_at` | timestamptz | NOT NULL | 创建时间 |
| `completed_at` | timestamptz | NULL | 批量创建完成时间 |

幂等规则：相同 key + 相同 `request_hash` → 返回原 Batch 结果；相同 key + 不同 `request_hash` → 直接拒绝。

重要语义：Batch 创建完成即 `completed`；此后子 Task 的 `producing` / `failed` / `approved` / `published` **不反向改变 Batch 状态**。

## audio.audio_task_batch_items

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | Batch Item ID |
| `batch_id` | UUID | NOT NULL；FK → audio_task_batches | 所属 Batch |
| `item_no` | integer | NOT NULL | 请求内序号 |
| `slot_id` | UUID | NULL；FK → audio_slots | 解析后的 Slot |
| `task_id` | UUID | NULL；FK → audio_tasks | 创建出的 Task |
| `result_status` | varchar(32)+CHECK | `created` / `skipped` / `failed` | 逐项结果 |
| `result_code` | varchar | NULL | 机器可读结果代码 |
| `result_message` | text | NULL | 补充结果信息 |
| `created_at` | timestamptz | NOT NULL | 记录时间 |

- `UNIQUE(batch_id, item_no)`。
- 同一 Batch 中对非空 `slot_id` 建防重复约束/等价保护。
- `result_status = created` 时必须已解析出 `slot_id` 与 `task_id`（不允许「created 但 task_id=NULL」的不完整事实）。

## audio.audio_default_presets

定位：Audio 后台「某类内容默认选哪个 Preset Key」的**当前默认配置映射**；不是 TTS 配置表、不是历史事实表。

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| `id` | UUID | PK | 映射 ID |
| `source_domain` | varchar | NOT NULL | 来源 Domain |
| `content_entity_type` | varchar | NOT NULL | 内容实体类型 |
| `language_code` | varchar | NOT NULL | 语言 |
| `audio_role` | varchar | NOT NULL | 音频角色 |
| `default_tts_preset_key` | varchar | NOT NULL | 当前默认 Preset Key |
| `enabled` | boolean | NOT NULL | 是否启用 |
| `created_at` | timestamptz | NOT NULL | 创建时间 |
| `updated_at` | timestamptz | NOT NULL | 更新时间 |

- `UNIQUE(source_domain, content_entity_type, language_code, audio_role)`——`source_domain` 必须进唯一键，防未来两 Domain 使用相同 `content_entity_type` 冲突。
- 概念示例（`illustrative`）：`content / word / zh-CN / pronunciation → zh_word_normal`；管理员创建任务时可改选其他 Preset。
- 允许 UPDATE / DELETE（current configuration）；历史 Task 已保存 `tts_preset_key`，不受默认配置变化影响。

## 删除策略汇总

| 表 | 策略 |
| --- | --- |
| `audio_slots` | 停用用 `status = offline`，不物理删除 |
| `audio_tasks` | 生产业务事实，保留 |
| `audio_generation_attempts` | 技术执行历史，保留 |
| `audio_asset_versions` | 记录永久保留；rejected 未发布资产的**文件**清理由 Asset Infrastructure 执行（业务资格由 Audio 依据 review_status + first_published_at 判定，D-152），行仍用于审计 |
| `audio_reviews` | append-only，不删除 |
| `audio_task_events` | append-only，不删除 |
| `audio_task_batches` / `audio_task_batch_items` | 批处理记录，保留 |
| `audio_default_presets` | current configuration，可 UPDATE / DELETE |

## 唯一事实源清单

| 事实 | 唯一 owner |
| --- | --- |
| 内容/规范发音 | Content（D-148；修订自原 Learning 表述） |
| 当前音频需求 revision/hash | `audio_slots` |
| 一次生产意图 | `audio_tasks` |
| TTS 技术执行 | `audio_generation_attempts` |
| 音频版本（业务关系、审核/发布生命周期、音频技术属性） | `audio_asset_versions` |
| **物理文件事实（storage/mime/size/checksum/codec 及文件物理生命周期）** | **Media/Asset Infrastructure（D-127/D-152；Audio 只保存 `asset_id` 引用）** |
| 审核事实 | `audio_reviews` |
| 当前审核状态 | `audio_asset_versions.review_status` |
| 当前正式音频 | `audio_slots.official_asset_version_id` |
| TTS Preset 实际定义 | TTS 服务 |
| 某任务使用的 Preset | `audio_tasks.tts_preset_key` |
| 当前默认 Preset 映射 | `audio_default_presets` |
| Task 操作审计 | `audio_task_events` |

## 与全局 SQL 规范的关系

- UUID 主键：各域自定主键策略（ADR-018）下的合法选择，compliant。
- 域内真实 FK、跨域 logical UUID 无物理 FK：与 D-098 一致。
- `audio_*` 复数表名 + Schema 前缀：符合复数规则（无需例外登记）。
- 状态 `varchar(32)+CHECK`、`timestamptz`、JSONB 仅用于 `payload` 审计上下文：符合全局规范。

## 实现验收清单

1. 数据库最终只有 9 张 Audio 业务表，名称与本文一致。
2. 所有 Audio 内部主键为 UUID；同 Domain FK 真实存在；跨 Domain 不建 physical FK。
3. `audio_slots` 业务唯一键包含 source_domain / entity_type / entity_id / language_code / audio_role。
4. `official_asset_version_id` 无法指向其他 Slot 的 Asset。
5. 同 Slot 无法同时创建两个 active Task。
6. 技术 TTS 重试不会新建业务 Task。
7. 人工录音不会写 `audio_generation_attempts`。
8. 每个 Task 最多落一个 Asset Version；每个 Attempt 最多一个 Asset。
9. Review 每次追加新行，不覆盖旧审核事实。
10. Reject 原因 CHECK 与 `approval_revoked` remark CHECK 生效。
11. Publish 前必须 approved；Publish 后 Slot pointer、Task status、Event 原子一致。
12. stale 不清空 official pointer，但业务层能禁止继续使用 stale 音频。
13. Rejected 未发布资产的文件清理由 Asset Infrastructure 异步执行；Audio 不保存物理删除重试状态（D-152）。
14. 曾经发布的文件不会被清理逻辑删除。
15. TTS Provider / Model / Voice 配置没有复制进 Audio 数据库。
16. Batch completed 后，不因子 Task 后续状态变化而变化。
17. Default Preset 允许当前配置更新，同时历史 Task 的 preset key 保持不变。
