---
status: designing
last_updated: 2026-09-02
---

# 未决与延期事项

## deferred

- 礼物接收者能否获得积分、兑换或收益。
- 具体支付渠道与中老两侧支付接入。
- Commerce V1 之外的会员 / Subscription / Entitlement 落表，以及促销、优惠券、提现、结算、Creator Earnings、多资产/冻结余额钱包等——等真实业务需求出现再设计；Entitlement 能力模型仍由 ADR-005 承载，仅落表延后（D-075）。
- 游客云同步、`platform.installations` 和注册时 Guest Data Migration。
- 未来是否拆分 Chat/Media；只有真实负载需要时评估。
- Chat 第一阶段明确不建：`chat_message_gift`、`chat_message_receipt`、`chat_delivery_receipt`、`chat_message_user_state`（单条仅自己删除非必需）、`chat_message_reaction`、`chat_group` / `chat_group_member`、`chat_message_translation`、`chat_message_attachment`。以后有明确需求通过新增表扩展。
- 独立 Notification Domain：只有在真正设计推送通知、系统通知、营销通知和设备 token 时才评估；当前归 Application/Infrastructure。

## designing

- Content / Learning：Content 与 Learning 各 `*_media_id` 字段如何接入 Media / Asset Infrastructure；内容发布与版本系统的完整实现模型；TTS / 翻译运营额度与限流参数；`question_reviews` 是否在首期后启用。
- Social：资料关闭后恢复原资料还是重建资料的产品规则。
- Chat：应用服务请求/响应、错误码、分页游标和鉴权契约；语音消息、聊天翻译与语音转文字是否进入首期；消息保留和注销匿名化规则。
- Rewards：Worker 批量大小、租约超时和重试间隔等运行参数；权益型奖励、Manual Grant 与用户时区扩展继续按上方 deferred 范围处理。
- Trust & Safety：真人认证 Verification 子域；`moderation_evidence.storage_key` 是否迁移为 Media / Asset `asset_id` logical UUID。
- Operations / Identity：后台 MFA、失败锁定和邀请流程的后续产品与认证契约。
- Platform：`regions.name` 的多语言策略；未来稳定 Region UUID；新增客户端平台时的统一 migration；高级灰度与 runtime config 版本化继续按 deferred 能力处理。
- 发布与运营：正式部署、发布、回滚、监控、客服与事件响应方案。

未决项只能由主架构会话决定；文档维护阶段不得自行填充。
