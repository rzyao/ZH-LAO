---
status: frozen
last_updated: 2026-08-30
revision: "2026-08-30 音频生产域定稿提取会话：最终 9 表权威版本（Slot/Task/Attempt/Asset Version/Review + 正式版本唯一指针）"
schema: audio
source_conversation_id: 6a935c18-6ae4-83ea-a292-78914bc8eddc
source_share_url: https://chatgpt.com/share/6a93716e-8a28-83ea-abbd-355679b38fe2
---

# Audio Production 域（音频生产域）

Audio Production Domain 统一负责**业务音频的生产、生产版本、审核、发布、正式版本指针、失败重试、批量生产以及生产审计**。它不是「通用媒体文件域」，也不是 Media Center；**物理文件事实的唯一 canonical owner 是 Media/Asset Infrastructure（D-127/D-152）**，Audio 只保存 `asset_id` logical UUID 引用。

**一句话定义（会话最终收口 + D-152 边界裁决）：**

> Content 提供需要发音的业务对象及规范生产输入，Audio 为其建立稳定 Slot；通过 TTS 或人工录音创建一次生产 Task，TTS 技术重试通过 Attempt 保留历史，每个 Task 最终只形成一个不可变 Asset Version；资产经过独立 Review 后才能 Publish，Slot 的 `official_asset_version_id` 是全系统当前正式音频的唯一事实源；历史正式版本永久保存，Rejected 未发布文件异步清理（物理清理由 Asset Infrastructure 执行）；生产文件统一登记为 Asset Infrastructure 资产，Audio 只保存 `asset_id` 与音频业务事实；TTS 的 Provider/Model/Voice/Preset 配置归 TTS 服务维护，Audio 只保存实际使用的 Preset Key 与必要生产快照。

## 定位与职责

Audio 解决的问题：任何业务内容（当前主要是 Content）的「逻辑音频位置」从需求出现，到生产、审核、发布成为当前正式音频的完整业务事实。

核心对象模型：

```text
Audio Slot
   │
   ├── Audio Task
   │      │
   │      ├── Generation Attempt   ← 仅 TTS
   │      │
   │      └── Asset Version
   │              │
   │              └── Review
   │
   └── official_asset_version_id   ← 当前正式音频唯一指针

外围：Task Events / Task Batches / Batch Items / Default Presets
```

最终固定 **9 张业务表**，字段级规格见[数据库总览](database.md)。

```text
audio
├── audio_slots                 逻辑音频槽位 + 正式版本指针
├── audio_tasks                 一次业务层面的生产意图
├── audio_generation_attempts   TTS 异步技术执行 Attempt
├── audio_asset_versions        不可变音频产物版本
├── audio_reviews               append-only 审核历史
├── audio_task_events           Task 生命周期审计日志
├── audio_task_batches          批量创建 Task 的请求与结果
├── audio_task_batch_items      批量请求逐项结果
└── audio_default_presets       当前默认 Preset Key 映射
```

## 产品目标

1. **所有学习内容原则上都可以拥有音频。** Content 中任何需要发音的内容都可以向 Audio 请求音频；Audio 不理解「单词表」「课文」「例句」等 Content 内部业务模型，而是通过 `source_domain + content_entity_type + content_entity_id + language_code + audio_role` 定位一个业务音频需求。
2. **每一个逻辑音频位置最终只有一个「当前正式音频」。** 一个 Slot 可以有多个历史 Asset Version，但只有一个 `official_asset_version_id`；历史版本可回溯，V1 暂不提供回滚入口（数据模型保留未来回滚能力）。

## 与 Content 的职责边界（C 模式）

> **Content 发起需求 → Audio 独立完成生产 → Audio 返回正式资产。**

| 事实 | Owner |
| --- | --- |
| canonical 内容事实（当前内容、Revision、规范发音、发音相关 canonical 输入） | Content |
| 「当时生产这个音频用了什么输入」的快照（`content_revision_id` / `text_snapshot` / `pronunciation_snapshot` / `audio_input_hash`） | Audio |
| 当前正式音频（`official_asset_version_id`） | Audio |
| 音频是否需要重产（fresh / stale 判定） | Audio + Content 契约（required revision/hash 对比生产快照） |

Audio **不能成为规范发音知识的 owner**。Content 内容变化不篡改历史 Audio Task / Asset；历史任务必须能还原当时的生产输入。

## Fresh / Stale 模型

- `audio_slots` 保存当前需求：`required_content_revision_id`、`required_audio_input_hash`。
- Asset Version 保存生产时使用的：`content_revision_id`、`audio_input_hash`。
- 判定：`slot.required_audio_input_hash == official_asset.audio_input_hash` 且 Revision 一致 → `fresh`；任一不一致 → `stale`。

