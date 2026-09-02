# Vocabulary Domain（老挝语单词/词汇）

> 状态：Domain Framework Draft  
> 领域：Content Domain  
> 职责：定义老挝语词汇条目（VocabularyEntry）的核心属性、音节组成链、外部词典导入与晋升规范、多维度语言学元数据规范及消费层契约。

---

## 1. 领域范围与核心实体

### 1.1 实体概念：VocabularyEntry [PA]
单词是老挝语语义教学的核心载体，也是构建句子、会话和课文的基本构件。

### 1.2 核心属性定义 [PA]
- **展示文本（display_text / lao）**：老挝语词汇的标准书写形态（Unicode 码点级精确匹配，`utf8mb4_bin` 排序）。
- **归一化文本（normalized_text）**：去除多余空白/格式字符后的规范化形式，用于词汇查重、分词匹配与索引加速。
- **发音音标（phonetic）**：ASCII 拼读风格音标（如 `sa-bai-dii`）。
- **主要释义（gloss_zh / chinese）**：中文核心释义。
- **语言学与教学说明（description）**：用法说明、文化背景或补充释义。
- **生命周期与访问控制**：
  - 内容发布状态（Draft / Pending Review / Approved / Published / Archived）。
  - VIP 门槛等级（`free` / `bronze` / `silver` / `gold`，代表权限门控而非难度等级）。

---

## 2. 单词↔音节组成链与严格一致性 [PA]

### 2.1 有序音节组成（Word to Syllables Chain）
- 单词由 1 个或多个有序音节（`LaoSyllable`）组成。
- 组成关系必须按 `sort_no` 严格保序并**保留重复音节**。
- 发布时将组成快照永久固化于不可变版本中。

### 2.2 拼接一致性校验（Rule 4404）
- 单词内包含的音节序列按序拼接后，其文本必须与单词原生书写完全一致：
  $$\text{Concatenate}(\text{Syllables in Sequence}) \equiv \text{Word Display Text}$$
- 违反此规则无法提交审核或发布。

### 2.3 依赖审核约束
- 依赖的全部音节必须已经审核通过或正式发布，单词方可完成审核。

---

## 3. 词汇录入与生产途径 [PA]

### 3.1 录入渠道
1. **专家手工录入**：管理后台录入词汇、释义并确认音节组成。
2. **批量数据导入**：通过结构化 CSV 导入，在导入事务内执行校验与音节解析。
3. **外部词典候选晋升（Dictionary Promote）**：从参考词库选用并补全字段后晋升为正式教学词（见 3.2）。
4. **智能辅助录入**：
   - 释义/音标智能填充建议（Smart-fill）；
   - 音节自动切分建议（Syllables Suggest）。
   - **核心规则**：*所有算法建议仅作为录入辅助，经过人工确认并保存的组成关系才是唯一事实源。*

### 3.2 外部参考词典与教学词库边界（Reference vs Canonical）[PA]
- **外部词典底座（Reference Dictionary）**：收录来自公开资源（如 Kaikki, Wiktionary, Mekongphon, LaoDict 等）的外部词条，包含原始转写、英文释义、词性及原始 JSON 数据。
- **C 端隔离原则**：参考词典属于 B 端知识库，**严禁直接暴露给 C 端学习者**。
- **晋升规范（Promote）**：词典候选词必须经过数据清洗、补齐规范中文释义、校验音节组成链并通过审核，方可转入正式教学词库。

---

## 4. 语言学属性现状与结构化规范

### 4.1 属性状态盘点 [PA 与当前基线对比]
- **老挝文本、拼读发音、中文释义**：✅ 完备字段与规则。
- **词性（Part of Speech）**：⚠️ 仅参考词典有 pos 枚举（noun/verb/adj/adv/num/pron/prep/conj/particle/intj/name），正式教学词库尚需统一持久化。
- **难度等级（Difficulty Level）**：⚠️ VIP 等级用于商业权限访问，非语言学难度；教学分级（如 CEFR/自定义 Level）待新系统显式定义。
- **例句（Examples）**：⚠️ 通过「句子包含单词」组成链反向索引，词汇本体不冗余存储例句字符串。
- **图片与媒体（Media）**：❌ 无独立图片字段，媒体资源由外部 Asset Domain 托管。
- **标签体系（Tags / Categories）**：⚠️ 主题分类通过课程体系（Category/Scene）间接承载。

---

## 5. 消费层与学习流契约 [PA]

### 5.1 课程挂载
- 词汇作为受控实体引用（Logical Content ID）挂载至课程页面（Page Unit）。

### 5.2 个人生词本与 SRS 间隔复习
- **生词本（Wordbook）**：学习者收藏与学习过程生成的专属单词本（按 User ID 严格隔离）。
- **SRS 复习算法状态机**：
  - 4 档自评：`0-不认识 / 1-模糊 / 2-认识 / 3-掌握`。
  - 基础复习间隔阶梯：`1分钟 / 5分钟 / 1天 / 4天`。
  - 到期队列：基于 `next_at` 进行到期调度。
  - 毕业判定：连续两次自评均达到 `≥ 2（认识）` 触发毕业标记。
  - 操作幂等性：同一复习节点的并发打分必须幂等收敛。

### 5.3 每日学习（Daily Content）
- 每日新词由运营排期指定，无排期时根据上线词库按算法轮换回退。

---

## 6. 发音与音频契约 [PA]

- 每个正式词汇对应 1 个老挝语发音槽位（`lo/pronunciation`）。
- 词汇文本或拼读发生变更时，生成新的内容输入哈希（`audio_input_hash`），旧音频状态自动标记为陈旧（`stale`）。

---

## 7. Engineering Reality 历史映射 [ER]

> 仅记录旧系统事实备查，不作为新系统架构依赖：
- 旧系统主表为 `lao_word`（251 行存量），修订表为 `lao_word_revision`，组成表为 `lao_word_revision_syllable`。
- 外部词典主表为 `app_dictionary`。
- 生词本与复习表为 `app_wordbook`、`app_wordbook_item`、`app_word_review`。

---

## 8. 未决事项 [UNKNOWN]

1. **[UNKNOWN] 正式词汇的词性（POS）标准化模型**：新系统需明确是否将参考词典的 POS 枚举正式提升为教学单词的核心字段。
2. **[UNKNOWN] 老挝语词汇难度分级体系（Difficulty Rating）**：目前老挝语方向缺少类似中文 HSK 1~6 的分级标签体系，需由教学产品专家决策。
3. **[UNKNOWN] 词典晋升源溯源模型（Provenance）**：从外部词典 promote 到正式词库时，需建立结构化的源头与版本追溯关联。
4. **[UNKNOWN] 多义项与词义分组结构**：当前单词模型为单释义扁平结构，未来长文本/多义词是否演进为多义项（Meanings/Senses）待决策。
