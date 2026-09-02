---
status: frozen
last_updated: 2026-08-31
---

# 生产与审核

本页定义音频从 Content 需求进入 Audio，到形成可发布 Asset Version 的生产与质量流程。

## 产品目标

1. Content 中任何需要发音的业务对象都可以拥有音频。
2. 每一个逻辑音频位置由一个稳定 Audio Slot 表达。
3. 一个 Slot 可以拥有多个历史 Asset Version，但同一时刻只有一个当前正式版本。
4. 历史生产输入、生产结果和审核过程必须可追溯。

## 与 Content 的边界

```text
Content 发起需求
↓
Audio 独立完成生产
↓
Audio 返回当前正式资产引用
```

| 事实 | 事实拥有者 |
| --- | --- |
| 当前教学内容、Content Revision、规范发音与 canonical 生产输入 | Content |
| 当次生产使用的内容/发音快照 | Audio |
| 当前正式音频 | Audio |
| Fresh / Stale 判定所需的 required revision/hash 与生产快照比较 | Audio + Content Contract |

Audio 不成为规范发音知识的事实拥有者。

Content 后续变化不能修改历史 Task 或 Asset Version；历史生产记录必须能说明“当时用什么输入生产了这个版本”。

## Fresh / Stale

Slot 保存当前要求：

```text
required_content_revision_id
required_audio_input_hash
```

Asset Version 保存生产时实际使用的：

```text
content_revision_id
audio_input_hash
```

判断：

```text
required revision/hash == official asset revision/hash
→ fresh

任一不一致
→ stale
```

Stale **不清空** `official_asset_version_id`。系统仍然知道最后一个正式音频是谁，但业务层可以禁止继续把 stale 版本作为有效播放结果，并发起重新生产。

## 生产方式

V1 有两种业务生产方式：

```text
tts
human_recording
```

两种方式最终汇合到同一链路：

```text
Asset Version
↓
Review
↓
Publish
```

不为人工录音建立第二套版本、审核或发布模型。

## 技术失败与质量失败

| 问题类型 | 示例 | 处理 |
| --- | --- | --- |
| TTS 技术失败 | timeout、provider unavailable、network error、invalid response、external job failure | 同一 Task 下新增/重试 Generation Attempt |
| 内容质量失败 | 发音错误、速度问题、噪音、截断、文本不匹配 | Review rejected，当前 Task 结束，后续创建 successor Task |

必须保持：

- 技术失败重试不新建业务 Task；
- Review Reject 不等于自动再次调用 TTS；
- Reject 后旧 Task 结束，重产通过 successor Task 表达；
- 一次生产只形成一个候选 Asset Version；
- 一个 Asset Version 只对应一个实际文件资产。

## TTS 契约

TTS Provider、Model、Voice、Preset 参数和其历史由 TTS 服务自己维护。

Audio 只保存生产时的 **Preset Key 使用事实**，例如：

```text
zh_word_normal
zh_sentence_slow
lo_word_normal
```

`audio_default_presets` 只是 Audio 后台的“某类内容默认选择哪个 Preset Key”的当前配置，不是 TTS 参数配置表。

### 异步生产链

```text
Audio Task
↓
Generation Attempt
↓
TTS submit
↓
external job
↓
TTS 处理
↓
TTS 上传对象存储
↓
Asset Infrastructure 登记 canonical asset metadata
↓
返回 asset_id
↓
Audio 创建 Asset Version
```

Audio 不要求 TTS 把文件回传给 Audio 再上传。

TTS 成功上传后不需要长期保留另一份“原始生成文件”；物理存储事实由 Asset Infrastructure 统一维护。

## 人工录音

人工录音由管理员主动触发，不是普通用户 UGC 录音流程。

试听和重录阶段不进入正式生产历史；只有最终提交才形成 Asset Version。

人工录音产物：

```text
generation_attempt_id = NULL
producer_operator_id = 录音管理员的 Operations logical UUID
```

不得伪造 TTS Generation Attempt。

## 审核

V1 使用人工审核，同时保留未来自动质量检查演进空间。

审核与发布严格分离：

```text
approved ≠ published
```

每次审核动作新增一条 Review 历史记录，不覆盖过去审核事实。

Review Decision：

```text
approved
rejected
approval_revoked
```

Reject Reason：

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

`rejected` 时必须有 reject reason；`other` 等场景可用 remark 补充。

`approval_revoked` 主要用于正式发布前撤销批准；已经发布的正式版本切换由 Slot official pointer 控制，不通过改写 Review 历史表达。

## 正式版本

当前正式音频唯一事实源：

```text
audio_slots.official_asset_version_id
```

不再维护：

```text
is_current
is_official
is_primary
current_version
```

旧正式版本被新版本替换后，历史记录仍然保留；`first_published_at` 证明其曾经正式发布。

## 文件生命周期

- 曾经正式发布过的文件永久保留；
- 从未发布且审核 rejected 的文件允许异步删除；
- 文件删除与重试由 Asset Infrastructure 执行；
- Audio 只表达“这个业务版本是否具备清理资格”，不在 Review API 内同步删除对象存储文件；
- Audio 不建立独立 cleanup jobs 表。

物理文件的 provider、bucket、object key、mime、size、checksum 等 canonical metadata 不属于 Audio。
