# 旧老挝语内容迁移规格

## 目标

从旧 MySQL 只读导出当前有效的老挝语音节、词语和句子，将它们创建为当前 PostgreSQL 中新的 Content `draft`，并迁入可用的音频资产与有序组成关系。

## 不可变约束

1. 源 MySQL 永远只读；目标写入必须可在单次运行失败时整体回滚。
2. 不复制源版本、审核、发布、操作员、事件或用户学习事实。
3. 目标实体一律是新 UUID、`contents.status=active` 的 Content，且唯一初始 Content revision 状态为 `draft`。
4. 内容文本须 NFC 规范化后去重；每个去重键仅创建一个目标实体。
5. 组成关系从源实体的当前 published revision 读取，按 `sort_no` 保留顺序与重复项。
6. 重复字段冲突和缺失子实体关系必须写入隔离报告；缺失子实体关系不阻断句子父实体导入。失效音频或 URL 映射失败必须使迁移失败，且不得静默跳过。
7. 音频 URL 不写入 `content.*`。迁移须创建 `infrastructure.assets`、`audio.audio_slots` 与目标 Audio Asset Version 关系，Content 仅通过 Slot 获取音频。

## 导入范围

| 类型 | 源实体与当前修订 | 目标实体 | 导入数量上限 |
| --- | --- | --- | ---: |
| 音节 | `app_syllable` + `lao_syllable_revision` | `contents` + `lo_syllables` | 261（去重后） |
| 词语 | `lao_word` + `lao_word_revision` | `contents` + `lo_words` + 中文 `meanings` | 239（去重后） |
| 句子 | `lao_sentence` + `lao_sentence_revision` | `contents` + `lo_sentences` + 中文 `translations` | 166 |

仅选择 `deleted_time IS NULL`、`online_status='online'`、且存在 `published_revision_id` 的源实体。

## 规范化与去重

- 文本键为 Unicode NFC、trim 后的老挝语展示文本；不根据拼读、中文释义或音频进行去重。
- 同键实体选择最小稳定源 ID 作为 canonical source，生成确定性目标 UUID，并保留该记录的组成关系与 processed 音频。
- 每个被合并源 ID，以及与 canonical 记录不同的拼读、中文、描述、组成序列、原始/processed 音频对象 key，都必须进入 CSV/JSON 隔离报告。
- 去重差异本身不阻断导入；该策略避免创建违反 `lo_syllables.text` 或 `lo_words.text` 唯一约束的记录，也不悄然丢失差异。

## 有序结构和文本校验

1. 先导入已存在的 68 个老挝语字母并建立源 ID→目标 Content UUID 映射。
2. 导入去重后的音节；重建音节→字母关系，并验证拼接结果等于音节文本。
3. 导入去重后的词语；重建词语→音节关系，并验证无空格拼接结果等于词语文本。
4. 导入句子；重建句子→词语关系，并验证按单空格拼接结果等于规范化句子文本。
5. 任何缺失子实体（当前已知 2 条句子→词语关系）必须跳过该关系、进入隔离报告，并继续导入句子父实体与其余有效关系。

## 音频资产

- 每个可导入实体恰有一个源 approved / valid 音频绑定；迁移仅取其 processed 链接作为正式播放资产，原始链接仅作为审计输入。
- 已确认 URL 映射：当链接以 `R2_PUBLIC_DOMAIN` 为前缀时，`storage_provider='r2'`、`storage_bucket=R2_BUCKET_NAME`，并将 URL pathname 去掉开头的 `/` 作为 `storage_key`。迁移还须通过 R2 endpoint 检查远端对象可读取及其媒体元数据。
- 每个目标内容建立一个 `pronunciation` Slot、一条新的资产版本和正式指针。所有这些记录都是新的目标事实，不保留源 Audio 的版本号、审核历史或旧 ID。
- 因为目标内容修订是 draft，音频不会向 C 端投影，直至新系统完成审核和发布。

## 运行配置与验收前置条件

- `LEGACY_MYSQL_*`：旧库只读连接。
- `DATABASE_URL`：目标 PostgreSQL 连接。
- `MIGRATION_OPERATOR_ID`：已配置的目标 Operations `super_admin` UUID，用于新 Content / Audio 的创建审计。
- `STORAGE_DRIVER=r2` 与 `R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET_NAME`、`R2_PUBLIC_DOMAIN`、`R2_ENDPOINT`：已确认的 R2 存储定位和访问配置。

在缺少任何一项时，脚本必须在目标事务开始前失败。

## 验收标准

- 迁移只创建 draft；目标没有 inherited source ID、revision、审批或发布状态。
- 每个目标文本键唯一；报告完整列出所有合并和隔离项。
- 三层组成链均有连续正整数位置，并通过对应文本拼接校验。
- 每个成功内容有一个新的音频 Slot 与正式 Asset Version，且 Asset 只保存已解析的存储标识。
- 重跑同一输入不会重复创建内容、资产或关系；输入变更产生明确冲突，而非覆写。
