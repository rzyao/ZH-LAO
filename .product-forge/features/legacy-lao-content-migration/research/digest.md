# Research — Digest

> **Feature:** legacy-lao-content-migration  
> **Phase:** research  
> **Artifact owner:** speckit.product-forge.research

## Key findings

- 实时源库有 261 个可迁移音节、239 个可迁移词语和 166 个可迁移句子；目标 PostgreSQL 当前对应 Content 类型为零。
- 组成关系必须从源实体指向的当前 published revision 读取，而不是读取整个旧版本历史。
- 所有 666 个可迁移实体均有 approved / valid 的正式音频资产链接。
- 目标的 `lo_syllables.text` 与 `lo_words.text` 是唯一键，源库的 11 组音节和 3 组词语重复必须在创建目标内容前决策合并。

## Confirmed scope decisions

- 去重后迁入，保持有序组成关系。
- 将音频保存为目标 Asset / Audio 关系，绝不直接复制 URL 到 Content。
- 不迁旧版本信息；每个目标对象作为新的 draft 与单个初始快照创建。
- 不导入删除、下线、未发布实体；不可解析的关系和资产必须隔离报告，不得静默丢弃。

## Risks to resolve in Product Spec

- 旧媒体 HTTPS 路径尚未定义为目标 `storage_provider`、bucket、key；不可假设路径首段就是 bucket。
- 去重记录的中文释义、拼读、描述与音频若不完全相同，必须有明确的优先级与冲突报告。
- 两条 published sentence-to-word 关系引用不存在的词语，不能建立无效目标 FK。

## Handoff

Product Spec 必须将 Content、Audio Binding、Asset Infrastructure 的既有权威约束写为不可违反条件；不得为迁移便利修改冻结 migration 或绕过 draft 审核流程。
