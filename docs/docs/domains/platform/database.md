---
status: designing
last_updated: 2026-08-30
schema: platform
---

# Platform 数据库待设计项

预期表达 FeatureFlag、FeatureRule、ConfigItem、ConfigVersion、Region、RegionPolicy、MediaAsset、Notification、NotificationTemplate、AppVersion、VersionPolicy 和 AuditLog。

MediaAsset 已确认负责 `object_key`、`mime_type`、`size`、`duration`、`width`、`height`、`storage_provider`、`processing_status`；Learning 的 `media_id`、`cover_media_id`、`result_media_id` 将引用它。精确类型、生命周期和跨 Schema FK migration 仍待确定。

TTS 路由配置至少支持 `tts.zh.default_provider`、`tts.zh.default_model`、`tts.zh.short_word_provider`、`tts.lo.default_provider`、`tts.lo.default_model`。配置覆盖顺序、规则条件 JSONB、版本生效、通知状态、审计保留和 `installations` 是否进入第一版均待主会话决定。
