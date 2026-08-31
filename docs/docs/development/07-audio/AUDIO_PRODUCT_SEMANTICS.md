---
status: frozen
phase: 7
phase_name: Audio Production Domain
document: AUDIO_PRODUCT_SEMANTICS
design_only: true
implementation_started: false
last_updated: 2026-08-31
recovery_baseline: cc6b3d79f5224ef0ee4e2e3435a542ffae5edf6e
---

# ZH-LAO  — Audio Production Product Semantics

> 本文由 `AUDIO_DESIGN_RECOVERY_BRIEF.md` 恢复生成。数据库权威仍是 `database/migrations/0600_audio.sql`；本文不修改 migration、不增加 Audio 表、不开始实现。

## 1. Domain Mission

Audio Production 负责把 Content 的已发布、可生产发音输入转化为可审核、可发布、可追溯的正式音频资产。

```text
Content published source
→ Audio Slot
→ Audio Task
→ TTS Attempt | Human Recording
→ Audio Asset Version
→ Review
→ Publish
→ Slot official_asset_version_id
```

Audio 不是通用媒体域、不是 TTS 模型配置中心、不是订阅/计费域、不是 Learning 练习事实 owner。

## 2. Frozen Ownership

| Fact | Authoritative owner |
| --- | --- |
| canonical text / pronunciation knowledge / revision | Content |
| production requirement snapshot / task / attempt / review / official pointer | Audio |
| storage provider / bucket / object key / MIME / bytes / checksum / physical lifecycle | Asset Infrastructure |
| operator identity / exact RBAC / global operator audit | Operations |
| TTS provider/model/voice/preset definition | TTS service |

跨 Domain 只使用 logical UUID 与 public/service contract；Audio 不 direct SQL `content.*`、`operations.*`、`infrastructure.assets`，也不保存第二份 storage facts。

## 3. Frozen Physical Model

Audio core tables 固定为 9 张：

```text
audio_slots
audio_tasks
audio_generation_attempts
audio_asset_versions
audio_reviews
audio_task_events
audio_task_batches
audio_task_batch_items
audio_default_presets
```

禁止引入 Entry/Variant/Speech 第二模型，禁止恢复 `pronunciation_audios` / `tts_jobs`，禁止 quota/billing/dictation/streak 表进入 Audio。

## 4. Slot Semantics

Slot 表示一个稳定“逻辑音频位置”，业务唯一键由 frozen schema 决定：

```text
source_domain + content_entity_type + content_entity_id + language_code + audio_role
```

V1 冻结：

- `source_domain = content`；
- `content_entity_type` 只接受 Content public contract 已明确支持 Audio 的 `content | course | lesson | exercise | question`；
- `language_code` 当前应用层只接受 Content contract 的 `zh | lo`；
- `audio_role` 不在 Audio 私自发明全局枚举，必须由 `ContentPublicQueries.validateAudioSource()` 对该 entity/revision/language 组合确认支持；
- Slot 默认在首次“同步生产需求 / 创建任务 / 批量创建”时 lazy create，不要求 Content 每创建一个对象就预建 Audio 行；
- `status=offline` 是 Audio 生产/服务状态，不替代 Content 的 active/disabled/archived；Content 不可用时即使 Slot active 也不得对 runtime 返回可播放结果；
- offline Slot 不创建新 Task，不对 runtime 提供 official playback；恢复用 `active`，不物理删除 Slot。

### Requirement sync

Audio 通过 Content public contract 获取已发布 revision 与 `ValidatedAudioSource`，再更新/创建：

```text
required_content_revision_id
required_audio_input_hash
```

Content publish 后可通过 Audio public integration 调用 `syncRequirement`；即使该通知尚未发生，runtime `resolveOfficialAudio` 也必须重新解析当前 Content revision 后计算 freshness，不能仅信任旧 Slot 字段而错误播放 stale 音频。

### audio_input_hash

V1 由 Audio 对 Content 返回的 `audioInputHashMaterial` 做 deterministic SHA-256：

1. 使用版本化 envelope：`audio-input-v1`；
2. JSON object key 递归按 Unicode code point 升序；
3. array 顺序保持；
4. 字符串按 Content 返回值原样使用，不在 Audio 擅自 trim/改写发音文本；
5. UTF-8 编码；
6. 输出 lowercase hex SHA-256。

`textSnapshot` / `pronunciationSnapshot` 是生产审计快照；Content 负责 material 的语义完整性，Audio 负责 hash 计算稳定性。

## 5. Fresh / Stale

对当前 official asset：

```text
fresh =
  slot.status == active
  AND Content current published source is valid
  AND official_asset.content_revision_id == current required revision
  AND official_asset.audio_input_hash == current required hash
```

任一不满足即不是 fresh。stale 不清空 `official_asset_version_id`，历史指针仍可审计；runtime 默认不得播放 stale official audio，并返回 typed unavailable reason，等待重新生产。

## 6. Production Methods

V1 两种：

- `tts`：主路径；技术执行写 `audio_generation_attempts`。
- `human_recording`：管理员兜底；绝不伪造 generation attempt。

