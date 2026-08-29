---
status: designing
last_updated: 2026-08-30
---

# 未决与延期事项

## deferred

- 礼物接收者能否获得积分、兑换或收益。
- 具体支付渠道与中老两侧支付接入。
- 游客云同步、`platform.installations` 和注册时 Guest Data Migration。
- 未来是否拆分 Messaging/Media；只有真实负载需要时评估。

## designing

- Learning：Platform Media 跨 Schema FK 的最终 migration、内容发布/版本系统的完整模型、TTS/翻译的运营额度与限流参数；`question_reviews` 是否在首期后启用。
- Identity：OTP/Session/Device 的未确认类型与约束，Refresh Token 轮换，Session 状态，设备安装唯一范围，`avatar_media_id` FK。
- Social：公开动态/评论/举报的字段、状态枚举、可见性、图片上限、删除和 Feed 策略；资料关闭后恢复或重建的产品规则。
- Community：独立 Community 能力的业务边界和是否启动（首期动态事实已归 Social）。
- Messaging：消息内容模型、回执、撤回、翻译和保留策略。
- Commerce/Rewards：订单与支付状态机、账本、权益有效期、防刷和规则版本。
- Trust & Safety/Operations/Platform：审核与限制状态机、RBAC、配置优先级、审计和媒体生命周期。
- 前端、后端具体技术栈，API 风格、任务队列、部署与发布方案。

未决项只能由主架构会话决定；文档维护阶段不得自行填充。
