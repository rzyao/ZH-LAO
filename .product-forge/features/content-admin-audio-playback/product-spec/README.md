# 产品规格索引：内容管理音频播放列

> 状态：已确认｜功能：`content-admin-audio-playback`｜模式：Lite

本规格为内容管理后台中具备正式音频资格的内容列表增加统一的“音频”列。管理员可在不离开列表的情况下试听当前可用的正式音频；没有可用正式音频时不会播放历史或草稿音频。

## 文档地图

| 文档 | 用途 | 状态 |
| --- | --- | --- |
| [product-spec.md](./product-spec.md) | 范围、规则、需求与验收 | 已确认 |
| [journeys/journeys.yml](./journeys/journeys.yml) | 可测试的管理员旅程 | 已确认 |
| [digest.md](./digest.md) | 下游计划摘要 | 已确认 |

## 已落实的边界

- 仅覆盖音频绑定权威白名单中的六类内容：老挝语字母、音节、词语、句子；中文拼音元素、音节。
- 汉字、中文词语、中文句子、词典、课程、审核页和内容目录本身不增加该列。
- 音频从 Audio 的正式、已审核且 fresh 的公开读取能力获取；前端不读取 Slot、Task、Asset Version 或存储信息。
- 任何无音频、未发布、审核未通过、陈旧、加载失败或无法播放的记录，都不能回退播放旧音频。

> 本文件为 Product Forge 编排产物，不能替代 [音频绑定权威](../../../../docs/docs/developer/reference/domains/content/audio-binding.md) 或公开契约。