一次 Task 最多形成一个 Asset Version；一次生成不产生多候选供挑选。

## 7. Task Lifecycle

Frozen status 不增加新值：

```text
pending_assignment
assigned
producing
pending_review
production_failed
approved
rejected
published
canceled
```

业务规则：

- 每个 Slot 同时最多一个 active Task；`production_failed` 与 `approved` 仍属 active。
- TTS 创建后可直接进入 `producing` 并创建首个 queued Attempt；Human 默认 `pending_assignment`，若创建时显式合法 assignee 可直接 `assigned`。
- `production_failed` 只表示当前 TTS Task 暂无成功产物；重试仍在同 Task 新建 Attempt。
- Review reject 结束旧 Task，重新生产通过 successor Task；不复活 rejected Task。
- `rejected | published | canceled` 是终态。
- cancel 仅允许 `pending_assignment | assigned | producing | production_failed`；已有候选 Asset 后使用 Review/Publish 语义，不用 cancel 抹掉历史。

完整 transition 与事务副作用见 `AUDIO_PRODUCTION_CONTRACTS.md`。

## 8. Review / Four-eyes

V1 全人工审核，Review append-only。

```text
approved
rejected
approval_revoked
```

V1 **不强制四眼原则**：有 `audio.reviews.decide` 权限的 operator 可以审核自己生产/创建的候选。严格 producer/reviewer separation 标记 `DEFERRED`，不能在实现里暗加规则。

`approval_revoked` 仅允许尚未发布过的 approved candidate；动作把 Asset projection 退回 `pending_review`、Task `approved -> pending_review`。已发布版本不通过 Review revoke 撤销：当前错误正式音频先 `slot offline` 阻断服务，再生产/审核/发布替代版本；历史版本永久保留。

## 9. Publish Semantics

Publish 必须同时满足：

```text
asset.review_status = approved
asset.task_id belongs to target task
asset.slot_id = target slot
Task.status = approved
Slot.status = active
Asset revision/hash == current Content validated revision/hash
```

同一 Audio transaction 锁 Slot/Task/Asset 后：

1. 首次发布时写 `first_published_at`，以后不覆盖；
2. 切换 `audio_slots.official_asset_version_id`；
3. Task -> `published`；
4. append `published` Task Event；
5. commit。

旧 official version 行与文件继续保留。两个并发 publish 以 Slot row lock 串行化；后执行者必须重新做 freshness/state 校验，不能 last-write-wins 静默覆盖。

## 10. Rejected Asset Cleanup

Audio 只表达业务资格：

```text
review_status = rejected
AND first_published_at IS NULL
```

物理对象删除由 Asset Infrastructure 异步执行。Audio Asset Version/Review/Task/Event 行不删除。

## 11. Batch Semantics

Batch 是“批量创建 Task 请求”的 snapshot，不是长期 Workflow：

- Application 层先把 Content 查询结果解析为有序 source tuple snapshot；
- `request_hash` 对该 snapshot + method/default override 做 deterministic hash；
- 相同 idempotency key + 相同 hash 返回原 Batch；不同 hash -> conflict；
- 每项写 created/skipped/failed；created 必须同时有 slot_id + task_id；
- 同 Batch 同 Slot 去重；
- Batch `completed` 后子 Task 状态不反向改变 Batch；
- `canceled` 只停止尚未创建的后续 item，不级联取消已经创建的 Task。

## 12. Default Presets

`audio_default_presets` 是 Audio 当前默认 mapping，不是 TTS 配置库。

匹配维度严格等于 schema：

```text
source_domain + content_entity_type + language_code + audio_role
```

TTS Task 创建时：explicit operator preset > enabled matching default；无可用 preset -> `AUDIO_PRESET_UNAVAILABLE`。选定 key 写入 Task 后不可因 default mapping 更新而改变。实际 preset 是否存在/可用由 TTS service adapter 验证。

## 13. Required / Deferred / Not Supported

### REQUIRED V1

TTS、human recording、manual assignment、technical retry、append-only review、approval revoke before publication、publish/official pointer、stale prevention、successor、batch task creation、default preset mapping、Operations RBAC/Audit、Admin workbench contracts、runtime official-audio read。

### DEFERRED

strict four-eyes、auto assignment、automatic pronunciation scoring、waveform UI data、transcoding/loudness pipeline、scheduled publish、callback-based TTS completion、external consumer events、multi-region delivery policy。

### NOT SUPPORTED V1

multi-candidate generation、quota/billing ledger、subscription entitlement in Audio、dictation/streak ownership、voice profile tables、Entry/Variant/Speech alternate model、published-history deletion、direct browser DB/storage authority、rollback-to-old-official Admin action。

## 14. Implementation Boundary

本设计可以 `AUDIO_DESIGN_GATE = PASS`，但当前 main 尚无 Content backend module / `CONTENT_GATE = PASS` 证据。因此：

```text
AUDIO_IMPLEMENTATION = NOT_STARTED
AUDIO_IMPLEMENTATION_ENTRY = BLOCKED_BY_CONTENT_GATE
```

Operations 与 Admin Foundation 已 PASS；这不解除 Content dependency。
