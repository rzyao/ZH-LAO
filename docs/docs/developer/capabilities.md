---
status: active
last_updated: 2026-09-02
---

# 能力地图

能力地图按“用户或运营人员能够完成什么”组织。完整清单见迁移后的[功能目录](features/)；机器可读清单位于 `docs/docs/developer/feature-catalog.json`。目录由 `scripts/build_developer_feature_catalog.py` 从新页面 front matter 生成；本页提供人类阅读的分组方式。

## 用户能力

| 能力组 | 示例 | 事实入口 |
| --- | --- | --- |
| 账号与设置 | 登录、会话、资料、界面语言、主题 | [Identity](/developer/reference/domains/identity/)、[功能目录](features/) |
| 学习内容 | 字母、课程、词汇、句子、练习、词典、发音 | [Content](/developer/reference/domains/content/)、[Learning](/developer/reference/domains/learning/) |
| 学习状态 | 进度、掌握、复习、历史、错题 | [学习域](/developer/reference/domains/learning/) |
| 社交关系 | 资料、发现、关注、Match、动态 | [Social](/developer/reference/domains/social/) |
| 交流 | 会话、消息、翻译、实时能力 | [Chat](/developer/reference/domains/chat/) |
| 钱包与礼物 | Coin、购买、钱包、礼物 | [Commerce](/developer/reference/domains/commerce/)、[Rewards](/developer/reference/domains/rewards/) |
| 安全与申诉 | 举报、限制、认证、申诉 | [Trust & Safety](/developer/reference/domains/trust/) |

## 运营能力

| 能力组 | 示例 | 事实入口 |
| --- | --- | --- |
| 内容生产 | 知识、课程、词典、练习和发布 | [内容功能](features/) |
| 音频生产 | Slot、Task、生成、审核和发布 | [Audio Production](/developer/reference/domains/audio/) |
| 平台控制 | Feature Flag、运行配置、版本、地区和公告 | [Platform](/developer/reference/domains/platform/) |
| 权限与审计 | 操作员、角色、权限、操作审计 | [Operations](/developer/reference/domains/operations/) |
| 安全运营 | 审核、举报、处置、申诉和认证 | [Trust & Safety](/developer/reference/domains/trust/) |

## 使用方法

选择能力后进入对应 Feature Page；需要理解所有权、数据和契约时再进入 Domain/Architecture；需要执行实现时按[开始参与开发](getting-started)进入 Spec Kit、代码和测试证据。
