---
feature: chinese-lao-content-hierarchy
research_dimension: codebase
status: evidence
last_updated: 2026-09-04
---

# 代码库分析：中老语言内容层级

## 范围与确认基线

本分析仅覆盖首期管理后台。已确认的语言链为：

```text
老挝语：字母 → 音节 → 词语 → 句子
中文：拼音 → 中文音节（发音）→ 汉字 → 词语 → 句子
```

中文音节属于 Content 语言知识，不是音频资源。Audio 继续拥有音频生产、资产版本、审核和发布。中文与老挝语不得共用语言结构表，同时必须具备版本、审核和发布生命周期。

## 现有数据库与规范模型证据

- `database/migrations/0400_content.sql` 和权威文档 `knowledge.md` 已为现有结构使用语言专属表，包括中文的 `zh_pinyin`、`zh_hanzi`、`zh_words`、`zh_word_hanzi`、`zh_sentences`，以及老挝语的 `lo_letters`、`lo_syllables`、`lo_syllable_letters`、`lo_words`、`lo_word_syllables`、`lo_sentences`。
- 老挝语字母到音节、音节到词语已有有序关系表；发布规则要求精确组成和已发布依赖。
- `content.contents`、`content.content_revisions`、释义、翻译、例句、发音属性、标签和词典关系是有意跨语言复用的 Content 基础设施，不属于语言结构表。
- 版本基础设施已经支持所需生命周期。冻结迁移 `1240_content_revision.sql` 建立不可变快照；前向迁移 `1290_content_revision_review_workflow.sql` 补充待审核、已批准、已驳回、审核信息、驳回原因、乐观锁和单活动工作版本约束。
- 冻结的 Content 类型和物理结构中没有 `zh_syllable`，也没有拼音到中文音节的组成表；数据库预期结构检查同样证明该缺口。

## 现有实现证据

- 当前唯一完成的 Content 管理切片是老挝语字母管理。
- 后端 `apps/backend/src/modules/content/` 已实现字母草稿创建、派生工作版本、更新、审核、发布、乐观锁以及已发布字母读取模型。
- 管理接口位于 `/api/v1/admin/content/letters`，所有变更操作均校验 Operations 精确权限并记录成功审计；公开接口只返回已发布字母。
- 后台已有对应的 `apps/admin/src/features/content/alphabet/` 页面。其他类别此前只有菜单文字，没有真实页面或接口。
- `audio-role-policy.ts` 虽然已经列出 `zh_syllable`，但没有匹配的数据结构和实体；这只是提前预留，不能证明模型已经完成。

## Operations、审计和版本集成

- Operations 拥有后台授权和追加式成功操作审计。Content 必须通过其公开边界调用，不能直接写 Operations 表。
- 当前权限登记只包含 `content.letters.write`、`content.letters.review`、`content.letters.publish`，并由迁移 `1280_content_letter_permissions.sql` 授予既有超级管理员。
- 历史接口文档曾描述更宽泛的知识权限，但它们未进入当前 Operations 权限登记，也没有真实实现，不能覆盖现行权威。

## 明确冲突与实施阻塞

1. **缺少中文音节模型。** D-161 已确认中文链和独立中文音节实体，但冻结表仍从 `zh_pinyin` 直接跳到 `zh_hanzi`。实施前必须确定表字段、关系基数和顺序、内容类型、版本快照、依赖校验和前向迁移。
2. **共享表边界需明确。** 语言结构表已经分离，但统一身份和版本表是冻结的跨语言基础设施。用户已进一步确认只禁止结构表共用，因此这项语义冲突已经解除。
3. **老挝语交付缺口较大。** 规范已定义字母、音节、词语和句子，但后台和后端目前只实现字母。
4. **权限矩阵未确定。** 需要为两种语言的编辑、审核、发布定义权限键；角色本身必须保持可配置，不能擅自建立固定角色矩阵。
5. **Audio 声调槽位存在差异。** 该问题只影响未来音频集成，不在首期后台范围内，本功能不得修改 Audio 权威。

## 规划影响

- 只允许新增前向迁移，保留冻结迁移和既有发布版本。
- 权威模型和权限确定后，复用现有 Content 版本状态机与 Operations 审计边界。
- 两种语言的结构、仓储、用例、接口和页面保持分离，不以通用语言表缩短实现。
- 首期不包含移动端；检查移动端代码仅用于确认范围边界。
- 中文结构采用一次性切换，不建立旧 `zh_pinyin` 双读、双写或旧接口兼容层；对无法确定转换的数据必须在迁移前阻塞处理。
