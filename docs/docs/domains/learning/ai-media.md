---
status: frozen
last_updated: 2026-08-30
---

# Pronunciation、TTS、Media 与 Translation 规格

原则：发音是知识属性；音频是媒体资产；TTS 是生成方式；翻译是独立能力。

## Pronunciation Audio

| 表 | 冻结字段与约束 |
| --- | --- |
| `pronunciation_audios` | `id bigint identity PK`、`pronunciation_id bigint not null FK → pronunciations`、`media_id bigint not null`、`audio_source varchar(16) not null check human/tts`、`voice_code varchar(64)`、`provider varchar(64)`、`model varchar(128)`、`quality_score numeric(5,2) check null or 0..100`、`is_primary boolean not null default false`、`status varchar(16) not null default active check active/disabled/rejected`、审计时间。 |

partial UNIQUE：每个 Pronunciation 只能有一个 `is_primary=true AND status=active` 的 Audio。真人录音与 TTS 不分表；差异由 `audio_source/provider/model/voice_code` 表达。质量不佳的 Audio 标为 `rejected`，不覆盖旧记录。

## TTS Job

| 表 | 冻结字段与约束 |
| --- | --- |
| `tts_jobs` | `id bigint identity PK`、可空 `content_id FK → contents`、可空 `pronunciation_id FK → pronunciations`、`input_text text not null`、`language varchar(8) not null check zh/lo`、`provider varchar(64) not null`、`model varchar(128)`、`voice_code varchar(64)`、`status varchar(16) not null default pending check pending/processing/succeeded/failed/cancelled`、`result_media_id bigint`、`error_code varchar(64)`、`error_message text`、`requested_at timestamptz not null default now()`、`started_at`、`completed_at`。 |

流程：创建 Job → 生成 → 创建 Platform MediaAsset → 建立 PronunciationAudio。Job 是生成历史，PronunciationAudio 是最终业务结果。

## Translation Request

| 表 | 冻结字段与约束 |
| --- | --- |
| `translation_requests` | `id bigint identity PK`、可空 `user_id FK → identity.users`、`source_language varchar(8) not null`、`target_language varchar(8) not null`、`source_text text not null`、`translated_text text`、`provider varchar(64)`、`model varchar(128)`、`status varchar(16) not null default pending check pending/processing/succeeded/failed`、`error_code varchar(64)`、`created_at timestamptz not null default now()`、`completed_at timestamptz`；CHECK 仅允许 zh→lo 或 lo→zh。 |

正式课程翻译写入 `learning.translations` 并经人工确认。即时 AI 结果只保留在 `translation_requests`；未来若审核入库，使用 Request → Review → Promote → Translation 流程，第一阶段不实现。

## Platform Media 契约

Learning 的 `media_id`、`cover_media_id` 与 `result_media_id` 最终指向 `platform.media_assets.id`。Platform MediaAsset 负责 `object_key`、`mime_type`、`size`、`duration`、`width`、`height`、`storage_provider`、`processing_status`；跨 Schema FK 的最终 migration 仍为 `designing`。

TTS 路由由 Platform Config 决定，例如 `tts.zh.default_provider`、`tts.zh.default_model`、`tts.zh.short_word_provider`、`tts.lo.default_provider`、`tts.lo.default_model`。Learning 只发出 GeneratePronunciationAudio 能力请求。
