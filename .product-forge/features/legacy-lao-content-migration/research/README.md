# 旧老挝语内容迁移研究

## 范围

将旧 MySQL `study-lao` 中的老挝语音节、词语和句子迁入当前 PostgreSQL `zh_lao`，并保持音节→字母、词语→音节、句子→词语的有序组成关系及正式音频。

源库和目标库均只在盘点阶段以只读方式连接。目标 Content 表当前没有 `lo_syllable`、`lo_word` 或 `lo_sentence` 数据。

## 用户确认的迁移基线

- 目标内容一律作为新的 `draft` 创建；不复制旧修订、审核、发布或事件历史。
- 同形音节和词语必须去重，再建立组成关系。
- 导入保留源库当前正式音频，不直接在 Content 持久化 URL。
- 音频 URL 必须由目标 Asset Infrastructure 解析为 provider / bucket / key，再通过 Audio Slot 和 Audio Asset Version 引用。
- 已删除、下线或未发布的旧实体不导入。

## 实时源数据盘点

| 内容 | 可导入实体 | 当前正式组成关系 | 数据问题 |
| --- | ---: | ---: | --- |
| 音节 | 261 | 838 条音节→字母 | 11 组重复文本（22 条） |
| 词语 | 239 | 306 条词语→音节 | 3 组重复文本（6 条） |
| 句子 | 166 | 709 条句子→词语 | 2 条关系引用缺失词语；4 条缺拼读 |

源库的 666 个可导入实体均关联一条已批准、有效的处理后音频链接。链接使用固定 HTTPS 主机，路径无查询参数；目标迁移仍须在执行时验证每个对象存在、可读取并能被确定性解析为目标 Asset 的存储三元组。

## 权威约束

- Content 域要求三个组成链按顺序保留，并遵守 Rule 4404 的文本拼接一致性。
- Audio Binding 规定 Content 不直接保存 URL；必须使用 Audio Slot 和 Asset Version。
- `content.contents` 的公开 UUID 是 Content 的唯一外部身份；子表和关系不产生独立公开身份。
- 目标的 Content 生命周期不允许 draft 直接发布。因此迁移后的对象必须停留在新创建的 draft 状态。

## 研究结论

这是一次跨 Content、Audio 与 Asset Infrastructure 的高风险、可重复执行数据迁移。下一阶段必须定义：

1. 规范化去重键和同形记录的字段合并规则；
2. 两条缺失句子→词语关系的隔离与报告机制；
3. URL 到 `storage_provider`、`storage_bucket`、`storage_key` 的明确解析规则；
4. 以稳定源 ID 派生新 UUID、幂等重跑并在失败时整体回滚的策略；
5. 导入后 draft、组成关系与音频绑定的验证标准。
