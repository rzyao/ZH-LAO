---
status: baseline
last_updated: 2026-08-30
---

# Platform 域

Platform 提供全产品共用的配置、地区、媒体、通知、版本和审计基础设施。

## 子域与实体

- Feature Flag：FeatureFlag、FeatureRule。
- Product Config：ConfigItem、ConfigVersion。
- Region：Region、RegionPolicy。
- Media：MediaAsset。
- Notification：Notification、NotificationTemplate。
- App Version：AppVersion、VersionPolicy。
- Audit：AuditLog。

## 业务基线

- Feature Flag 控制能力是否开放，可按地区、用户群、版本和阶段生效。
- Rule Config 保存可调整产品规则，不把免费额度、年龄、图片上限和奖励权重写死。
- MediaAsset 统一承载图片和音频引用。
- MediaAsset 是 Learning PronunciationAudio、TTS 结果、课程封面和 LessonItem 媒体的统一引用目标；已确认媒体元数据契约为 `object_key`、`mime_type`、`size`、`duration`、`width`、`height`、`storage_provider`、`processing_status`。
- VersionPolicy 服务 Android 版本控制。
- AuditLog 为后台和敏感操作提供不可缺失的审计基础。
- Platform 提供机制，不拥有各业务域的具体规则执行。

游客云同步若未来需要，可在 Platform 评估 Installation 实体；当前为 `deferred`。

## 数据库状态

实体与边界为 `baseline`；MediaAsset 的职责和元数据契约为 `baseline`，规则表达式、优先级、版本发布、媒体生命周期、通知投递、审计防篡改和精确表字段为 `designing`。
