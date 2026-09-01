---
status: frozen
last_updated: 2026-09-02
---

# ADR-020：Audio Production 独立成域与正式音频唯一事实源

**状态：** `已接受`

**日期：** `2026-08-30`

**相关：** [ADR-018 全局数据库设计原则最终版](ADR-018-global-database-design-principles-final.md)、[ADR-004 Learning Content Registry](ADR-004-learning-content-registry.md)、[ADR-019 Operations 后台控制平面](ADR-019-operations-backoffice-control-plane.md)、[ADR-021 Learning 拆分为 Content + Learning](ADR-021-content-and-learning-domain-split.md)、[Audio 域](../domains/audio/index.md)、[Audio 数据库](../domains/audio/database.md)

## 背景

Learning 域早期设计（D-028）把发音音频（`learning.pronunciation_audios`）与 TTS 任务（`learning.tts_jobs`）作为 Learning 内部表，Audio 只挂在 Pronunciation 下（`is_primary` 布尔指针），TTS 直接存 provider/model/voice 参数。该方案存在四个问题：

1. 只有「发音」能拥有音频，单词、例句、课文等任何需要发音的学习内容没有统一接入模型。
2. `is_primary` 与 `status` 组合形成当前正式音频的**第二事实源**，与「一个事实一个 authoritative owner」冲突。
3. 生产技术失败（TTS timeout）与内容质量失败（发音错误）混在同一条 Job 状态机里，重试语义不清。
4. TTS Provider/Model/Voice 参数被复制进业务库，与 TTS 服务的配置演进耦合。

「设计音频生产域」会话（提取定稿见分享 `https://chatgpt.com/share/6a93716e-8a28-83ea-abbd-355679b38fe2`）对音频生产做了完整的独立域设计并最终冻结。

## 决策

1. **Audio Production Domain 独立成域**：Schema `audio`，业务表固定 9 张（slots / tasks / generation_attempts / asset_versions / reviews / task_events / task_batches / task_batch_items / default_presets）。（历史计数：本 ADR 成立时业务 Schema 由 9 变为 10；[ADR-021](ADR-021-content-and-learning-domain-split.md) 拆分 Content 后，当前最终业务 Schema 总数为 **11**。）
2. **业务音频需求统一用 Slot 定位**：`source_domain + content_entity_type + content_entity_id + language_code + audio_role` 唯一确定一个逻辑音频槽位；Audio 不理解 Content 内部业务模型。
3. **正式音频唯一事实源**：`audio_slots.official_asset_version_id` 是某 Slot 当前正式音频的唯一 canonical pointer；Asset Version 不维护 `is_current` / `is_official` / `is_primary` 等重复事实；fresh/stale 判定不清空 pointer。
4. **Content 与 Audio 职责边界（C 模式，经 [ADR-021](ADR-021-content-and-learning-domain-split.md)/D-148 修订）**：Content 发起需求并拥有 canonical 内容与规范发音（修订自原「Learning 拥有」表述）；Audio 独立完成生产并保存「当时用什么输入生产」的快照（revision + text/pronunciation snapshot + input hash）。
5. **失败语义二分**：技术失败 = 同 Task 新 Attempt；审核 Reject = 旧 Task 结束 + successor Task（`predecessor_task_id` 链）；Reject 不自动重产；一次生产只产生一个候选；一个 Asset Version 只有一个文件。
6. **Review 与 Publish 分离**：审核事实 append-only 存 `audio_reviews`；`approved ≠ published`；发布是切换 official pointer 的原子事务。
7. **TTS 配置归 TTS 服务**：Provider / Model / Voice / Preset 参数及历史由 TTS 服务自维护；Audio 只保存 `tts_preset_key` 使用事实与 `audio_default_presets` 默认映射；TTS 异步执行、生成后自行上传 Cloudflare R2、不留原始文件。
8. 文件生命周期（经 D-152 修订）：**物理文件事实（storage_key / mime / size / checksum / codec 及物理删除生命周期）的唯一 canonical owner 是 Media/Asset Infrastructure（D-127）**；`audio_asset_versions` 只保存 `asset_id` logical UUID 与音频业务事实（版本关系、审核、发布、时长/采样率/声道），不自持存储元数据、不建物理删除重试字段。曾正式发布的文件永久保留；从未发布且 rejected 的文件清理由 Asset Infrastructure 依据 Audio 的业务资格（`review_status=rejected` 且从未发布）异步执行，不建独立 cleanup jobs 表。
9. **Operator 引用统一 UUID（D-153）**：`assignee_operator_id` / `reviewer_operator_id` / `producer_operator_id` / `created_by_operator_id` 等全部与 `operations.operators.id`（UUID）类型一致。

取代关系：Learning 旧 `pronunciation_audios` / `tts_jobs` 表设计（D-028 表级）`superseded`；D-129 中「TTS 路由配置落表归 Learning」的遗留问题由本 ADR 解决（归 TTS 服务 + audio 域默认映射）。

## 备选方案与取舍

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| 独立 Audio Production Domain（本 ADR） | 任何域的音频需求统一接入；正式音频单一事实源；生产/审核/发布全链路可审计 | 新增一个业务域与 Schema | 采用 |
| 音频留在 Learning（旧 pronunciation_audios/tts_jobs） | 不新增域 | 只有发音可用音频；is_primary 双事实源；TTS 参数耦合业务库；失败语义混杂 | 不采用（`superseded`） |
| 通用媒体中心 / 原始-派生音频流水线（其他会话方案） | 覆盖面广 | 与业务音频生命周期（审核/发布/正式指针）不匹配；域边界模糊 | 不采用（会话明确排除） |
| 一次生成多候选由审核挑选 | 减少重产次数 | 增加审核负担与模型复杂度 | 不采用（一次一个候选） |

## 后果

### 正面影响

- 学习内容（单词/句子/课文/例句等）的音频需求获得统一、可扩展的接入模型。
- 「当前正式音频」全系统只有一个事实源，杜绝双指针漂移。
- 技术失败与质量失败彻底分离，重试/重产语义可在数据库层约束（partial UNIQUE 活动 Task、Attempt 序号唯一）。
- TTS 配置演进不再牵动 Audio 数据库结构。

### 代价与风险

- 模块化单体的模块边界多一层维护成本。
- ~~与 D-127「Media/Asset Infrastructure 为所有 asset_id 权威技术属主」存在边界衔接问题~~ → **已裁决（D-152）**：Asset Version 不再自持 `storage_key` / mime / size / checksum，统一保存 `asset_id` logical UUID。
- ~~Learning/Content 必建表计数与旧表迁移待确认~~ → **已裁决（D-145/D-150）**：`pronunciation_audios` / `tts_jobs` 不再建表；原 43 张表定稿为 Content 31 + Learning 10。
- 审核/发布/批处理全部依赖应用层事务保证一致性（数据库不做触发器）。

## 后续行动

- [x] ~~主会话裁决 audio 域 R2 文件事实与 Platform Media/Asset Infrastructure（D-127）的边界归属~~ → 已由 D-152 裁决：统一 `asset_id`，Asset Infrastructure 为唯一文件事实 owner。
- [x] ~~主会话确认 `learning.pronunciation_audios` / `learning.tts_jobs` 的删除与数据迁移方式，并确认 Learning 必建表计数调整~~ → 已由 D-145/D-150 裁决。
- [x] ~~Operations logical ID 类型口径~~ → 已由 D-153 裁决：统一 UUID。