**最终裁决：stale 不清空 `official_asset_version_id`。** 数据库仍知道上一个正式音频是谁，但业务层可禁止播放已失效的正式版本并发起重新生产。这比清空 official pointer 更易审计和追踪历史。

## 生产方式与失败语义

V1 两种生产方式：`tts`（主）与 `human_recording`（兜底）。产物生成后统一进入 `Asset Version → Review → Publish` 链路，人工录音不单独建一套版本/审核/发布模型。

| 问题类型 | 示例 | 最终处理 |
| --- | --- | --- |
| TTS 技术失败 | timeout、provider unavailable、network error、invalid response、external job failure | **同一 Task 下新增/重试 Generation Attempt**；Task 可进入 `production_failed`，仍可在同 Task 继续 Attempt |
| 内容质量失败 | 发音错误、语速过快/过慢、噪音、截断、文本不匹配 | **Review rejected → 当前 Task 结束（rejected）→ 创建 successor Task**（`predecessor_task_id` 链） |

不可混淆的规则：

- **技术失败重试 = 同 Task 新 Attempt**（API 超时不新建业务 Task）。
- **审核 Reject = 旧 Task 结束 + successor Task**。
- **Reject 不自动重新调用 TTS**（reject ≠ auto regenerate），successor Task 由生产人员/系统后续决定。
- **每次生产只产生一个候选音频**（不做一次生成多个候选挑一个）。
- **一个 Asset Version 只有一个实际文件**；格式不强制统一（mp3/wav 等由 Asset 自身 `file_format`/`mime_type`/`codec` 表达），但不保存多格式变体。

## TTS 契约

- TTS Provider / Model / Voice / Preset 参数及其历史**由 TTS 服务自己维护**，Audio 不维护、不复制。
- Audio 只认识 **Preset Key**（如 `zh_word_normal`、`zh_sentence_slow`、`lo_word_normal`），Task 上保存 `tts_preset_key` 使用事实；Asset 不重复保存 preset 配置。
- Preset 可直接修改、无需参数版本历史；生产人员选 Preset 而非底层模型。
- `audio_default_presets` 只是 Audio 后台的「某类内容默认选哪个 Preset」映射（current configuration，可 UPDATE/DELETE），不是 TTS 配置表。
- TTS **异步执行**：Task → Generation Attempt → TTS submit → external job → TTS 处理 → **TTS 自己上传 Cloudflare R2** → 经 Media/Asset Infrastructure 登记为资产（获得 `asset_id`）→ Audio 形成 Asset Version（只保存 `asset_id` 引用与音频技术属性）。不经「TTS → Audio API → Audio 再上传」的回传路径。
- TTS 成功上传 R2 后**不长期保留**自己的「原始生成文件」；R2 对象即生产文件，其存储元数据（object key / mime / size / checksum / codec）由 Asset Infrastructure 维护，Audio 不复制。

## 人工录音

- 由**管理员主动触发**，不是普通用户 UGC 录音流程；试听/重录阶段不进入正式生产历史，仅最终提交进入。
- 产物直接形成 Asset Version：`generation_attempt_id = NULL`、`producer_operator_id = 录音管理员`（Operations logical ID）。**不伪造 TTS Generation Attempt，不写 `audio_generation_attempts`。**
- 必须记录是谁录的（`producer_operator_id`）。

## 审核（Review）

- V1 全部人工审核；数据模型预留未来自动质检/自动批准的演进空间（独立 `audio_reviews` 表，不把「审核 = 管理员点按钮」写死在 Asset 上）。
- **Review 与 Publish 严格分离：approved ≠ published。** approved 只表示质量审核通过；发布动作改变 `audio_slots.official_asset_version_id`。
- **审核历史不可覆盖**：每次审核动作 INSERT 新 Review（`approved` / `rejected` / `approval_revoked`）；`audio_asset_versions.review_status` 只是当前状态 projection。
- Reject Reason 枚举：`pronunciation_error` / `speed_too_fast` / `speed_too_slow` / `noise` / `clipping` / `truncated` / `text_mismatch` / `other`（+ `remark` 补充说明；`rejected` 时 `reject_reason` 必填，非 rejected 时必空）。
- `approval_revoked` 主要用于正式发布前，要求 `remark` 必填；已发布音频不靠修改 Review 表达撤回，正式版本切换只由 official pointer 控制。

## 正式版本与文件生命周期

