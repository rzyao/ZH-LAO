# 提取音频方案定稿

_消息数：69　总字符：63579_


---

### [01] SYSTEM　status=finished_successfully

_(empty)_


---

### [02] SYSTEM　status=finished_successfully

_(empty)_


---

### [03] USER　status=finished_successfully

[设计音频生产域](chatgpt-conversation://6a935c18-6ae4-83ea-a292-78914bc8eddc)把产品方案和最终定稿提取出来，要完整


---

### [04] SYSTEM　status=finished_successfully

_(empty)_


---

### [05] SYSTEM　status=finished_successfully

_(empty)_


---

### [06] SYSTEM　status=finished_successfully

_(empty)_


---

### [07] ASSISTANT　status=finished_successfully

_(empty)_


---

### [08] ASSISTANT　status=finished_successfully

我会按“产品方案 → 关键裁决 → 最终数据模型/表结构 → 跨域契约 → 生命周期与约束 → 最终定稿结论”的顺序，把该会话里的**最终有效内容完整提取**出来；会剔除讨论中被否决、被后续结论覆盖的方案。


---

### [09] ASSISTANT　status=finished_successfully

The output of this plugin was redacted.


---

### [10] ASSISTANT　status=finished_successfully

_(empty)_


---

### [11] ASSISTANT　status=finished_successfully

目前已经恢复出最终 9 表和前半段关键裁决，包括审核拒绝、TTS Attempt、人工录音、Preset、R2 与文件保留策略。接下来我会把后半段状态机、版本与批处理规则补齐，再汇总成一份可作为权威稿使用的提取版。


---

### [12] ASSISTANT　status=finished_successfully

已经把会话中的几轮“采纳建议 → 全表审计 → 定稿”交叉核对过了。下面我会只保留**最终 9 表权威版本**，并明确排除另一些会话里出现过的 FFmpeg / Whisper / 通用媒体中心方案，避免串稿。


---

### [13] ASSISTANT　status=finished_successfully

_(empty)_


---

### [14] ASSISTANT　status=finished_successfully

_(empty)_


---

### [15] ASSISTANT　status=finished_successfully

_(empty)_


---

### [16] ASSISTANT　status=finished_successfully

可以。下面是我从你指定的 **[设计音频生产域]** 会话中，把后期“候选最终定稿 → 全表审计 → 定稿”后的有效内容重新整理出来的**完整提取版**。

我严格按一个原则处理：

> **以后期最终定稿为准。早期讨论中后来被修改、合并或否决的设计，不作为最终方案。**

尤其不会混入其他音频域会话里出现过的 FFmpeg、Whisper、通用 Media Center、原始/派生音频流水线等另一套设计。

---

# Audio Production Domain 最终产品方案与数据库定稿

## 一、Domain 最终名称与定位

最终 Domain：

**Audio Production Domain**

Schema：

```text
audio
```

它不是“媒体文件域”，而是：

> **统一负责业务音频的生产、生产版本、审核、发布、正式版本指针、失败重试、批量生产以及生产审计的业务 Domain。**

核心对象关系最终收敛为：

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
   └── official_asset_version_id
```

外围再增加：

```text
Task Events
Task Batches
Task Batch Items
Default Presets
```

最终固定 **9 张业务表**。

---

# 二、最终产品目标

## 1. 所有学习内容原则上都可以拥有音频

不是只给单词或句子做音频。

Learning 中任何需要发音的内容，都可以向 Audio Production Domain 请求音频。

Audio 不理解“单词表”“课文”“例句”等 Learning 内部业务模型，而是通过：

```text
source_domain
content_entity_type
content_entity_id
language_code
audio_role
```

定位一个业务音频需求。

---

## 2. 每一个逻辑音频位置最终只有一个“当前正式音频”

这里不是说历史上只能有一个文件。

而是：

```text
一个 Slot
    ↓
可以有多个历史 Asset Version
    ↓
但只有一个 official_asset_version_id
```

因此：

> **当前正式音频只有一个，历史版本可以有很多。**

旧正式版本被新版本替换以后：

- 不再作为 current official 使用；
- 数据仍然保留；
- 已经正式发布过的文件永久保留；
- 数据模型允许未来做回滚；
- V1 暂不提供回滚入口。

---

# 三、Learning 与 Audio 的最终职责边界

最终采用的是：

> **Learning 发起需求 → Audio 独立完成生产 → Audio 返回正式资产。**

即之前确认的 **C 模式**。

### Learning Domain 拥有

Learning 拥有 canonical 内容事实，包括：

- 当前内容；
- 内容 Revision；
- 规范发音；
- 与发音相关的 canonical 输入。

Audio **不能成为规范发音知识的 owner**。

---

### Audio Production Domain 拥有

Audio 保存的是：

> **“当时生产这个音频时到底使用了什么输入”的快照。**

所以 Task 中最终保留：

```text
content_revision_id
text_snapshot
pronunciation_snapshot
audio_input_hash
```

这样即使 Learning 后来修改内容，也可以知道：

> 这个历史音频当时究竟是根据什么内容生产出来的。

---

# 四、音频 freshness / stale 最终模型

这是最终方案中一个很重要的设计。

`audio_slots` 保存当前需求：

```text
required_content_revision_id
required_audio_input_hash
```

Asset Version 保存它生产时使用的：

```text
content_revision_id
audio_input_hash
```

因此可以判断：

```text
slot.required_audio_input_hash
        ==
official_asset.audio_input_hash
```

以及 Revision 是否一致。

一致：

```text
fresh
```

不一致：

```text
stale
```

最终裁决是：

> **stale 不清空 `official_asset_version_id`。**

也就是说数据库仍然知道：

> 上一个正式音频是谁。

但业务层可以禁止继续播放这个已经失效的正式版本，并发起重新生产。

这比把 official pointer 清空更容易审计和追踪历史。

---

# 五、最终生产方式

最终 V1 有两种：

```text
tts
human_recording
```

即：

> **TTS 为主，人工录音兜底。**

人工录音不是独立的一套版本、审核、发布模型。

TTS 和人工录音在产物生成以后统一进入：

```text
Asset Version
      ↓
Review
      ↓
Publish
```

---

# 六、TTS 最终产品方案

## TTS Provider / Model / Voice 不归 Audio 管

这是最终明确裁掉的一块。

Audio Production Domain **不维护**：

```text
TTS providers
TTS models
TTS voices
TTS preset parameters
TTS preset parameter history
```

这些由 **TTS 服务自己维护**。

---

## Audio 只认识 Preset Key

例如：

```text
zh_word_normal
zh_sentence_slow
lo_word_normal
```

Audio Task 只保存：

```text
tts_preset_key
```

因此生产历史可以知道：

> 当时使用的是哪个 preset。

但 Audio 不复制：

```text
model_id
voice_id
temperature
speed
provider
模型参数
```

---

## Preset 最终规则

最终确认：

- Preset 由 TTS 自行维护；
- Audio 不保留 Preset 参数版本历史；
- Preset 可以直接修改；
- 生产人员不需要看到具体模型；
- 一个 Preset 在 TTS 内对应一个确定的 Model / Voice 配置；
- 管理员生产时主要选择 Preset，而不是底层模型。

因此：

> Audio 保存的是 preset key 的历史使用事实，而不是 TTS 配置快照。

---

# 七、Default Preset 最终方案

虽然 TTS 自己维护 Preset，但 Audio 仍然需要知道：

> 某类内容默认应该选哪个 Preset。

因此最终保留：

```text
audio_default_presets
```

它不是 TTS 配置表。

它只是：

> **Audio 后台的默认选择映射。**

维度为：

```text
source_domain
content_entity_type
language_code
audio_role
```

映射到：

```text
default_tts_preset_key
```

例如概念上可以是：

```text
learning
word
zh-CN
pronunciation
    ↓
zh_word_normal
```

管理员仍然允许改选别的 Preset。

---

# 八、TTS 执行最终模型

最终采用：

> **异步 TTS。**

不是 Audio HTTP 请求阻塞等待整个音频生成完成。

完整概念流程：

```text
Audio Task
    ↓
Generation Attempt
    ↓
TTS submit
    ↓
external job
    ↓
TTS processing
    ↓
TTS 上传 R2
    ↓
Audio 得到最终文件 metadata
    ↓
Asset Version
```

---

# 九、Attempt 最终定义

这里经过了多轮讨论，最终必须以审计后的结论为准：

> **`audio_generation_attempts` 仅表示 TTS 异步执行 Attempt。**

所以最终不是：

```text
所有 production attempt
```

而是：

```text
TTS generation attempt
```

---

## 同一 Task 可以有多个 Attempt

例如：

```text
Task #A
  ├── Attempt 1 → network failure
  ├── Attempt 2 → TTS timeout
  └── Attempt 3 → succeeded
```

技术失败重试：

> **仍然属于同一个 Task。**

不能因为一次 API 超时就创建新的业务生产 Task。

---

# 十、生产失败和审核失败严格分开

这是你明确要求的最终原则。

### TTS 技术失败

例如：

```text
timeout
provider unavailable
network error
invalid response
external job failure
```

属于：

```text
Generation Attempt failure
```

Task 可以进入：

```text
production_failed
```

以后仍然可以继续在**同一 Task**下面增加 Attempt。

---

### 审核不通过

例如：

```text
发音错误
语速过快
语速过慢
噪音
截断
文本不匹配
```

这不是 technical failure。

最终是：

```text
Review rejected
      ↓
当前 Task → rejected
      ↓
创建 successor Task
```

因此：

> **技术失败重试 = 同 Task 新 Attempt。**

> **内容质量审核失败 = 旧 Task 结束，创建 successor Task。**

---

# 十一、Reject 后不自动重新调用 TTS

这是明确确认过的。

审核员 Reject 后：

```text
Task A → rejected
```

系统可以建立：

```text
Task B.predecessor_task_id = Task A.id
```

但：

> **不会因为 Reject 就自动调用 TTS。**

也就是说：

```text
reject ≠ auto regenerate
```

生产人员/系统后续再决定怎么处理 successor task。

---

# 十二、每次只生产一个候选

最终不做：

```text
一次生成 3 个
一次生成 5 个
候选 A/B/C
审核员挑一个
```

而是：

> **每次生产只产生一个候选音频。**

如果不好，就重新生产。

---

# 十三、每个 Asset Version 只有一个文件

最终明确：

> **一个音频 Asset Version = 一个文件。**

不在同一个版本中保存：

```text
mp3 + wav + ogg
```

等多格式变体。

---

## 但格式不固定

最终不是强制全平台只有 MP3。

不同音频可以是不同格式。

Asset Version 自己保存：

```text
file_format
mime_type
codec
```

因此：

```text
Asset A → mp3
Asset B → wav
Asset C → 其他允许格式
```

都可以。

但每个 Asset Version 本身仍然只有一个文件。

---

# 十四、Cloudflare R2 最终方案

最终统一存储后端：

> **Cloudflare R2。**

TTS 与人工录音共用同一个 R2 体系。

---

## TTS 上传责任

最终裁决：

> **TTS 生成完成后，由 TTS 服务自己上传 Cloudflare R2。**

不是：

```text
TTS → 把巨大音频传回 Audio API → Audio 再上传 R2
```

而是：

```text
TTS
 ↓
R2
 ↓
把 object metadata / result 返回 Audio
```

---

## TTS 不保存额外原始文件

明确确认：

> TTS 服务不长期保留自己的一份“原始生成文件”。

成功上传 R2 后，R2 中的对象就是 Audio Production 流程使用的生产文件。

---

# 十五、人工录音最终方案

人工录音由：

> **管理员主动触发。**

不是普通用户参与的 UGC 录音流程。

管理员可以：

```text
开始录音
试听
重录
试听
……
最终提交
```

试听/重录阶段不是正式生产历史。

只有正式提交以后，才进入 Audio 的业务生产记录。

但最终数据库审计又进一步收敛为：

> `audio_generation_attempts` 只负责 TTS。

所以最终人工录音的产物表现为：

```text
human_recording Task
        ↓
Asset Version
```

其中：

```text
generation_attempt_id = NULL
producer_operator_id = 录音管理员
```

而不是伪造一条 TTS Generation Attempt。

这条是**后期最终定稿覆盖前期讨论**后的结果。

---

# 十六、人工录音必须记录录音人

明确确认：

> **需要记录是谁录的。**

最终落在 Asset Version：

```text
producer_operator_id
```

它是 Operations Domain 的 logical UUID。

不建立跨 Domain physical FK。

---

# 十七、审核产品方案

前期：

> **全部人工审核。**

以后系统成熟后：

> 可以增加自动质检，并允许符合规则的资产自动进入批准/发布流程。

但当前数据模型必须提前支持这个演进，而不能把“审核 = 某个管理员点按钮”写死在 Asset Version 本身。

因此最终保留独立：

```text
audio_reviews
```

---

# 十八、Review 与 Publish 严格分离

这是最终模型的核心。

```text
生产完成
   ↓
pending_review
   ↓
approved
```

只表示：

> 音频质量审核通过。

它**不等于正式上线**。

随后还需要：

```text
publish
```

发布动作最终改变：

```text
audio_slots.official_asset_version_id
```

因此：

```text
approved ≠ published
```

---

# 十九、正式版本的唯一事实源

最终只有一个：

```text
audio_slots.official_asset_version_id
```

它是：

> **某 Slot 当前正式音频的唯一 canonical pointer。**

不再额外维护：

```text
is_current
is_official
is_primary
current_version=true
```

等重复事实。

---

# 二十、旧正式版本如何处理

新 Asset 发布：

```text
Slot official → V1
```

然后：

```text
发布 V2
```

变成：

```text
Slot official → V2
```

V1：

- 不再 current；
- Asset Version 行继续保留；
- 文件继续保留；
- `first_published_at` 可以证明它历史上正式发布过。

因此历史版本完整可审计。

---

# 二十一、已发布版本永久保留

最终策略区分：

### 从未发布且审核拒绝

文件可以删除。

### 曾经正式发布

文件永久保留。

即使已经被新版本替代，也不能按“现在不用了”直接清除。

---

# 二十二、审核拒绝的文件处理

最终确认：

> **Rejected Asset 的实际音频文件不长期保留。**

但不是同步审核 API 中直接做 R2 delete。

采用：

```text
Review Reject
    ↓
asset.file_status = pending_delete
    ↓
异步删除 R2 object
    ↓
deleted
```

失败则：

```text
delete_failed
```

继续重试。

---

## 不增加 cleanup jobs 表

最终明确：

> Reject 文件异步清理，但 V1 不单独增加 cleanup job table。

删除重试状态直接保存在 Asset Version 中：

```text
delete_attempt_count
next_delete_retry_at
last_delete_error
```

---

# 二十三、Review 历史不可覆盖

不能在 Asset Version 上简单做：

```text
review_status = approved
```

然后未来修改掉就失去历史。

最终采用：

```text
audio_reviews
```

每一次审核动作新增一行。

例如：

```text
review #1 approved
review #2 approval_revoked
review #3 approved
```

历史永久存在。

Asset Version 上的 `review_status`：

> 是当前审核状态 projection。

Review 表：

> 是审核事实历史。

---

# 二十四、Reject Reason 最终正式枚举

最终：

```text
pronunciation_error
speed_too_fast
speed_too_slow
noise
clipping
truncated
text_mismatch
other
```

另外：

```text
remark
```

保存补充说明。

规则：

```text
decision = rejected
→ reject_reason 必填
```

非 rejected：

```text
reject_reason 必须为空
```

---

# 二十五、Approval Revoked

Review decision 最终支持：

```text
approved
rejected
approval_revoked
```

其中：

```text
approval_revoked
```

要求填写：

```text
remark
```

但最终明确：

> **Approval revoke 主要用于正式发布前。**

已经正式发布的音频，不靠修改 Review 来表达“撤回正式版本”。

正式版本切换由：

```text
official_asset_version_id
```

控制。

---

# 二十六、最终 9 张表

最终固定，不再增删：

| # | 表 |
|---|---|
| 1 | `audio.audio_slots` |
| 2 | `audio.audio_tasks` |
| 3 | `audio.audio_generation_attempts` |
| 4 | `audio.audio_asset_versions` |
| 5 | `audio.audio_reviews` |
| 6 | `audio.audio_task_events` |
| 7 | `audio.audio_task_batches` |
| 8 | `audio.audio_task_batch_items` |
| 9 | `audio.audio_default_presets` |

下面是逐表最终定稿。

---

# 二十七、`audio.audio_slots`

## 定位

代表：

> **某个业务对象的某种逻辑音频槽位。**

不是具体文件。

一个内容可以因为：

```text
language_code
audio_role
```

不同而拥有多个 Slot。

---

## 最终字段

```text
id UUID PK

source_domain
content_entity_type
content_entity_id UUID

language_code
audio_role

required_content_revision_id UUID
required_audio_input_hash

status

official_asset_version_id UUID NULL
```

---

## status

最终：

```text
active
offline
```

不靠物理删除表示 Slot 停用。

---

## 业务唯一约束

```text
UNIQUE (
    source_domain,
    content_entity_type,
    content_entity_id,
    language_code,
    audio_role
)
```

因此同一个：

```text
业务对象
+ language
+ audio_role
```

只有一个 Slot。

---

## official pointer 约束

`official_asset_version_id` 必须引用：

> **属于同一个 Slot 的 Asset Version。**

最终要求用 Domain 内 composite FK / equivalent constraint 保证，不能让：

```text
Slot A
```

错误引用：

```text
Slot B 的 Asset Version
```

---

## 最终索引

确认保留：

```text
(content_entity_type, content_entity_id)

(status)
```

---

# 二十八、`audio.audio_tasks`

## 定位

一个 Task 表示：

> **一次业务层面的音频生产意图。**

不是一次 HTTP 调用，也不是一次 TTS retry。

---

## 最终字段

```text
id UUID PK

slot_id UUID FK

predecessor_task_id UUID NULL

production_method

status

content_revision_id UUID
text_snapshot
pronunciation_snapshot
audio_input_hash

tts_preset_key NULL

assignee_operator_id UUID NULL
created_by_operator_id UUID

client_idempotency_key

lock_version

created_at
started_at
completed_at
updated_at
```

---

## production_method

最终 V1：

```text
tts
human_recording
```

---

## Task status 最终完整枚举

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

早期讨论里的：

```text
needs_regeneration
```

最终没有作为 Task 主状态保留下来。

最终用：

```text
rejected Task
    ↓
successor Task
```

表达。

---

## 每个 Slot 同时只能存在一个活动 Task

最终 PostgreSQL partial UNIQUE 覆盖：

```text
pending_assignment
assigned
producing
pending_review
production_failed
approved
```

即逻辑上：

```text
UNIQUE(slot_id)
WHERE status IN (
    'pending_assignment',
    'assigned',
    'producing',
    'pending_review',
    'production_failed',
    'approved'
)
```

注意这里连：

```text
approved
```

也属于尚未完全退出生产流程的 active 状态，因为它还没有 publish。

---

## `predecessor_task_id`

主要用于：

```text
Task A
审核 reject
   ↓
Task B.predecessor_task_id = A.id
```

建立重新生产链。

---

## `client_idempotency_key`

用于 Task 创建接口幂等。

防止客户端重试造成重复 Task。

---

## `lock_version`

最终保留，用于：

> optimistic concurrency control。

避免两个后台操作同时修改 Task 状态造成覆盖。

---

# 二十九、`audio.audio_generation_attempts`

## 定位

最终非常明确：

> **只记录 TTS 异步执行 Attempt。**

人工录音不走这个表。

---

## 最终字段

```text
id UUID PK

task_id UUID FK

attempt_no

request_id
external_job_id NULL

status

transport_retry_count
next_retry_at
lease_until

failure_code NULL
failure_message NULL

created_at
submitted_at NULL
completed_at NULL
```

---

## Attempt status

最终：

```text
queued
submitting
processing
retry_wait
succeeded
failed
dead_letter
canceled
```

---

## 唯一约束

```text
UNIQUE(task_id, attempt_no)
```

确保 Attempt 序号不重复。

```text
UNIQUE(request_id)
```

确保向 TTS 发请求的幂等。

对非空：

```text
external_job_id
```

使用 partial UNIQUE。

---

## 重试语义

网络或提交层重试可以在 Attempt 内体现：

```text
transport_retry_count
next_retry_at
```

真正重新生成则增加新的 Attempt。

---

# 三十、`audio.audio_asset_versions`

这是最终音频产物事实表。

## 最终字段

```text
id UUID PK

slot_id UUID NOT NULL
task_id UUID NOT NULL

version INT

generation_attempt_id UUID NULL
producer_operator_id UUID NULL

content_revision_id UUID
audio_input_hash

storage_key

file_format
mime_type
codec NULL

size_bytes
checksum_sha256
duration_ms

sample_rate_hz NULL
channels NULL

review_status
file_status

first_published_at NULL

delete_attempt_count
next_delete_retry_at
last_delete_error

created_at
updated_at
```

---

## version

版本号：

> **按 Slot 独立递增。**

例如：

```text
Slot A
V1
V2
V3
```

另一个 Slot 可以同时：

```text
Slot B
V1
```

---

## 最终唯一约束

```text
UNIQUE(slot_id, version)
```

```text
UNIQUE(task_id)
```

意味着最终一个 Task 只产生一个候选 Asset Version。

---

对：

```text
generation_attempt_id
```

非空时：

```text
UNIQUE(generation_attempt_id)
```

保证成功 Generation Attempt 不会形成多个 Asset Version。

---

```text
UNIQUE(storage_key)
```

避免两个资产行指向同一个 R2 对象。

---

## production source 的最终约束

### TTS Asset

必须：

```text
generation_attempt_id IS NOT NULL
```

### Human Recording Asset

必须：

```text
generation_attempt_id IS NULL
producer_operator_id IS NOT NULL
```

---

## `review_status`

最终：

```text
pending_review
approved
rejected
```

它是当前状态 projection。

真正审核事实记录在：

```text
audio_reviews
```

---

## `file_status`

最终：

```text
present
pending_delete
delete_failed
deleted
```

---

## Asset 中明确不保存的东西

最终审计删除：

```text
validity
source_type
preset configuration
```

生产来源从 Task / Attempt 关系推导。

Preset 使用事实在：

```text
audio_tasks.tts_preset_key
```

不在 Asset 重复保存。

---

# 三十一、`audio.audio_reviews`

## 最终字段

```text
id UUID PK

asset_version_id UUID NOT NULL FK

reviewer_operator_id UUID NOT NULL

decision

reject_reason NULL
remark NULL

request_id

created_at
```

---

## decision

```text
approved
rejected
approval_revoked
```

---

## reject_reason

```text
pronunciation_error
speed_too_fast
speed_too_slow
noise
clipping
truncated
text_mismatch
other
```

---

## CHECK 语义

```text
decision = rejected
→ reject_reason NOT NULL
```

否则：

```text
reject_reason IS NULL
```

另外：

```text
decision = approval_revoked
→ remark NOT NULL
```

---

## 幂等

```text
request_id UNIQUE
```

审核请求重复提交不能重复产生事实。

---

## 审核事实不可覆盖

最终规定：

> 每次审核动作 INSERT 新 Review。

不能 UPDATE 老 Review 改历史。

---

# 三十二、`audio.audio_task_events`

## 定位

> **Task 生命周期审计日志。**

它是：

```text
append-only audit log
```

但明确：

> **不是 Event Sourcing。**

当前事实仍然由：

```text
audio_tasks.status
audio_asset_versions.review_status
audio_slots.official_asset_version_id
```

持有。

---

## 最终字段

```text
id UUID PK

task_id UUID FK

event_type

actor_type
actor_id UUID NULL

from_status NULL
to_status NULL

request_id

payload JSONB NULL

created_at
```

---

## actor_type

```text
operator
system
tts
```

---

## 最终 Event 类型

```text
task_created
assigned
production_started
production_retry
production_failed
asset_created
review_approved
review_rejected
review_revoked
successor_created
published
canceled
```

---

## 幂等

```text
request_id UNIQUE
```

---

## 索引

最终确认：

```text
(task_id, created_at)
(event_type, created_at)
```

---

## 不记录什么

最终审计后限定：

> `audio_task_events` 只记录 Task 生命周期。

所以不往里面硬塞：

```text
slot_offlined
slot_activated
default_preset_changed
```

这些不是 Task Event。

---

# 三十三、`audio.audio_task_batches`

## 定位

只负责：

> **批量创建 Audio Tasks。**

不是一个长期跟踪所有子任务执行进度的“Workflow”。

---

## 最终字段

```text
id UUID PK

production_method

tts_preset_key NULL

client_idempotency_key

request_hash

status

requested_count
created_count
skipped_count
failed_count

created_by_operator_id

created_at
completed_at NULL
```

---

## status

最终：

```text
creating
completed
failed
canceled
```

---

## 重要语义

Batch 只跟踪：

> 批量创建 Task 这个动作是否完成。

一旦 Task 创建结束：

```text
batch = completed
```

以后其中某个 Task：

```text
producing
failed
approved
published
```

不会反向改变 Batch 状态。

---

# 三十四、Batch 幂等

最终采用：

```text
client_idempotency_key UNIQUE
```

同时保存：

```text
request_hash
```

规则：

### 相同 key + 相同 request_hash

返回原 Batch 结果。

### 相同 key + 不同 request_hash

直接拒绝。

防止错误复用 Idempotency Key。

---

# 三十五、`audio.audio_task_batch_items`

## 最终字段

```text
id UUID PK

batch_id UUID FK

item_no

slot_id UUID NULL
task_id UUID NULL

result_status

result_code NULL
result_message NULL

created_at
```

---

## result_status

```text
created
skipped
failed
```

---

## 唯一约束

```text
UNIQUE(batch_id, item_no)
```

并允许/建议对同一 Batch 中非空 `slot_id` 防重复。

---

## created 状态约束

如果：

```text
result_status = created
```

则必须至少已经解析出：

```text
slot_id
task_id
```

不能出现：

```text
created
但 task_id=NULL
```

这种不完整事实。

---

# 三十六、`audio.audio_default_presets`

## 最终字段

```text
id UUID PK

source_domain
content_entity_type
language_code
audio_role

default_tts_preset_key

enabled

created_at
updated_at
```

---

## 唯一约束

```text
UNIQUE (
    source_domain,
    content_entity_type,
    language_code,
    audio_role
)
```

特别注意：

> `source_domain` 必须进入唯一键。

避免未来两个 Domain 使用相同：

```text
content_entity_type
```

发生冲突。

---

## 生命周期

这张表不是历史事实表。

它表示：

> **当前默认配置。**

因此允许：

```text
UPDATE
DELETE
```

历史 Task 不受影响。

因为 Task 已经保存：

```text
tts_preset_key
```

---

# 三十七、最终 ID / FK 规则

Audio Domain 最终采用：

> **UUID 主键。**

9 张表内部实体都是稳定 UUID。

---

## Domain 内

建立真正 physical FK。

例如：

```text
task.slot_id → audio_slots.id
attempt.task_id → audio_tasks.id
asset.task_id → audio_tasks.id
review.asset_version_id → audio_asset_versions.id
```

并采用数据库约束保护一致性。

---

## 跨 Domain

全部使用：

> **stable logical UUID reference。**

不建立 physical FK。

例如：

```text
content_entity_id
content_revision_id
assignee_operator_id
created_by_operator_id
reviewer_operator_id
producer_operator_id
```

Audio 不跨 schema 建数据库 FK 去绑：

```text
Learning
Operations
```

---

# 三十八、最终并发原则

最终模型中并发主要由三层控制：

```text
业务唯一约束
+
Idempotency Key
+
lock_version
```

### Slot 级并发

partial UNIQUE 防止同一个 Slot 同时出现两个 active Tasks。

### 请求重试

`client_idempotency_key` / `request_id` 防重复。

### Task 修改

`lock_version` 做 optimistic locking。

### TTS Job

`request_id`、`external_job_id`、`lease_until` 等处理 worker / callback 并发。

---

# 三十九、最终发布流程

完整正式流程可以归纳为：

```text
Learning 内容发生音频需求
          ↓
Audio Slot
          ↓
判断 official asset 是否 fresh
          ↓
没有 / stale
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
       Audio Review
       /          \
 approved        rejected
    ↓               ↓
Task approved     Task rejected
    ↓               ↓
 Publish       R2 文件异步删除
    ↓               ↓
slot.official   successor Task
    ↓
Task published
```

---

# 四十、正式发布时的核心事务

最终业务事实要求可以理解为一次原子操作：

```text
确认 Asset approved
        ↓
更新 asset.first_published_at
        ↓
切换 slot.official_asset_version_id
        ↓
Task → published
        ↓
写 published Task Event
```

核心原则：

> 不能出现“Task 已 published，但 Slot 仍然指向旧版本”的半完成状态。

---

# 四十一、文件生命周期最终模型

最终可以归纳为：

### TTS 成功

```text
TTS 生成
 ↓
TTS 上传 R2
 ↓
Asset Version.file_status = present
```

### 人工录音成功

```text
管理员提交
 ↓
上传同一套 R2
 ↓
Asset Version.file_status = present
```

### Reject

```text
present
 ↓
pending_delete
 ↓
deleted
```

失败：

```text
pending_delete
 ↓
delete_failed
 ↓
retry
```

### 曾经发布

不执行上述清理。

文件永久保留。

---

# 四十二、最终删除策略

### Slot

不用时：

```text
status = offline
```

而不是随意删除历史。

### Task

属于生产业务事实，保留。

### Generation Attempt

保留技术执行历史。

### Asset Version

记录永久保留。

Rejected Asset 的**文件**可以删，但 Asset Version 行仍然用于审计。

### Review

append-only，不删除历史。

### Task Event

append-only。

### Batch / Batch Item

作为批处理记录保留。

### Default Preset

是 current configuration，可以 UPDATE / DELETE。

---

# 四十三、最终明确删除/不建立的概念

最终审计后没有把下面这些再拆成正式业务表：

```text
TTS Providers
TTS Models
TTS Voices
TTS Preset parameter/history tables
Audio cleanup jobs
独立 Publish history table
独立 current audio table
独立 official audio table
独立 regeneration table
独立 human recording attempt table
独立 file-format variant table
```

也没有把：

```text
is_current
is_primary
is_official
```

这种容易制造双重事实源的字段散落到 Asset Version 上。

---

# 四十四、最终几个“唯一事实源”

整个设计最后真正收敛得比较干净，关键 canonical facts 分别只有一个 owner：

| 事实 | 唯一 owner |
|---|---|
| 内容/规范发音 | Learning |
| 当前音频需求 revision/hash | `audio_slots` |
| 一次生产意图 | `audio_tasks` |
| TTS 技术执行 | `audio_generation_attempts` |
| 音频版本 | `audio_asset_versions` |
| 审核事实 | `audio_reviews` |
| 当前审核状态 | `audio_asset_versions.review_status` |
| 当前正式音频 | `audio_slots.official_asset_version_id` |
| TTS Preset 实际定义 | TTS 服务 |
| 某任务使用的 Preset | `audio_tasks.tts_preset_key` |
| 当前默认 Preset 映射 | `audio_default_presets` |
| Task 操作审计 | `audio_task_events` |

这也是最后全表审计时主要消除的重复事实源。

---

# 四十五、最终核心不变量

最终数据库和 Domain Service 必须共同保证：

```text
一个 Slot 只有一个当前 official asset。
```

```text
一个 Slot 同时最多只有一个 active production Task。
```

```text
一个 Task 最终最多形成一个 Asset Version。
```

```text
一个 Generation Attempt 最多形成一个 Asset Version。
```

```text
一个 Asset Version 只有一个实际文件。
```

```text
Asset 的 official pointer 必须属于同一 Slot。
```

```text
审核 Reject 与技术 production failure 是两种完全不同的事实。
```

```text
技术失败 → 同 Task 新 Attempt。
```

```text
审核 Reject → Task 结束 + successor Task。
```

```text
approved 不等于 published。
```

```text
published/current 的唯一判断依据是 Slot official pointer。
```

```text
Learning 内容变化不篡改历史 Audio Task / Asset。
```

```text
历史任务必须能够还原当时的生产输入。
```

---

# 四十六、最终产品层一句话定义

整个 Audio Production Domain 最终可以压缩成：

> **Learning 提供需要发音的业务对象及规范生产输入，Audio 为其建立稳定 Slot；通过 TTS 或人工录音创建一次生产 Task，TTS 技术重试通过 Attempt 保留历史，每个 Task 最终只形成一个不可变 Asset Version；资产经过独立 Review 后才能 Publish，Slot 的 `official_asset_version_id` 是全系统当前正式音频的唯一事实源；历史正式版本永久保存，Rejected 未发布文件异步清理；TTS 的 Provider/Model/Voice/Preset 配置归 TTS 服务维护，Audio 只保存实际使用的 Preset Key 与必要的生产快照。**

---

## 最终冻结结果

**Schema：**

```text
audio
```

**业务表数：9**

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

**主链路：**

```text
slot
 → task
 → generation_attempt（仅 TTS）
 → asset_version
 → review
 → publish
 → slot.official_asset_version_id
```

这就是该会话后期真正审计并定稿后的 **Audio Production Domain 产品方案 + 数据模型权威提取版**。前面讨论里后来被最终审计覆盖掉的 `needs_regeneration` 主状态、通用 Attempt、Preset 详情落 Audio、Rejected 文件长期保留等方案，都不应该再进入实现文档。 memcite


---

### [17] USER　status=finished_successfully

生成设计文档


---

### [18] ASSISTANT　status=finished_successfully

_(empty)_


---

### [19] ASSISTANT　status=finished_successfully

我会把刚才提取出的最终方案整理成一份可直接归档的正式设计文档，结构会包含：目标与边界、核心模型、9 张表、状态机、流程、约束、跨域契约、文件生命周期、并发与幂等、最终不变量。


---

### [20] ASSISTANT　status=finished_successfully

{"reason":"这是一个需要生成可下载设计文档的文件型任务，Work 模式更适合创建、排版并交付文档。","prompt":"请基于当前会话中已经提取完成的 Audio Production Domain 最终方案，生成一份正式中文设计文档。不要重新设计，不要混入其他会话方案。文档应完整覆盖：Domain 定位与职责边界、Learning/TTS/Operations 跨域契约、核心对象模型、fresh/stale 判定、TTS 与人工录音生产流程、审核与发布分离、文件生命周期、并发与幂等、状态机、最终 9 张表逐表设计（字段、类型建议、PK/FK/UNIQUE/CHECK/INDEX、生命周期语义）、批处理、Default Preset、最终不变量、明确不建立的表/概念。输出为排版专业的 DOCX，并提供下载链接。"}


---

### [21] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [22] ASSISTANT　status=finished_successfully

那我直接在当前对话里生成，不切换模式。会按正式架构文档来做，并以刚才整理出的最终定稿为唯一依据。


---

### [23] ASSISTANT　status=finished_successfully

bash -lc cat /home/oai/skills/docx/SKILL.md


---

### [24] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [25] ASSISTANT　status=finished_successfully

_(empty)_


---

### [26] ASSISTANT　status=finished_successfully

bash -lc fc-match 'Noto Sans CJK SC' | head -1 && fc-match 'Noto Serif CJK SC' | head -1 && fc-match 'DejaVu Sans Mono' | head -1


---

### [27] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [28] ASSISTANT　status=finished_successfully

_(empty)_


---

### [29] ASSISTANT　status=finished_successfully

我已经把文档结构固定下来：不是把聊天记录原样堆进去，而是整理成可以长期作为项目权威设计源的版本，同时保留所有最终裁决和数据库约束。


---

### [30] ASSISTANT　status=finished_successfully

bash -lc cat > /mnt/data/create_audio_design_doc.py <<'PY'
from docx import Document
from docx.shared import Mm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.text import WD_BREAK
from docx.enum.table import WD_ROW_HEIGHT_RULE
from docx.shared import Inches
from datetime import date

OUT = '/mnt/data/audio-production-domain-final-design.docx'

doc = Document()
sec = doc.sections[0]
sec.page_width = Mm(210)
sec.page_height = Mm(297)
sec.top_margin = Mm(18)
sec.bottom_margin = Mm(17)
sec.left_margin = Mm(20)
sec.right_margin = Mm(18)
sec.header_distance = Mm(8)
sec.footer_distance = Mm(8)

# Theme colors
NAVY = '183153'
BLUE = '2B5D8A'
LIGHT_BLUE = 'EAF2F8'
LIGHT_GRAY = 'F3F5F7'
MID_GRAY = 'D9E1E8'
DARK = RGBColor(35, 42, 52)
MUTED = RGBColor(95, 105, 115)
WHITE = RGBColor(255,255,255)

# Helpers

def set_cell_shading(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = tcPr.find(qn('w:shd'))
    if shd is None:
        shd = OxmlElement('w:shd')
        tcPr.append(shd)
    shd.set(qn('w:fill'), fill)


def set_cell_margins(cell, top=80, start=80, bottom=80, end=80):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = tcPr.first_child_found_in('w:tcMar')
    if tcMar is None:
        tcMar = OxmlElement('w:tcMar')
        tcPr.append(tcMar)
    for m, v in [('top', top), ('start', start), ('bottom', bottom), ('end', end)]:
        node = tcMar.find(qn(f'w:{m}'))
        if node is None:
            node = OxmlElement(f'w:{m}')
            tcMar.append(node)
        node.set(qn('w:w'), str(v))
        node.set(qn('w:type'), 'dxa')


def set_repeat_table_header(row):
    trPr = row._tr.get_or_add_trPr()
    tblHeader = OxmlElement('w:tblHeader')
    tblHeader.set(qn('w:val'), 'true')
    trPr.append(tblHeader)


def set_cell_text(cell, text, bold=False, color=None, size=9, font='Noto Sans CJK SC', mono=False):
    cell.text = ''
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(str(text) if text is not None else '')
    r.bold = bold
    r.font.size = Pt(size)
    r.font.name = 'DejaVu Sans Mono' if mono else font
    r._element.rPr.rFonts.set(qn('w:eastAsia'), 'Noto Sans CJK SC' if not mono else 'DejaVu Sans Mono')
    if color:
        r.font.color.rgb = color
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
    set_cell_margins(cell)


def add_table(headers, rows, widths=None, font_size=8.6):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.style = 'Table Grid'
    hdr = table.rows[0]
    set_repeat_table_header(hdr)
    for i,h in enumerate(headers):
        set_cell_shading(hdr.cells[i], NAVY)
        set_cell_text(hdr.cells[i], h, bold=True, color=WHITE, size=9)
        if widths:
            hdr.cells[i].width = Mm(widths[i])
    for ridx,row in enumerate(rows):
        cells = table.add_row().cells
        if ridx % 2 == 1:
            for c in cells:
                set_cell_shading(c, 'FAFBFC')
        for i,val in enumerate(row):
            set_cell_text(cells[i], val, size=font_size, mono=(i==0 and headers[0] in ('字段','状态','事件','约束')))
            if widths:
                cells[i].width = Mm(widths[i])
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table


def add_para(text='', style=None, bold_lead=None, keep=False):
    p = doc.add_paragraph(style=style) if style else doc.add_paragraph()
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.18
    p.paragraph_format.keep_together = keep
    if bold_lead and text.startswith(bold_lead):
        r1 = p.add_run(bold_lead)
        r1.bold = True
        r2 = p.add_run(text[len(bold_lead):])
    else:
        p.add_run(text)
    return p


def add_bullet(text, level=0):
    p = doc.add_paragraph(style='List Bullet' if level==0 else 'List Bullet 2')
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.12
    p.add_run(text)
    return p


def add_number(text, level=0):
    p = doc.add_paragraph(style='List Number' if level==0 else 'List Number 2')
    p.paragraph_format.space_after = Pt(2.5)
    p.add_run(text)
    return p


def add_code(text):
    p = doc.add_paragraph(style='CodeBlock')
    p.paragraph_format.keep_together = True
    for idx,line in enumerate(text.strip('\n').split('\n')):
        r = p.add_run(line)
        r.font.name = 'DejaVu Sans Mono'
        r._element.rPr.rFonts.set(qn('w:eastAsia'), 'DejaVu Sans Mono')
        r.font.size = Pt(8.7)
        if idx != len(text.strip('\n').split('\n'))-1:
            r.add_break()
    return p


def add_callout(title, body):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = t.cell(0,0)
    set_cell_shading(cell, LIGHT_BLUE)
    set_cell_margins(cell, top=120, start=140, bottom=120, end=140)
    cell.text=''
    p=cell.paragraphs[0]
    p.paragraph_format.space_after=Pt(3)
    r=p.add_run(title)
    r.bold=True; r.font.size=Pt(10.2); r.font.color.rgb=RGBColor(24,49,83)
    r.font.name='Noto Sans CJK SC'; r._element.rPr.rFonts.set(qn('w:eastAsia'),'Noto Sans CJK SC')
    p2=cell.add_paragraph()
    p2.paragraph_format.space_after=Pt(0); p2.paragraph_format.line_spacing=1.15
    r2=p2.add_run(body); r2.font.size=Pt(9.3); r2.font.name='Noto Sans CJK SC'; r2._element.rPr.rFonts.set(qn('w:eastAsia'),'Noto Sans CJK SC')
    doc.add_paragraph().paragraph_format.space_after=Pt(2)


def add_page_break():
    doc.add_page_break()

# Styles
styles = doc.styles
normal = styles['Normal']
normal.font.name = 'Noto Sans CJK SC'
normal._element.rPr.rFonts.set(qn('w:eastAsia'), 'Noto Sans CJK SC')
normal.font.size = Pt(10.3)
normal.font.color.rgb = DARK

for name, size, color, before, after in [
    ('Title', 28, NAVY, 0, 16),
    ('Heading 1', 18, NAVY, 10, 7),
    ('Heading 2', 14, BLUE, 8, 5),
    ('Heading 3', 11.5, NAVY, 6, 3),
]:
    st = styles[name]
    st.font.name = 'Noto Sans CJK SC'
    st._element.rPr.rFonts.set(qn('w:eastAsia'), 'Noto Sans CJK SC')
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.color.rgb = RGBColor.from_string(color)
    st.paragraph_format.space_before = Pt(before)
    st.paragraph_format.space_after = Pt(after)
    st.paragraph_format.keep_with_next = True

if 'CodeBlock' not in styles:
    cb = styles.add_style('CodeBlock', WD_STYLE_TYPE.PARAGRAPH)
else:
    cb = styles['CodeBlock']
cb.font.name = 'DejaVu Sans Mono'
cb._element.rPr.rFonts.set(qn('w:eastAsia'), 'DejaVu Sans Mono')
cb.font.size = Pt(8.7)
cb.paragraph_format.left_indent = Mm(5)
cb.paragraph_format.right_indent = Mm(5)
cb.paragraph_format.space_before = Pt(4)
cb.paragraph_format.space_after = Pt(5)
cb.paragraph_format.line_spacing = 1.0
pPr = cb._element.get_or_add_pPr()
shd = OxmlElement('w:shd'); shd.set(qn('w:fill'), LIGHT_GRAY); pPr.append(shd)

# Header/footer
header = sec.header
hp = header.paragraphs[0]
hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
hr = hp.add_run('Audio Production Domain · Final Design')
hr.font.size = Pt(8.3); hr.font.color.rgb = MUTED; hr.font.name='Noto Sans CJK SC'; hr._element.rPr.rFonts.set(qn('w:eastAsia'),'Noto Sans CJK SC')
footer = sec.footer
fp=footer.paragraphs[0]; fp.alignment=WD_ALIGN_PARAGRAPH.CENTER
fr=fp.add_run('FINAL · audio schema · 9 tables')
fr.font.size=Pt(8); fr.font.color.rgb=MUTED; fr.font.name='Noto Sans CJK SC'; fr._element.rPr.rFonts.set(qn('w:eastAsia'),'Noto Sans CJK SC')

# Cover
p=doc.add_paragraph()
p.paragraph_format.space_before=Pt(70)
p.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=p.add_run('Audio Production Domain')
r.font.name='Noto Sans CJK SC'; r._element.rPr.rFonts.set(qn('w:eastAsia'),'Noto Sans CJK SC'); r.font.size=Pt(30); r.font.bold=True; r.font.color.rgb=RGBColor.from_string(NAVY)
p2=doc.add_paragraph(); p2.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=p2.add_run('最终产品与数据库设计文档')
r.font.name='Noto Sans CJK SC'; r._element.rPr.rFonts.set(qn('w:eastAsia'),'Noto Sans CJK SC'); r.font.size=Pt(20); r.font.bold=True; r.font.color.rgb=RGBColor.from_string(BLUE)

p3=doc.add_paragraph(); p3.alignment=WD_ALIGN_PARAGRAPH.CENTER; p3.paragraph_format.space_before=Pt(22)
r=p3.add_run('Schema: audio  |  Status: FINAL  |  Tables: 9')
r.font.name='DejaVu Sans Mono'; r._element.rPr.rFonts.set(qn('w:eastAsia'),'DejaVu Sans Mono'); r.font.size=Pt(10); r.font.color.rgb=MUTED

p4=doc.add_paragraph(); p4.alignment=WD_ALIGN_PARAGRAPH.CENTER; p4.paragraph_format.space_before=Pt(90)
r=p4.add_run('权威来源：本会话中 Audio Production Domain 后期候选定稿、全表审计与最终定稿结论')
r.font.name='Noto Sans CJK SC'; r._element.rPr.rFonts.set(qn('w:eastAsia'),'Noto Sans CJK SC'); r.font.size=Pt(9.5); r.font.color.rgb=MUTED
p5=doc.add_paragraph(); p5.alignment=WD_ALIGN_PARAGRAPH.CENTER
r=p5.add_run('原则：后期定稿覆盖早期讨论；不引入其他会话中的音频/媒体架构方案。')
r.font.name='Noto Sans CJK SC'; r._element.rPr.rFonts.set(qn('w:eastAsia'),'Noto Sans CJK SC'); r.font.size=Pt(9.5); r.font.color.rgb=MUTED
add_page_break()

# Document control
h=doc.add_heading('文档控制', level=1)
add_table(['项目','内容'], [
    ('Domain 名称','Audio Production Domain'),
    ('Schema','audio'),
    ('状态','FINAL / 已定稿'),
    ('最终表数量','9'),
    ('主键策略','Audio Domain 内部实体统一使用 UUID 主键'),
    ('跨 Domain 引用','仅保存稳定 logical UUID，不建立跨 Domain physical FK'),
    ('设计目标','统一承载业务音频生产、版本、审核、发布、失败重试、批量生产与生产审计'),
], widths=[45,120], font_size=9.2)

add_callout('权威性说明', '本文档只整理已经定稿的最终方案。任何早期出现、但后续被修改、合并、裁掉或否决的结构，不应重新进入实现。')

# TOC-like
h=doc.add_heading('目录', level=1)
for x in [
    '1. Domain 定位与职责边界', '2. 产品核心概念与对象模型', '3. Fresh / Stale 模型',
    '4. 生产方式与 TTS 契约', '5. 审核、发布与版本管理', '6. 文件与 R2 生命周期',
    '7. 状态机与主流程', '8. 数据库总览与全局约束', '9. 九张表逐表设计',
    '10. 批处理设计', '11. 并发、幂等与事务', '12. 跨 Domain 契约',
    '13. 最终不变量', '14. 明确不建立的概念', '15. 实现验收清单'
]: add_bullet(x)
add_page_break()

# 1
h=doc.add_heading('1. Domain 定位与职责边界', level=1)
add_para('Audio Production Domain 不是通用媒体文件中心。它负责的是“业务音频从需求出现，到生产、审核、发布成为正式音频”的完整业务事实。')
add_para('其核心职责包括：音频 Slot 管理、生产 Task、TTS 异步执行 Attempt、音频 Asset Version、审核历史、正式版本切换、批量创建 Task、默认 Preset 选择，以及 Task 生命周期审计。')

h=doc.add_heading('1.1 Learning Domain 与 Audio Domain 的边界', level=2)
add_table(['职责','Owner','说明'], [
    ('canonical 内容事实','Learning','当前内容、内容 Revision、规范发音、与发音相关的 canonical 输入'),
    ('音频生产输入快照','Audio','保存“当时生产时使用了什么输入”，用于历史可追溯'),
    ('当前正式音频','Audio','由 audio_slots.official_asset_version_id 唯一表达'),
    ('音频是否需要重产','Audio + Learning 契约','通过 required revision/hash 与 official asset 的生产快照比较判定 fresh/stale'),
], widths=[42,38,86], font_size=8.9)
add_callout('核心边界', 'Learning 发起音频需求并拥有 canonical 内容；Audio 独立完成生产并拥有生产与发布事实。Audio 不能成为规范发音知识的 owner。')

h=doc.add_heading('1.2 TTS 服务与 Audio Domain 的边界', level=2)
add_para('TTS Provider、Model、Voice、Preset 参数及其内部版本由 TTS 服务自行维护。Audio 不复制这些配置，只在 Task 上保存当次使用的 tts_preset_key。')
add_bullet('Audio 不维护 TTS providers / models / voices。')
add_bullet('Audio 不保留 TTS Preset 参数快照或参数历史。')
add_bullet('Audio 只保存实际使用的 Preset Key，作为历史生产事实。')
add_bullet('TTS 成功后自行把最终音频对象上传到 Cloudflare R2，再把结果 metadata 返回 Audio。')

h=doc.add_heading('1.3 Operations Domain 的边界', level=2)
add_para('管理员、审核员、录音人、任务创建人等操作主体均通过 Operations Domain 的稳定 logical UUID 表示。Audio 只保存这些 UUID，不建立跨 Domain physical FK。')

# 2
h=doc.add_heading('2. 产品核心概念与对象模型', level=1)
add_code('''Audio Slot
   │
   ├── Audio Task
   │      │
   │      ├── Generation Attempt   ← 仅 TTS
   │      │
   │      └── Asset Version
   │              │
   │              └── Review
   │
   └── official_asset_version_id

外围：Task Events / Task Batches / Batch Items / Default Presets''')

h=doc.add_heading('2.1 Audio Slot', level=2)
add_para('Slot 表示一个稳定的“逻辑音频位置”，不是具体文件。它由业务对象、语言和 audio_role 共同确定。一个业务对象可以有多个 Slot，但相同定位组合只能有一个 Slot。')

h=doc.add_heading('2.2 Audio Task', level=2)
add_para('Task 表示一次业务层面的生产意图。技术 API 重试或 TTS timeout 不是新 Task；审核 Reject 后重新生产才创建 successor Task。')

h=doc.add_heading('2.3 Generation Attempt', level=2)
add_para('Generation Attempt 最终只表示 TTS 异步执行。人工录音不伪造 Attempt。一次 Task 可以因为技术失败拥有多个 Attempt。')

h=doc.add_heading('2.4 Asset Version', level=2)
add_para('Asset Version 表示一个不可变的实际音频候选版本。每个 Asset Version 只有一个实际文件；文件格式可以在不同 Asset 之间不同，但一个 Asset 不保存多格式变体。')

h=doc.add_heading('2.5 Review 与 Publish', level=2)
add_para('Review 是质量审核事实；Publish 是把某个已通过审核的 Asset Version 切换为 Slot 当前正式版本的动作。两者严格分离：approved 不等于 published。')
add_page_break()

# 3 Fresh/Stale
h=doc.add_heading('3. Fresh / Stale 模型', level=1)
add_para('Audio 必须在 Learning 内容发生变化后，能够判断当前正式音频是否仍与最新内容一致。因此最终采用 Revision + Input Hash 的双快照模型。')
add_table(['位置','字段','含义'], [
    ('audio_slots','required_content_revision_id','当前 Slot 所要求的 Learning 内容 Revision'),
    ('audio_slots','required_audio_input_hash','当前 Slot 所要求的音频输入哈希'),
    ('audio_tasks','content_revision_id / audio_input_hash','本次 Task 创建时的生产输入快照'),
    ('audio_asset_versions','content_revision_id / audio_input_hash','实际 Asset 生产时所使用的输入快照'),
], widths=[42,58,67], font_size=8.8)
add_code('''fresh:
slot.required_audio_input_hash == official_asset.audio_input_hash
且所需 Revision 与正式 Asset 的 Revision 一致

stale:
任一关键生产输入不再一致''')
add_callout('最终裁决', 'Slot 变为 stale 时，不清空 official_asset_version_id。数据库仍然知道上一个正式版本是谁；业务层可以禁止继续使用 stale 音频，并发起重新生产。')

# 4 Production
h=doc.add_heading('4. 生产方式与 TTS 契约', level=1)
h=doc.add_heading('4.1 最终生产方式', level=2)
add_table(['production_method','含义','Attempt'], [
    ('tts','通过外部 TTS 服务异步生产','使用 audio_generation_attempts'),
    ('human_recording','管理员人工录音兜底','不使用 Generation Attempt'),
], widths=[44,80,43], font_size=9)

h=doc.add_heading('4.2 Preset 模型', level=2)
add_para('Audio 只认识 tts_preset_key，例如 zh_word_normal、zh_sentence_slow、lo_word_normal。Preset 的 Provider / Model / Voice / 参数由 TTS 服务内部管理。')
add_para('audio_default_presets 只负责“某类音频默认选择哪个 preset key”，它不是 TTS 配置表。管理员在创建生产任务时可以改选其他 Preset。')

h=doc.add_heading('4.3 TTS 异步主流程', level=2)
add_code('''Audio Task
    ↓
Generation Attempt
    ↓
TTS submit
    ↓
external job / processing
    ↓
TTS 上传 Cloudflare R2
    ↓
Audio 接收最终 object metadata
    ↓
Asset Version''')
add_para('TTS 不需要长期保留额外“原始生成文件”。成功上传 R2 后，R2 中的对象就是 Audio Production 流程使用的生产文件。')

h=doc.add_heading('4.4 技术失败与审核失败', level=2)
add_table(['问题类型','示例','最终处理'], [
    ('TTS 技术失败','timeout、network、provider unavailable、external job failure','同一个 Task 下新增/重试 Generation Attempt；Task 可进入 production_failed'),
    ('内容质量失败','发音错误、语速不合适、噪音、截断、文本不匹配','Review rejected；旧 Task 结束；创建 successor Task'),
], widths=[36,62,69], font_size=8.8)
add_callout('不可混淆', '技术失败重试 = 同 Task；审核 Reject = 旧 Task 结束 + successor Task。Reject 不会自动再次调用 TTS。')

h=doc.add_heading('4.5 人工录音', level=2)
add_para('人工录音由管理员主动触发。录音过程中可以试听、重录，只有最终提交才进入正式生产事实。人工录音成功后直接形成 Asset Version：generation_attempt_id 为 NULL，producer_operator_id 记录录音管理员。')
add_page_break()

# 5 Review/Publish
h=doc.add_heading('5. 审核、发布与版本管理', level=1)
h=doc.add_heading('5.1 一次只生产一个候选', level=2)
add_para('V1 不做“一次生成多个候选再挑一个”的模型。一个 Task 最终最多形成一个 Asset Version；若质量不合格则结束旧 Task，并通过 successor Task 重新生产。')

h=doc.add_heading('5.2 审核历史不可覆盖', level=2)
add_para('每次审核动作向 audio_reviews INSERT 新事实。audio_asset_versions.review_status 只是当前状态 projection，不能替代审核历史。')
add_code('''Review #1  approved
Review #2  approval_revoked
Review #3  approved''')

h=doc.add_heading('5.3 Review decision', level=2)
add_table(['decision','含义','约束'], [
    ('approved','质量审核通过','reject_reason 必须为空'),
    ('rejected','质量审核不通过','reject_reason 必填'),
    ('approval_revoked','撤销此前批准，主要用于正式发布前','remark 必填'),
], widths=[42,68,57], font_size=8.9)

h=doc.add_heading('5.4 Reject Reason 枚举', level=2)
add_table(['值','说明'], [
    ('pronunciation_error','发音错误'),('speed_too_fast','语速过快'),('speed_too_slow','语速过慢'),('noise','噪音'),
    ('clipping','削波/爆音'),('truncated','音频截断'),('text_mismatch','文本与音频不匹配'),('other','其他，需要 remark 补充'),
], widths=[56,111], font_size=9)

h=doc.add_heading('5.5 正式版本唯一事实源', level=2)
add_callout('Canonical Pointer', '某个 Slot 当前正式音频的唯一事实源是 audio_slots.official_asset_version_id。Asset Version 不再维护 is_current / is_official / is_primary 等重复事实。')
add_para('新版本发布时只切换 Slot 的 official pointer。旧正式版本仍保留，first_published_at 证明它曾经正式发布。V1 暂不要求提供回滚入口，但数据模型保留完整历史，允许未来实现回滚。')

# 6 file lifecycle
h=doc.add_heading('6. 文件与 Cloudflare R2 生命周期', level=1)
add_para('TTS 与人工录音统一使用 Cloudflare R2。每个 Asset Version 对应一个唯一 storage_key。')
add_code('''生产成功：
present

审核 Reject 且从未发布：
present → pending_delete → deleted
                      ↘ delete_failed → retry

曾经发布：
文件永久保留，不进入 Reject 清理链''')
add_para('Reject 时不在审核 API 内同步删除 R2 对象。先把 Asset Version 标记为 pending_delete，再由异步清理逻辑执行删除。V1 不增加独立 cleanup jobs 表。')
add_table(['字段','用途'], [
    ('file_status','present / pending_delete / delete_failed / deleted'),
    ('delete_attempt_count','删除重试次数'),
    ('next_delete_retry_at','下一次允许清理的时间'),
    ('last_delete_error','最近一次删除失败原因'),
], widths=[56,111], font_size=9)
add_page_break()

# 7 states
h=doc.add_heading('7. 状态机与主流程', level=1)
h=doc.add_heading('7.1 Audio Task 状态', level=2)
add_table(['状态','语义'], [
    ('pending_assignment','等待分配生产人员/处理者'),
    ('assigned','已分配，尚未开始生产'),
    ('producing','正在生产'),
    ('pending_review','已形成候选 Asset，等待审核'),
    ('production_failed','技术生产失败，可在同 Task 下继续 Attempt'),
    ('approved','审核通过，但尚未正式 Publish'),
    ('rejected','审核拒绝，当前 Task 结束'),
    ('published','对应 Asset 已发布为 Slot 当前正式版本'),
    ('canceled','任务取消'),
], widths=[52,115], font_size=9)

h=doc.add_heading('7.2 Generation Attempt 状态', level=2)
add_table(['状态','语义'], [
    ('queued','已创建，等待提交'),('submitting','正在向 TTS 提交'),('processing','TTS 外部任务处理中'),
    ('retry_wait','传输/提交层等待重试'),('succeeded','本 Attempt 成功'),('failed','本 Attempt 失败'),
    ('dead_letter','达到失败上限，进入人工/死信处理'),('canceled','取消'),
], widths=[52,115], font_size=9)

h=doc.add_heading('7.3 Asset Review 状态', level=2)
add_table(['状态','语义'], [
    ('pending_review','尚未完成质量审核'),('approved','当前审核状态为通过'),('rejected','当前审核状态为拒绝'),
], widths=[52,115], font_size=9)

h=doc.add_heading('7.4 端到端主流程', level=2)
add_code('''Learning 内容产生音频需求
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
Task published''')

# 8 DB overview
h=doc.add_heading('8. 数据库总览与全局约束', level=1)
add_table(['#','表','职责'], [
    ('1','audio.audio_slots','逻辑音频槽位 + 当前正式 Asset 指针'),
    ('2','audio.audio_tasks','业务层一次音频生产意图'),
    ('3','audio.audio_generation_attempts','TTS 异步技术执行 Attempt'),
    ('4','audio.audio_asset_versions','不可变音频产物版本'),
    ('5','audio.audio_reviews','append-only 审核历史'),
    ('6','audio.audio_task_events','Task 生命周期 append-only 审计日志'),
    ('7','audio.audio_task_batches','批量创建 Task 的请求与结果'),
    ('8','audio.audio_task_batch_items','批量请求逐项结果'),
    ('9','audio.audio_default_presets','当前默认 Preset Key 映射'),
], widths=[12,66,89], font_size=8.8)

h=doc.add_heading('8.1 ID 与 FK 规则', level=2)
add_bullet('Audio Domain 内部 9 张表使用 UUID 主键。')
add_bullet('同一 Domain 内建立真实 physical FK，并使用数据库约束保护一致性。')
add_bullet('跨 Domain 字段只保存稳定 logical UUID，不建立跨 Domain physical FK。')
add_bullet('content_entity_id / content_revision_id 等跨域 ID 不允许指向另一个 Domain 的内部 BIGINT PK。')

h=doc.add_heading('8.2 活动 Task 唯一约束', level=2)
add_para('同一个 Slot 同时最多只能存在一个仍处于生产主流程中的 Task。最终 partial UNIQUE 的活动状态集合为：')
add_code("""pending_assignment
assigned
producing
pending_review
production_failed
approved""")
add_para('approved 仍属于 active 集合，因为审核通过后尚未 Publish。')
add_page_break()

# 9 table designs
h=doc.add_heading('9. 九张表逐表设计', level=1)

# slots
h=doc.add_heading('9.1 audio.audio_slots', level=2)
add_para('定位：某个业务对象、语言、audio_role 对应的稳定逻辑音频槽位。')
rows=[
('id','UUID','PK','Slot 稳定 ID'),
('source_domain','TEXT/VARCHAR','NOT NULL','来源 Domain，例如 learning'),
('content_entity_type','TEXT/VARCHAR','NOT NULL','来源业务实体类型'),
('content_entity_id','UUID','NOT NULL；跨域 logical ref','来源业务实体稳定 UUID'),
('language_code','TEXT/VARCHAR','NOT NULL','语言代码'),
('audio_role','TEXT/VARCHAR','NOT NULL','音频用途/角色'),
('required_content_revision_id','UUID','NOT NULL；跨域 logical ref','当前要求的内容 Revision'),
('required_audio_input_hash','TEXT/VARCHAR','NOT NULL','当前要求的音频输入哈希'),
('status','TEXT/ENUM','active / offline','Slot 生命周期状态'),
('official_asset_version_id','UUID','NULL；Domain 内 FK','当前正式 Asset Version'),
]
add_table(['字段','逻辑类型','约束','说明'], rows, widths=[47,30,46,44], font_size=7.9)
add_para('关键约束：')
add_bullet('UNIQUE(source_domain, content_entity_type, content_entity_id, language_code, audio_role)')
add_bullet('official_asset_version_id 必须引用属于同一 Slot 的 Asset Version，建议通过 Domain 内 composite FK / 等价数据库约束保证。')
add_bullet('索引：(content_entity_type, content_entity_id)；(status)。')
add_bullet('Slot 停用使用 status=offline，不以删除历史记录表达。')

# tasks
h=doc.add_heading('9.2 audio.audio_tasks', level=2)
add_para('定位：一次业务层面的音频生产意图。')
rows=[
('id','UUID','PK','Task 稳定 ID'),
('slot_id','UUID','NOT NULL；FK → audio_slots','所属 Slot'),
('predecessor_task_id','UUID','NULL；self FK','审核 Reject 后的前驱 Task'),
('production_method','TEXT/ENUM','tts / human_recording','生产方式'),
('status','TEXT/ENUM','见 Task 状态机','当前 Task 状态'),
('content_revision_id','UUID','NOT NULL；跨域 logical ref','创建 Task 时内容 Revision 快照'),
('text_snapshot','TEXT','按业务允许 NULL/NOT NULL','生产文本快照'),
('pronunciation_snapshot','TEXT/JSONB','按业务允许 NULL','生产时规范发音快照'),
('audio_input_hash','TEXT/VARCHAR','NOT NULL','本次生产输入哈希'),
('tts_preset_key','TEXT/VARCHAR','TTS 必填；人工录音为空','当次实际使用的 Preset Key'),
('assignee_operator_id','UUID','NULL；跨域 logical ref','当前任务处理人'),
('created_by_operator_id','UUID','NOT NULL；跨域 logical ref','创建任务的管理员/操作者'),
('client_idempotency_key','TEXT/VARCHAR','UNIQUE','创建 Task 接口幂等'),
('lock_version','INTEGER','NOT NULL','乐观并发控制版本'),
('created_at','TIMESTAMPTZ','NOT NULL','创建时间'),
('started_at','TIMESTAMPTZ','NULL','开始生产时间'),
('completed_at','TIMESTAMPTZ','NULL','业务完成时间'),
('updated_at','TIMESTAMPTZ','NOT NULL','更新时间'),
]
add_table(['字段','逻辑类型','约束','说明'], rows, widths=[47,30,46,44], font_size=7.7)
add_para('关键约束：同一 slot_id 在 pending_assignment / assigned / producing / pending_review / production_failed / approved 状态集合中最多一行。')
add_para('关键语义：技术失败重试不创建新 Task；Review rejected 后使用 predecessor_task_id 建立 successor Task 链。')

# attempts
h=doc.add_heading('9.3 audio.audio_generation_attempts', level=2)
add_para('定位：仅记录 TTS 异步执行 Attempt。')
rows=[
('id','UUID','PK','Attempt 稳定 ID'),
('task_id','UUID','NOT NULL；FK → audio_tasks','所属 TTS Task'),
('attempt_no','INTEGER','NOT NULL','同 Task 内递增序号'),
('request_id','TEXT/VARCHAR','UNIQUE','向 TTS 发起请求的幂等 ID'),
('external_job_id','TEXT/VARCHAR','NULL；非空 partial UNIQUE','TTS 外部任务 ID'),
('status','TEXT/ENUM','见 Attempt 状态机','当前执行状态'),
('transport_retry_count','INTEGER','NOT NULL','传输/提交层重试次数'),
('next_retry_at','TIMESTAMPTZ','NULL','允许下一次重试时间'),
('lease_until','TIMESTAMPTZ','NULL','worker lease / 防并发重复处理'),
('failure_code','TEXT/VARCHAR','NULL','失败代码'),
('failure_message','TEXT','NULL','失败详情'),
('created_at','TIMESTAMPTZ','NOT NULL','创建时间'),
('submitted_at','TIMESTAMPTZ','NULL','成功提交到 TTS 时间'),
('completed_at','TIMESTAMPTZ','NULL','Attempt 完成时间'),
]
add_table(['字段','逻辑类型','约束','说明'], rows, widths=[47,30,46,44], font_size=7.7)
add_bullet('UNIQUE(task_id, attempt_no)')
add_bullet('UNIQUE(request_id)')
add_bullet('external_job_id 非空时唯一。')
add_bullet('人工录音不写入此表。')

# assets
h=doc.add_heading('9.4 audio.audio_asset_versions', level=2)
add_para('定位：不可变的实际音频候选版本。每个版本只有一个文件。')
rows=[
('id','UUID','PK','Asset Version 稳定 ID'),
('slot_id','UUID','NOT NULL；FK → audio_slots','所属 Slot'),
('task_id','UUID','NOT NULL；UNIQUE；FK → audio_tasks','来源 Task；一 Task 最多一个 Asset'),
('version','INTEGER','NOT NULL','按 Slot 独立递增版本号'),
('generation_attempt_id','UUID','NULL；非空 UNIQUE；FK → attempts','TTS 生产来源'),
('producer_operator_id','UUID','NULL；跨域 logical ref','人工录音生产人'),
('content_revision_id','UUID','NOT NULL；跨域 logical ref','实际生产使用的 Revision'),
('audio_input_hash','TEXT/VARCHAR','NOT NULL','实际生产输入哈希'),
('storage_key','TEXT/VARCHAR','UNIQUE','Cloudflare R2 对象 key'),
('file_format','TEXT/VARCHAR','NOT NULL','例如 mp3 / wav；不同 Asset 可不同'),
('mime_type','TEXT/VARCHAR','NOT NULL','MIME 类型'),
('codec','TEXT/VARCHAR','NULL','编码格式'),
('size_bytes','BIGINT','NOT NULL','文件大小'),
('checksum_sha256','TEXT/VARCHAR','NOT NULL','SHA-256 校验值'),
('duration_ms','INTEGER/BIGINT','NOT NULL','时长毫秒'),
('sample_rate_hz','INTEGER','NULL','采样率'),
('channels','SMALLINT','NULL','声道数'),
('review_status','TEXT/ENUM','pending_review / approved / rejected','当前审核状态 projection'),
('file_status','TEXT/ENUM','present / pending_delete / delete_failed / deleted','实际文件生命周期状态'),
('first_published_at','TIMESTAMPTZ','NULL','首次正式发布时间'),
('delete_attempt_count','INTEGER','NOT NULL','清理重试次数'),
('next_delete_retry_at','TIMESTAMPTZ','NULL','下一次清理重试时间'),
('last_delete_error','TEXT','NULL','最近清理失败详情'),
('created_at','TIMESTAMPTZ','NOT NULL','创建时间'),
('updated_at','TIMESTAMPTZ','NOT NULL','更新时间'),
]
add_table(['字段','逻辑类型','约束','说明'], rows, widths=[47,30,46,44], font_size=7.45)
add_bullet('UNIQUE(slot_id, version)')
add_bullet('UNIQUE(task_id)')
add_bullet('generation_attempt_id 非空时 UNIQUE')
add_bullet('UNIQUE(storage_key)')
add_bullet('TTS Asset：generation_attempt_id 必须非空。')
add_bullet('Human Recording Asset：generation_attempt_id 必须为空，producer_operator_id 必须非空。')
add_bullet('不保存 validity / source_type / preset configuration；来源从 Task / Attempt 推导。')

# reviews
h=doc.add_heading('9.5 audio.audio_reviews', level=2)
rows=[
('id','UUID','PK','Review 事实 ID'),
('asset_version_id','UUID','NOT NULL；FK → asset_versions','被审核 Asset'),
('reviewer_operator_id','UUID','NOT NULL；跨域 logical ref','审核员'),
('decision','TEXT/ENUM','approved / rejected / approval_revoked','审核决策'),
('reject_reason','TEXT/ENUM','rejected 时必填','标准拒绝原因'),
('remark','TEXT','approval_revoked 时必填；其他场景可选','补充说明'),
('request_id','TEXT/VARCHAR','UNIQUE','审核动作幂等 ID'),
('created_at','TIMESTAMPTZ','NOT NULL','审核事实时间'),
]
add_table(['字段','逻辑类型','约束','说明'], rows, widths=[47,30,46,44], font_size=7.9)
add_bullet('每次审核动作 INSERT 新行，不覆盖历史。')
add_bullet('decision=rejected → reject_reason NOT NULL；否则 reject_reason IS NULL。')
add_bullet('decision=approval_revoked → remark NOT NULL。')

# events
h=doc.add_heading('9.6 audio.audio_task_events', level=2)
add_para('定位：Task 生命周期 append-only 审计日志；不是 Event Sourcing。')
rows=[
('id','UUID','PK','Event ID'),
('task_id','UUID','NOT NULL；FK → audio_tasks','所属 Task'),
('event_type','TEXT/ENUM','见事件枚举','事件类型'),
('actor_type','TEXT/ENUM','operator / system / tts','动作主体类型'),
('actor_id','UUID','NULL','主体 logical UUID；system/tts 可为空'),
('from_status','TEXT','NULL','状态变化前'),
('to_status','TEXT','NULL','状态变化后'),
('request_id','TEXT/VARCHAR','UNIQUE','事件写入幂等 ID'),
('payload','JSONB','NULL','补充审计上下文'),
('created_at','TIMESTAMPTZ','NOT NULL','事件发生时间'),
]
add_table(['字段','逻辑类型','约束','说明'], rows, widths=[47,30,46,44], font_size=7.8)
add_para('最终 event_type：task_created、assigned、production_started、production_retry、production_failed、asset_created、review_approved、review_rejected、review_revoked、successor_created、published、canceled。')
add_bullet('索引：(task_id, created_at)；(event_type, created_at)。')
add_bullet('不记录 slot_offlined、slot_activated、default_preset_changed 等非 Task 生命周期事件。')

# batches
h=doc.add_heading('9.7 audio.audio_task_batches', level=2)
add_para('定位：批量创建 Audio Tasks 的一次请求。Batch 不跟踪后续所有子 Task 的长期执行状态。')
rows=[
('id','UUID','PK','Batch ID'),
('production_method','TEXT/ENUM','tts / human_recording','本批默认生产方式'),
('tts_preset_key','TEXT/VARCHAR','TTS 时可用','本批默认 Preset'),
('client_idempotency_key','TEXT/VARCHAR','UNIQUE','批量创建请求幂等'),
('request_hash','TEXT/VARCHAR','NOT NULL','请求内容哈希，用于防 key 错误复用'),
('status','TEXT/ENUM','creating / completed / failed / canceled','仅表示批量创建阶段状态'),
('requested_count','INTEGER','NOT NULL','请求条数'),
('created_count','INTEGER','NOT NULL','成功创建 Task 数'),
('skipped_count','INTEGER','NOT NULL','跳过数'),
('failed_count','INTEGER','NOT NULL','失败数'),
('created_by_operator_id','UUID','NOT NULL；跨域 logical ref','发起人'),
('created_at','TIMESTAMPTZ','NOT NULL','创建时间'),
('completed_at','TIMESTAMPTZ','NULL','批量创建完成时间'),
]
add_table(['字段','逻辑类型','约束','说明'], rows, widths=[47,30,46,44], font_size=7.75)
add_para('相同 idempotency key + 相同 request_hash：返回原 Batch；相同 key + 不同 hash：拒绝请求。')

h=doc.add_heading('9.8 audio.audio_task_batch_items', level=2)
rows=[
('id','UUID','PK','Batch Item ID'),
('batch_id','UUID','NOT NULL；FK → task_batches','所属 Batch'),
('item_no','INTEGER','NOT NULL','请求内序号'),
('slot_id','UUID','NULL；FK → audio_slots','解析后的 Slot'),
('task_id','UUID','NULL；FK → audio_tasks','创建出的 Task'),
('result_status','TEXT/ENUM','created / skipped / failed','逐项结果'),
('result_code','TEXT/VARCHAR','NULL','机器可读结果代码'),
('result_message','TEXT','NULL','补充结果信息'),
('created_at','TIMESTAMPTZ','NOT NULL','记录时间'),
]
add_table(['字段','逻辑类型','约束','说明'], rows, widths=[47,30,46,44], font_size=7.8)
add_bullet('UNIQUE(batch_id, item_no)。')
add_bullet('同一 Batch 中可对非空 slot_id 建防重复约束/等价保护。')
add_bullet('result_status=created 时必须已解析出 slot_id 与 task_id。')

h=doc.add_heading('9.9 audio.audio_default_presets', level=2)
add_para('定位：Audio 后台当前默认 Preset 选择映射，不是 TTS 配置历史表。')
rows=[
('id','UUID','PK','映射 ID'),
('source_domain','TEXT/VARCHAR','NOT NULL','来源 Domain'),
('content_entity_type','TEXT/VARCHAR','NOT NULL','内容实体类型'),
('language_code','TEXT/VARCHAR','NOT NULL','语言'),
('audio_role','TEXT/VARCHAR','NOT NULL','音频角色'),
('default_tts_preset_key','TEXT/VARCHAR','NOT NULL','当前默认 Preset Key'),
('enabled','BOOLEAN','NOT NULL','是否启用'),
('created_at','TIMESTAMPTZ','NOT NULL','创建时间'),
('updated_at','TIMESTAMPTZ','NOT NULL','更新时间'),
]
add_table(['字段','逻辑类型','约束','说明'], rows, widths=[47,30,46,44], font_size=7.8)
add_bullet('UNIQUE(source_domain, content_entity_type, language_code, audio_role)。')
add_bullet('这是 current configuration，允许 UPDATE / DELETE。历史 Task 已保存 tts_preset_key，不受默认配置后续变化影响。')
add_page_break()

# 10 Batch detail
h=doc.add_heading('10. 批处理设计', level=1)
add_para('Batch 的职责被严格限定为“批量创建 Task”。创建完成后，Batch 不继续汇总或驱动每个 Task 的生产、审核、发布状态。这样避免把 Batch 误做成第二套 Workflow 状态机。')
add_code('''Batch creating
   ↓
逐项解析 Slot / 创建 Task
   ↓
Batch completed

之后：
Task A producing
Task B production_failed
Task C published

不会反向修改 Batch.status''')

# 11 concurrency
h=doc.add_heading('11. 并发、幂等与事务', level=1)
h=doc.add_heading('11.1 三层并发保护', level=2)
add_table(['层','机制','目标'], [
    ('业务唯一性','UNIQUE / partial UNIQUE','防止重复 Slot、重复活动 Task、重复版本等'),
    ('请求幂等','client_idempotency_key / request_id','客户端/worker 重试不会制造重复业务事实'),
    ('乐观并发','audio_tasks.lock_version','后台多个操作同时修改 Task 时防覆盖'),
], widths=[36,67,64], font_size=8.9)

h=doc.add_heading('11.2 发布事务', level=2)
add_para('正式 Publish 需要保证 canonical pointer、Task 状态与发布审计一致，必须作为同一业务事务/原子变更处理。')
add_code('''1. 验证 Asset.review_status == approved
2. 验证 Asset 属于目标 Slot
3. 如 first_published_at 为空，则写入首次发布时间
4. 更新 audio_slots.official_asset_version_id
5. Task → published
6. 写 published Task Event
7. 提交事务''')
add_callout('发布一致性', '不能出现 Task 已是 published，但 Slot 仍指向旧 Asset 的半完成状态。')

h=doc.add_heading('11.3 TTS Worker / Callback 并发', level=2)
add_para('Generation Attempt 使用 request_id、external_job_id、lease_until、transport_retry_count 等字段支持异步 worker、callback 和网络重试场景。成功 Attempt 最多形成一个 Asset Version。')

# 12 cross domain
h=doc.add_heading('12. 跨 Domain 契约', level=1)
add_table(['字段/事实','来源 Domain','Audio 中的处理'], [
    ('content_entity_id','Learning 或其他业务 Domain','稳定 UUID logical reference，不建 physical FK'),
    ('content_revision_id','Learning','稳定 UUID logical reference；Task / Asset 保存生产时快照'),
    ('规范发音 / 当前文本','Learning','canonical owner 在 Learning；Audio 仅保存快照'),
    ('operator IDs','Operations','稳定 UUID logical reference，不建跨域 FK'),
    ('TTS preset / model / voice','TTS 服务','Audio 只保存 preset key；具体定义由 TTS 自维护'),
    ('R2 object','Cloudflare R2','Audio 保存 storage_key 与文件 metadata'),
], widths=[48,42,77], font_size=8.8)

# 13 invariants
h=doc.add_heading('13. 最终不变量', level=1)
for inv in [
    '一个 Slot 只有一个当前 official asset。',
    '一个 Slot 同时最多只有一个 active production Task。',
    '一个 Task 最终最多形成一个 Asset Version。',
    '一个 Generation Attempt 最多形成一个 Asset Version。',
    '一个 Asset Version 只有一个实际文件。',
    'Slot 的 official pointer 必须引用属于同一 Slot 的 Asset Version。',
    '技术生产失败与质量审核失败是两种不同事实。',
    '技术失败重试仍在同一个 Task 中处理。',
    '审核 Reject 结束当前 Task，并通过 successor Task 重新生产。',
    'approved 不等于 published。',
    '当前正式音频只由 audio_slots.official_asset_version_id 表达。',
    'Learning 内容变化不得篡改历史 Audio Task / Asset。',
    '历史任务和资产必须能够还原当时的生产输入。',
    '曾经正式发布过的 Asset 文件永久保留。',
    '未发布且 rejected 的 Asset 记录保留，但文件允许异步删除。',
]: add_bullet(inv)

# 14 excluded
h=doc.add_heading('14. 明确不建立的概念', level=1)
add_para('以下内容在最终审计中被明确裁掉或归属其他系统，不应重新加入 Audio Production Domain V1：')
add_table(['不建立的对象/概念','原因'], [
    ('TTS Providers / Models / Voices 表','归 TTS 服务自身维护'),
    ('TTS Preset 参数历史表','Audio 只保存 preset key 使用事实'),
    ('Audio cleanup jobs 表','Reject 文件清理重试状态直接保存在 Asset Version'),
    ('独立 Publish History 表','当前正式事实由 Slot pointer 表达；历史由 Asset first_published_at + events 支撑'),
    ('独立 current / official audio 表','避免第二份 current canonical fact'),
    ('独立 regeneration 表','Reject 后通过 predecessor/successor Task 链表达'),
    ('独立 human recording attempt 表','人工录音直接形成 Asset Version，不伪造 TTS Attempt'),
    ('多格式 variant 表','每个 Asset Version 只有一个实际文件'),
    ('is_current / is_primary / is_official 字段','会与 Slot official pointer 形成重复事实源'),
    ('needs_regeneration Task 主状态','最终用 rejected + successor Task 表达'),
], widths=[72,95], font_size=8.7)

# 15 acceptance
h=doc.add_heading('15. 实现验收清单', level=1)
checks=[
    '数据库最终只有 9 张 Audio 业务表，名称与本文一致。',
    '所有 Audio 内部主键为 UUID；同 Domain FK 真实存在；跨 Domain 不建 physical FK。',
    'audio_slots 的业务唯一键包含 source_domain / entity_type / entity_id / language_code / audio_role。',
    'official_asset_version_id 无法指向其他 Slot 的 Asset。',
    '同 Slot 无法同时创建两个 active Task。',
    '技术 TTS 重试不会新建业务 Task。',
    '人工录音不会写 audio_generation_attempts。',
    '每个 Task 最多只能落一个 Asset Version；每个 Attempt 最多一个 Asset。',
    'Review 每次追加新行，不覆盖旧审核事实。',
    'Reject 原因 CHECK 与 approval_revoked remark CHECK 生效。',
    'Publish 前必须 approved；Publish 后 Slot pointer、Task status、Event 原子一致。',
    'stale 不清空 official pointer，但业务层能禁止继续使用 stale 音频。',
    'Rejected 未发布文件通过 pending_delete → deleted/delete_failed 异步清理。',
    '曾经发布的文件不会被 Reject 清理逻辑删除。',
    'TTS Provider / Model / Voice 配置没有复制进 Audio 数据库。',
    'Batch completed 后，不因子 Task 后续状态变化而变化。',
    'Default Preset 允许当前配置更新，同时历史 Task 的 preset key 保持不变。',
]
for i,c in enumerate(checks,1): add_number(c)

# Final summary
h=doc.add_heading('16. 最终冻结结论', level=1)
add_callout('一句话定义', 'Learning 提供需要发音的业务对象及规范生产输入，Audio 为其建立稳定 Slot；通过 TTS 或人工录音创建一次生产 Task，TTS 技术重试通过 Attempt 保留历史，每个 Task 最终只形成一个不可变 Asset Version；资产经过独立 Review 后才能 Publish，Slot 的 official_asset_version_id 是全系统当前正式音频的唯一事实源；历史正式版本永久保存，Rejected 未发布文件异步清理；TTS 的 Provider/Model/Voice/Preset 配置归 TTS 服务维护，Audio 只保存实际使用的 Preset Key 与必要生产快照。')
add_para('最终 Schema：audio。最终表数量：9。本文档至此作为 Audio Production Domain 的实现与后续审计基线。')

# set widow control / font in all paragraphs
for p in doc.paragraphs:
    pPr = p._p.get_or_add_pPr()
    widow = OxmlElement('w:widowControl'); widow.set(qn('w:val'),'1'); pPr.append(widow)
    for run in p.runs:
        if run.font.name is None:
            run.font.name='Noto Sans CJK SC'; run._element.rPr.rFonts.set(qn('w:eastAsia'),'Noto Sans CJK SC')

# Core metadata
props=doc.core_properties
props.title='Audio Production Domain 最终产品与数据库设计文档'
props.subject='Audio Production Domain final design'
props.keywords='audio, tts, recording, review, publish, database, PostgreSQL'
props.comments='FINAL design baseline generated from the finalized conversation decisions.'

# Save
doc.save(OUT)
print(OUT)
PY
python /mnt/data/create_audio_design_doc.py
ls -lh /mnt/data/audio-production-domain-final-design.docx


---

### [31] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [32] ASSISTANT　status=finished_successfully

bash -lc rm -rf /mnt/data/audio_design_render && python /home/oai/skills/docx/render_docx.py /mnt/data/audio-production-domain-final-design.docx --output_dir /mnt/data/audio_design_render --emit_pdf


---

### [33] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [34] ASSISTANT　status=finished_successfully

bash -lc ls /mnt/data/audio_design_render/page-*.png | wc -l && ls -1 /mnt/data/audio_design_render/page-*.png | head && ls -lh /mnt/data/audio_design_render/*.pdf


---

### [35] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [36] ASSISTANT　status=finished_successfully

_(empty)_


---

### [37] ASSISTANT　status=finished_successfully

文档主体已经生成，共 20 页。现在在做最后的版式检查，重点看长字段表是否出现截断、跨页错位，以及中文/等宽字体是否正常。


---

### [38] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [39] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [40] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [41] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [42] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [43] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [44] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [45] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [46] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [47] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [48] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [49] ASSISTANT　status=finished_successfully

目前版式没有发现截断或乱码；有两页因为章节边界留白较多，但内容结构是完整的。我继续检查最容易出问题的 9 张表字段页，确认表头重复和跨页拆分都正常。


---

### [50] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [51] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [52] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [53] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [54] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [55] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [56] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [57] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [58] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [59] ASSISTANT　status=finished_successfully

bash -lc python - <<'PY'
p='/mnt/data/create_audio_design_doc.py'
s=open(p,'r',encoding='utf-8').read()
s=s.replace("def set_repeat_table_header(row):\n    trPr = row._tr.get_or_add_trPr()\n    tblHeader = OxmlElement('w:tblHeader')\n    tblHeader.set(qn('w:val'), 'true')\n    trPr.append(tblHeader)\n", "def set_repeat_table_header(row):\n    trPr = row._tr.get_or_add_trPr()\n    tblHeader = OxmlElement('w:tblHeader')\n    tblHeader.set(qn('w:val'), 'true')\n    trPr.append(tblHeader)\n\ndef set_row_cant_split(row):\n    trPr = row._tr.get_or_add_trPr()\n    cant = OxmlElement('w:cantSplit')\n    trPr.append(cant)\n")
s=s.replace("    set_repeat_table_header(hdr)\n", "    set_repeat_table_header(hdr)\n    set_row_cant_split(hdr)\n")
s=s.replace("        cells = table.add_row().cells\n", "        new_row = table.add_row()\n        set_row_cant_split(new_row)\n        cells = new_row.cells\n")
open(p,'w',encoding='utf-8').write(s)
PY
python /mnt/data/create_audio_design_doc.py
rm -rf /mnt/data/audio_design_render2
python /home/oai/skills/docx/render_docx.py /mnt/data/audio-production-domain-final-design.docx --output_dir /mnt/data/audio_design_render2 --emit_pdf
ls /mnt/data/audio_design_render2/page-*.png | wc -l


---

### [60] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [61] ASSISTANT　status=finished_successfully

_(empty)_


---

### [62] ASSISTANT　status=finished_successfully

发现并修正了一个跨页表格问题：最后的“明确不建立概念”表有一行被拆到了两页。现在已禁止表格行跨页拆分，并重新渲染验证。


---

### [63] ASSISTANT　status=finished_successfully

bash -lc python - <<'PY'
from pathlib import Path
import hashlib
for i in range(1,21):
    a=Path(f'/mnt/data/audio_design_render/page-{i}.png').read_bytes()
    b=Path(f'/mnt/data/audio_design_render2/page-{i}.png').read_bytes()
    same=hashlib.md5(a).hexdigest()==hashlib.md5(b).hexdigest()
    print(i, 'same' if same else 'changed')
PY


---

### [64] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [65] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [66] TOOL　status=finished_successfully

The output of this plugin was redacted.


---

### [67] ASSISTANT　status=finished_successfully

_(empty)_


---

### [68] ASSISTANT　status=finished_successfully

_(empty)_


---

### [69] ASSISTANT　status=finished_successfully

设计文档已生成，并完成 20 页逐页渲染检查，包含完整产品方案、9 张表设计、状态机、流程、跨域契约、约束、并发幂等与验收清单。

[下载 Audio Production Domain 最终设计文档（DOCX）](sandbox:/mnt/data/audio-production-domain-final-design.docx)
