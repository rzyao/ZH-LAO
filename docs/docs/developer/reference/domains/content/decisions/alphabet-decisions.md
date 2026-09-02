---
status: baseline
last_updated: 2026-09-02
---

# Lao Alphabet Decisions

> 领域：Content Domain (Alphabet)  
> 目标：澄清与固化 Lao Alphabet 领域的关键业务决策，为 `002-lao-alphabet-management` 提供权威事实依据。

---

## Decision A1 Character Inventory

### 1. 实体归属与业务边界决策
针对存量 68 项字母/符号资产中已确认的 61 项（27 辅音 + 30 元音 + 4 声调符号）及剩余 7 项特殊字符/连字，统一裁定如下：

1. **领域归属**：全部 68 项字符均归属于 `LaoCharacter` Domain 核心实体。
2. **分类定义**：
   - 27 辅音归属于 `consonant`（细分 `cons_middle` / `cons_high` / `cons_low`）；
   - 30 元音归属于 `vowel`（细分 `vowel_short` / `vowel_long`）；
   - 4 声调符号归属于 `symbol`（细分 `symbol_tone`）；
   - 剩余 7 项特殊字符归属于 `symbol`（细分 `symbol_ligature` / `symbol_repeat` / `symbol_special` / `symbol_other`）。
3. **学习参与**：
   - 辅音与元音为基础字母学习的核心内容；
   - 符号类不作为独立发音字母开展单字学习，主要作为正字法标记在音节拼读、单词及句子学习中呈现。
4. **拼写校验**：
   - 全部 68 项字符**均参与正字法拼写与组成链校验**（Rule 4404 强校验）。
5. **发音与音频**：
   - 辅音与元音：`no_audio = false`，分配 1 个老挝语发音槽位（`lo/pronunciation`）；
   - 声调符号与特殊符号：`no_audio = true`，无独立发音槽位，不创建音频生产任务。

---

### 2. Alphabet Inventory Table

| Unicode | 字符 | 分类 | 是否学习 | 是否发音 | 备注 |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **已确认 27 辅音** | 27 个辅音字符（ກ, ຂ, ຄ, ງ, ຈ, ສ, ຊ, ຍ, ດ, ຕ, ຖ, ທ, ນ, ບ, ປ, ຜ, ຝ, ພ, ຟ, ມ, ຢ, ຣ, ລ, ວ, ຫ, ອ, ຮ） | `consonant` (`cons_middle` / `cons_high` / `cons_low`) | 是 | 是 | 核心辅音字母，各占 1 个音频槽位 |
| **已确认 30 元音** | 30 个元音形态（含单元音、复合元音及前引元音等形态） | `vowel` (`vowel_short` / `vowel_long`) | 是 | 是 | 核心元音字母，各占 1 个音频槽位 |
| `U+0EC8` | `່` (Mai Ek) | `symbol` (`symbol_tone`) | 否 | 否 | 第一声调符号，`no_audio = true`，音标标记为 `-` |
| `U+0EC9` | `້` (Mai Tho) | `symbol` (`symbol_tone`) | 否 | 否 | 第二声调符号，`no_audio = true`，音标标记为 `-` |
| `U+0ECA` | `໊` (Mai Ti) | `symbol` (`symbol_tone`) | 否 | 否 | 第三声调符号，`no_audio = true`，音标标记为 `-` |
| `U+0ECB` | `໋` (Mai Chattawa) | `symbol` (`symbol_tone`) | 否 | 否 | 第四声调符号，`no_audio = true`，音标标记为 `-` |
| `U+0EBC` | `ຼ` (Lao Semivowel Sign Lo) | `symbol` (`symbol_ligature`) | 否 | 否 | 连字符/介音符号（如 `ປຼ`），参与音节拼接 |
| `U+0EC6` | `ໆ` (Mai Sam / Ko La) | `symbol` (`symbol_repeat`) | 否 | 否 | 重复符号（如 `ຕ່າງໆ`），参与分词与拼写 |
| `U+0EAF` | `ຯ` (Lao Ellipsis / Paiyannoi) | `symbol` (`symbol_special`) | 否 | 否 | 省略符号，参与句子与词汇正字法 |
| `[UNKNOWN]` | 剩余 4 项特殊字符明细 | `symbol` (`symbol_special` / `symbol_other`) | 否 | 否 | 待旧库种子数据导入时按码点精确入库核销 |

---

## Decision A2 Learning Sequence

### 1. 规则定义

1. **三级分块展示规则**：
   - 字母列表与学习视图严格按照大分类分块展示，顺序为：**辅音（Consonants） $\to$ 元音（Vowels） $\to$ 符号与声调（Symbols）**。
2. **组内官方字典序规则**：
   - 辅音与元音组内默认遵循老挝语官方正字法标准字典排序（辅音：`ກ` 至 `ຮ` 共 27 字母；元音：短元音/长元音官方序）。
3. **排序字段解耦与可调规则**：
   - `LaoCharacter` 实体维护显式排序序号 `sort_order`（整型数值），用于控制组内展示与推荐学习推进次序。
   - `sort_order` 的调整仅改变前端渲染与教学推进顺序，不影响 Unicode 字符本身、音标转写及音节组成链的一致性。

---

## Resolved Rules

1. **[RULE-ALPHA-01] 统一实体纳管**：存量全部 68 项老挝语字符/符号统一纳入 `LaoCharacter` 实体进行版本与审核生命周期管理。
2. **[RULE-ALPHA-02] 音频槽位精准门控**：仅 `consonant` 与 `vowel` 分配 `lo/pronunciation` 音频槽位；所有 `symbol` 分类字符强制 `no_audio = true`。
3. **[RULE-ALPHA-03] 全量拼写约束参与**：所有 68 项字符无论是否独立发音，均可作为 `LaoSyllable` 与 `VocabularyEntry` 组成链的有效合法原子节点，参与 Rule 4404 严格拼接校验。
4. **[RULE-ALPHA-04] 标准展示序规范**：展示次序由「大类分组 + 组内 `sort_order`」联合确定，初始种子采用官方标准字典序。

---

## Remaining UNKNOWN

1. **[UNKNOWN-ALPHA-01] 存量数据最后 4 项特殊字符的具体 Unicode 码点核销**：
   - 说明：已明确 61 项基础字符 + 3 项常见符号（`ຼ`, `ໆ`, `ຯ`），剩余 4 项符号的具体 Unicode 码点（如 `໌` Cancellation Mark、`ໍ` Niggahita 等）在存量数据迁移导入阶段进行一对一码点核验与入库固化。
2. **[UNKNOWN-ALPHA-02] 字母级独立笔顺与练习互动模型**：
   - 说明：属于 C 类未决事项，不阻塞 `002-lao-alphabet-management` 管理功能与元数据录入。