- 当前正式音频的唯一事实源：`audio_slots.official_asset_version_id`。不再维护 `is_current` / `is_official` / `is_primary` / `current_version` 等重复事实。
- 旧正式版本被替代后：行与文件保留，`first_published_at` 证明其曾正式发布；历史完整可审计。
- **曾经正式发布的文件永久保留**；**从未发布且审核拒绝**的文件可删：清理由 **Asset Infrastructure 异步执行**（含重试状态，D-152），Audio 只表达业务资格（`review_status=rejected` 且 `first_published_at IS NULL`），不在审核 API 内同步删 R2；V1 **不建独立 cleanup jobs 表**。
- 存储统一 **Cloudflare R2**，TTS 与人工录音共用；物理文件事实（含 object key）由 Asset Infrastructure 维护，Audio 侧 `asset_id` 全表 UNIQUE、两个 Asset Version 不得指向同一文件资产。

## 状态机

| 表 | 字段 | 枚举 |
| --- | --- | --- |
| `audio_slots` | `status` | `active` / `offline`（停用不物理删除） |
| `audio_tasks` | `status` | `pending_assignment` / `assigned` / `producing` / `pending_review` / `production_failed` / `approved` / `rejected` / `published` / `canceled`（无 `needs_regeneration` 主状态，用 rejected + successor Task 表达） |
| `audio_generation_attempts` | `status` | `queued` / `submitting` / `processing` / `retry_wait` / `succeeded` / `failed` / `dead_letter` / `canceled` |
| `audio_asset_versions` | `review_status` | `pending_review` / `approved` / `rejected` |
| `audio_reviews` | `decision` | `approved` / `rejected` / `approval_revoked` |
| `audio_task_batches` | `status` | `creating` / `completed` / `failed` / `canceled` |
| `audio_task_batch_items` | `result_status` | `created` / `skipped` / `failed` |

### 端到端主流程

```text
Content 内容产生音频需求
          ↓
Audio Slot
          ↓
检查 official asset 是否 fresh
          ↓
无正式版本 / stale
          ↓
创建 Audio Task
          ↓
┌───────────────────────┐
│                       │
TTS                 Human Recording
│                       │
Generation Attempt      管理员录音
│                       │
└──────────┬────────────┘
           ↓
      Asset Version
           ↓
      pending_review
           ↓
        Review
       /      \
 approved    rejected
    ↓           ↓
Task approved  Task rejected
    ↓           ↓
 Publish      文件异步删除
    ↓           ↓
official ptr  successor Task
    ↓
Task published
```

### 发布核心事务（原子）

```text
1. 验证 Asset.review_status == approved
2. 验证 Asset 属于目标 Slot
3. 如 first_published_at 为空，写入首次发布时间
4. 更新 audio_slots.official_asset_version_id
5. Task → published
6. 写 published Task Event
7. 提交事务
```

不能出现「Task 已 published，但 Slot 仍指向旧版本」的半完成状态。

## 批处理（Batch）

Batch 只负责**批量创建 Audio Tasks**，不是长期跟踪子任务进度的 Workflow。创建完成即 `completed`；此后子 Task 的 `producing/failed/approved/published` 不反向改变 Batch 状态。幂等：相同 idempotency key + 相同 `request_hash` 返回原 Batch；相同 key + 不同 hash 直接拒绝（防 key 错误复用）。

## 并发与幂等（三层）

| 层 | 机制 | 目标 |
| --- | --- | --- |
| 业务唯一性 | UNIQUE / partial UNIQUE | 防重复 Slot、重复活动 Task、重复版本、同一 `asset_id` 被多个版本引用（D-152：文件事实在 Asset Infrastructure，Audio 不自持 storage_key） |
| 请求幂等 | `client_idempotency_key` / `request_id` | 客户端/worker/TTS callback 重试不制造重复业务事实 |
| 乐观并发 | `audio_tasks.lock_version` | 后台多操作同时修改 Task 防覆盖 |

Attempt 层另有 `transport_retry_count` / `next_retry_at` / `lease_until` / `external_job_id` 处理 worker/callback 并发。

## 跨 Domain 契约

| 字段/事实 | 来源 Domain | Audio 中的处理 |
| --- | --- | --- |
| `content_entity_id` / `content_entity_type` / `source_domain` | Content 或其他业务域 | 稳定 UUID logical reference，不建跨域物理 FK |
| `content_revision_id` | Content | 稳定 UUID logical reference；Task / Asset 保存生产时快照 |
| 规范发音 / 当前文本 | Content | canonical owner 在 Content；Audio 仅保存快照 |
| operator IDs（assignee/created_by/reviewer/producer/created_by(batch)） | Operations | 稳定 **UUID logical ID**（D-153 统一为 UUID，无 VARCHAR 套契约），不建跨域 FK |
| TTS preset / model / voice | TTS 服务 | Audio 只保存 preset key；具体定义由 TTS 自维护 |
| 物理文件（R2 object 及其 storage/mime/size/checksum/codec、物理生命周期） | Media/Asset Infrastructure | Audio 只保存 `asset_id` logical UUID（D-127/D-152），不复制任何文件事实 |

