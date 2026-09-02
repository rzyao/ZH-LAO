---
status: frozen
last_updated: 2026-08-31
schema: audio
---

# 音频生产（Audio Production）

音频生产领域负责**业务音频从需求出现到生产、审核、发布并成为当前正式音频的完整业务事实**。

它不拥有教学内容，不拥有 TTS Provider/Model 配置，也不拥有物理文件存储元数据。

## 领域职责

| 负责 | 不负责 |
| --- | --- |
| 逻辑音频 Slot | Content canonical 教学内容 |
| 一次业务生产 Task | 规范发音知识 |
| TTS Generation Attempt | TTS Provider / Model / Voice / Preset 参数定义与历史 |
| 不可变 Asset Version 业务版本 | R2 object key、bucket、mime、checksum 等物理文件事实 |
| 人工审核与审核历史 | 通用 Media Center |
| 发布与当前正式版本指针 | 聊天语音消息 |
| Fresh / Stale 判定 | 翻译、文字转写 |
| 技术失败重试与质量失败继任 Task | 普通用户 UGC 录音流程 |
| 批量创建生产任务 | 长期批处理工作流跟踪 |
| 生产生命周期审计 | — |

## 领域能力地图

Audio Production 当前提供的稳定业务能力包括：

```text
生产需求承接
├─ 建立 / 识别 Slot
├─ 创建 Task
└─ 保存生产输入快照

生产
├─ TTS Generation Attempt
├─ 人工录音
└─ Asset Version 形成

治理
├─ Review
├─ 技术失败重试
├─ 质量失败 successor Task
└─ 生产事件审计

发布
├─ Publish
├─ official_asset_version_id
└─ Fresh / Stale 判定

批量
└─ Task Batch / Batch Item
```

这些是 Audio Domain Capability；Admin 音频工作台是这些能力的消费者体验，不是领域模型本身。

## 参与的产品功能

| 产品功能 | 关系 | Audio 职责 |
| --- | --- | --- |
| [音频生产](/developer/features/audio-production) | 主要领域 | Slot、Task、Attempt、Asset Version、Review、Publish 与生产生命周期 |

该 Feature 同时依赖 Content、Operations 与 Asset Infrastructure，但这些边界不会并入 Audio。

## 核心模型

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

最终业务表共 9 张：

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

字段、约束和索引见 [数据设计](database.md)。

## 一句话业务链

```text
Content 提供业务对象与规范生产输入
↓
Audio 建立稳定 Slot
↓
TTS 或人工录音产生 Asset Version
↓
Review
↓
Publish
↓
Slot.official_asset_version_id 成为当前正式音频唯一事实源
```

历史正式版本永久保留；从未正式发布且审核拒绝的文件可以由 Asset Infrastructure 异步清理。

## 关键不变量

1. 一个 Slot 同时只有一个当前正式 Asset Version。
2. 一个 Slot 同时最多一个活动生产 Task。
3. 一个 Task 最终最多形成一个 Asset Version。
4. 一个 Generation Attempt 最多形成一个 Asset Version。
5. 一个 Asset Version 对应一个实际文件资产。
6. `official_asset_version_id` 指向的版本必须属于同一 Slot。
7. TTS 技术失败与审核质量失败是不同事实。
8. 技术失败在同一 Task 下增加 Attempt；审核拒绝结束旧 Task 并通过 successor Task 重产。
9. `approved` 不等于 `published`。
10. 当前正式版本只由 Slot 的 official pointer 判断，不维护第二份 `is_current/is_official` 事实。
11. Content 变化不篡改历史 Audio Task / Asset Version。
12. 历史生产记录必须能够还原当时使用的生产输入。
13. 曾经正式发布的资产永久保留。
14. 未发布且 rejected 的 Asset Version 业务记录保留，即使物理文件被异步清理。

## 文档地图

- [生产与审核](production.md)：Content 输入、Fresh/Stale、TTS、人工录音、审核、发布与文件生命周期。
- [工作流与状态机](lifecycle.md)：Task/Attempt/Review/Batch 状态、主流程、发布事务、并发与幂等。
- [契约与边界](contracts.md)：Content、Operations、TTS、Asset Infrastructure 的跨域契约和明确不建立的概念。
- [数据设计](database.md)：9 张表的字段、约束、索引和物理关系。
- [音频生产 Feature](/developer/features/audio-production)
- [领域能力与产品功能关系模型](/developer/reference/domains/FEATURE_RELATIONSHIP_MODEL)
