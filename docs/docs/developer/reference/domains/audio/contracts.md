---
status: frozen
last_updated: 2026-08-31
---

# 契约与边界

本页定义 Audio Production 与 Content、Operations、TTS 服务和 Asset Infrastructure 的稳定边界。

## 跨领域引用

| 业务事实 / 字段 | 来源 | Audio 的处理 |
| --- | --- | --- |
| `source_domain` / `content_entity_type` / `content_entity_id` | Content 或其他允许的业务来源 | 保存稳定 logical UUID reference，不建跨域 FK |
| `content_revision_id` | Content | 保存稳定 logical UUID；Task / Asset Version 记录生产时快照 |
| 当前文本 / 规范发音 | Content | canonical owner 在 Content；Audio 只保存当次生产快照 |
| Operator ID | Operations | assignee / created_by / reviewer / producer / batch creator 使用稳定 UUID logical ID，不建跨域 FK |
| TTS Preset Key | TTS 服务 | Audio 保存实际使用的 key；不复制 Preset 参数定义 |
| `asset_id` | Asset Infrastructure | Audio 只保存 logical UUID，不拥有底层存储元数据 |

Domain 内 9 张业务表之间使用真实 PostgreSQL FK；跨 Domain 只使用稳定逻辑引用。

## Content Contract

Content 提供：

```text
业务对象 logical UUID
Content Revision logical UUID
当前生产文本
规范发音 / 规范生产输入
可稳定计算或提供的 audio_input_hash
```

Audio 使用这些输入建立或更新 Slot 当前需求，并在 Task / Asset Version 上保存当时生产快照。

Audio 不反向修改 Content，也不把自己的文本快照提升为 canonical 教学内容。

## TTS Service Contract

TTS 服务拥有：

```text
Provider
Model
Voice
Preset Definition
Preset Parameters
Provider Credential
External Job Runtime
```

Audio 只关心：

```text
Preset Key
提交所需业务输入
External Job / Attempt 关联
成功后的 asset_id
失败状态与可重试结果
```

TTS 配置变化不要求 Audio 维护一份参数版本历史。

## Operations Contract

人工录音、任务分配、审核、发布等后台动作可以引用 Operations Operator。

Audio 只保存 Operator 的稳定 UUID logical ID。

Operations 负责后台认证主体解析、RBAC 与后台操作审计；Audio 自己负责“当前 Task/Asset 是否允许这个动作”的业务状态判断。

```text
Operations Permission
≠
Audio Business State Rule
```

两者都通过后才可执行相应业务动作。

## Asset Infrastructure Contract

Asset Infrastructure 是物理文件 metadata 和生命周期的唯一 canonical owner。

Audio 保存：

```text
asset_id
以及属于 Audio 业务语义的音频版本信息
```

Audio 不保存第二份 canonical：

```text
storage_provider
bucket
object_key
mime_type
file_size
checksum
通用文件删除状态
```

物理删除由 Asset Infrastructure 执行；Audio 只提供业务上是否允许清理的条件。

## 当前正式音频契约

当前正式版本唯一由：

```text
audio_slots.official_asset_version_id
```

表达。

任何消费者需要“当前正式音频”时，都应从 Audio 的公开查询能力获取经过 Fresh/Stale 规则裁决后的结果，而不是直接在 Asset Infrastructure 中寻找“最新文件”。

## 明确不建立

V1 不建立以下 Audio 业务概念：

| 不建立 | 原因 |
| --- | --- |
| TTS Provider / Model / Voice 表 | 归 TTS 服务 |
| TTS Preset 参数历史表 | Audio 只保存 Preset Key 使用事实 |
| 独立 Audio Cleanup Job 表 | 物理文件清理由 Asset Infrastructure 负责 |
| 独立 Publish History 表 | 历史由 Asset Version、`first_published_at` 与 Task Event 支撑 |
| 独立 Current / Official Audio 表 | 会与 Slot official pointer 形成第二事实源 |
| 独立 Regeneration 表 | 使用 predecessor / successor Task 链表达 |
| Human Recording Attempt 表 | 人工录音最终提交直接形成 Asset Version |
| 多格式 Variant 表 | 一个 Asset Version 只有一个实际文件 |
| Audio 自持 Storage Metadata | 文件事实归 Asset Infrastructure |
| `is_current` / `is_primary` / `is_official` | 与 official pointer 重复 |
| `needs_regeneration` Task 主状态 | 使用 rejected + successor Task |

FFmpeg、Whisper、通用 Media Center、聊天语音消息等能力不因为“与音频有关”就自动进入本领域。

## 公共契约原则

Audio 对其他领域暴露的公开能力应围绕业务语义，而不是数据库结构，例如：

```text
解析某业务对象当前可用正式音频
判断 Slot 当前是否 fresh
请求/创建生产任务（授权场景）
查询生产状态（后台场景）
```

公共契约不得暴露：

- Audio internal database key；
- Asset storage implementation；
- TTS provider credential；
- Operations internal details；
- 允许消费者绕开 Fresh/Stale 或 Review/Publish 状态机的写入口。

全局跨领域规则见 [领域依赖与协作](/developer/reference/architecture/domains/dependencies.md)。