- Domain 内（9 张表之间）建立真实 physical FK。
- 跨 Domain 一律 stable logical UUID reference，不建立 physical FK。
- 主键统一 UUID（符合 ADR-018 各域自定主键策略）。

## 最终不变量（15 条）

1. 一个 Slot 只有一个当前 official asset。
2. 一个 Slot 同时最多只有一个 active production Task。
3. 一个 Task 最终最多形成一个 Asset Version。
4. 一个 Generation Attempt 最多形成一个 Asset Version。
5. 一个 Asset Version 只有一个实际文件。
6. Asset 的 official pointer 必须属于同一 Slot。
7. 审核 Reject 与技术 production failure 是两种完全不同的事实。
8. 技术失败 → 同 Task 新 Attempt。
9. 审核 Reject → Task 结束 + successor Task。
10. approved 不等于 published。
11. published/current 的唯一判断依据是 Slot official pointer。
12. Content 内容变化不篡改历史 Audio Task / Asset。
13. 历史任务必须能够还原当时的生产输入。
14. 曾经正式发布过的 Asset 文件永久保留。
15. 未发布且 rejected 的 Asset 记录保留，但文件允许异步删除。

## 明确不建立的概念

以下在最终审计中被裁掉或归属其他系统，不得重新加入 V1：

| 不建立的对象/概念 | 原因 |
| --- | --- |
| TTS Providers / Models / Voices 表 | 归 TTS 服务自身维护 |
| TTS Preset 参数历史表 | Audio 只保存 preset key 使用事实 |
| Audio cleanup jobs 表 | Reject 文件清理重试状态直接保存在 Asset Version |
| 独立 Publish History 表 | 当前正式事实由 Slot pointer 表达；历史由 `first_published_at` + events 支撑 |
| 独立 current / official audio 表 | 避免第二份 current canonical fact |
| 独立 regeneration 表 | Reject 后通过 predecessor/successor Task 链表达 |
| 独立 human recording attempt 表 | 人工录音直接形成 Asset Version，不伪造 TTS Attempt |
| 多格式 variant 表 | 每个 Asset Version 只有一个实际文件 |
| 自持文件存储元数据（storage_key / mime / size / checksum / codec） | 物理文件事实唯一 canonical owner 为 Asset Infrastructure（D-127/D-152），Audio 只保存 `asset_id` |
| `is_current` / `is_primary` / `is_official` 字段 | 会与 Slot official pointer 形成重复事实源 |
| `needs_regeneration` Task 主状态 | 用 rejected + successor Task 表达 |

其他会话出现过的 FFmpeg / Whisper / 通用 Media Center / 原始-派生音频流水线方案，均不进入本域实现。

## 与既有定稿的关系

- **Content/Learning 拆分契约（「拆分学习域」会话，D-147/D-148）**：canonical 内容、规范发音、Content Revision 的拥有者由 Learning 改为 **Content**；依赖 `Audio Production → Content`（而非 → Learning）；Content 提供 `content_entity_id` / `content_revision_id` 稳定 logical UUID，Audio 使用 logical reference 不建跨域 FK；Audio 仍只负责生产、不成为教学内容 canonical source。
- 取代 Learning 域旧 `pronunciation_audios` 与 `tts_jobs` 表设计（D-028 表级设计 `superseded`，迁移记录见 [Learning 数据库](../learning/database.md) 与台账 D-145）：业务音频生产/版本/发布事实统一归本域。
- 解决 [D-129](../../governance/design-register.md) 中「TTS 路由配置落表」遗留：TTS Provider/Model/Voice/Preset 归 TTS 服务维护，Audio 侧仅存 `audio_default_presets` 默认映射，Learning/Content 不再落 TTS 路由表。
- **与 D-127（Platform Media/Asset Infrastructure 为所有 `asset_id` 权威技术属主）的边界已裁决（D-152，frozen）**：`audio_asset_versions` 不再自持 `storage_key` / mime / size / checksum / codec 等文件事实，统一保存 `asset_id` logical UUID；物理文件生命周期（含删除重试）由 Asset Infrastructure 维护。Audio 只保留音频业务事实（版本关系、审核、发布、时长/采样率/声道等音频技术属性）。

## 数据库状态

- **9 张表字段级定稿 `frozen`**：字段、约束、索引见[数据库总览](database.md)。
- Media/Asset 边界（D-152）与 Operations operator 引用类型（D-153，统一 UUID）均已收口，无遗留未决项。
