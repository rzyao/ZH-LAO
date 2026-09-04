---
status: baseline
last_updated: 2026-09-04
---

# Lao Alphabet Decisions

> 领域：Content Domain (Alphabet)  
> 目标：澄清与固化 Lao Alphabet 领域的关键业务决策，为 `002-lao-alphabet-management` 提供权威事实依据。

---

## Decision A1 Character Inventory

### 1. 实体归属与业务边界决策
以源库 `study-lao.app_letter` 的 68 项记录为迁移基线（2026-09-04 核验），统一裁定如下：

1. **领域归属**：全部 68 项字符均归属于 `LaoCharacter` Domain 核心实体。
2. **分类定义**：
   - 29 辅音归属于 `consonant`（细分 `cons_middle` / `cons_high` / `cons_low`，包括 `ໜ`、`ໝ`）；
   - 31 元音归属于 `vowel`（细分 `vowel_short` / `vowel_long`，包括 `ໍ`）；
   - 4 声调符号归属于 `tone_mark`（细分 `symbol_tone`）；
   - 4 个其他正字法标记归属于 `other`（细分 `symbol_ligature` / `symbol_repeat` / `symbol_special` / `symbol_other`）。
3. **学习参与**：
   - 辅音与元音为基础字母学习的核心内容；
- `tone_mark` 与 `other` 不作为独立发音字母开展单字学习，主要作为正字法标记在音节拼读、单词及句子学习中呈现。
4. **拼写校验**：
   - 全部 68 项字符**均参与正字法拼写与组成链校验**（Rule 4404 强校验）。
5. **发音与音频**：
   - 辅音与元音：`no_audio = false`，分配 1 个老挝语发音槽位（`lo/pronunciation`）；
- `tone_mark` 与 `other`：`no_audio = true`，无独立发音槽位，不创建音频生产任务。

---

### 2. Alphabet Inventory Table

| Unicode | 字符 | 分类 | 是否学习 | 是否发音 | 备注 |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **源库 29 辅音** | 29 个辅音字符，含 `ໜ`、`ໝ` | `consonant` (`cons_middle` / `cons_high` / `cons_low`) | 是 | 是 | 各占 1 个音频槽位 |
| **源库 31 元音** | 31 个元音形态，含 `ໍ` | `vowel` (`vowel_short` / `vowel_long`) | 是 | 是 | 各占 1 个音频槽位 |
| `U+0EC8`–`U+0ECB` | `່`、`້`、`໊`、`໋` | `tone_mark` (`symbol_tone`) | 否 | 否 | 4 个声调符号，音标固定为 `-` |
| `U+0EBC` / `U+0EC6` / `U+0EAF` / `U+0ECC` | `ຼ`、`ໆ`、`ຯ`、`໌` | `other`（对应 `symbol_ligature` / `symbol_repeat` / `symbol_special` / `symbol_other`） | 否 | 否 | 已按源库码点核销 |

---

## Decision A2 Learning Sequence

### 1. 规则定义

1. **三级分块展示规则**：
   - 字母列表与学习视图严格按照物理大类分块展示，顺序为：**辅音（`consonant`） $\to$ 元音（`vowel`） $\to$ 声调符号（`tone_mark`） $\to$ 其他标记（`other`）**。
2. **组内官方字典序规则**：
   - 本次导入因源库不含教学顺序，按「分类 → 子类 → Unicode 码点」生成稳定初始序号；后续教研可通过 `sort_order` 调整为官方教学序。
3. **排序字段解耦与可调规则**：
   - `LaoCharacter` 实体维护显式排序序号 `sort_order`（整型数值），用于控制组内展示与推荐学习推进次序。
   - `sort_order` 的调整仅改变前端渲染与教学推进顺序，不影响 Unicode 字符本身、音标转写及音节组成链的一致性。

---

## Resolved Rules

1. **[RULE-ALPHA-01] 统一实体纳管**：存量全部 68 项老挝语字符/符号统一纳入 `LaoCharacter` 实体进行版本与审核生命周期管理。
2. **[RULE-ALPHA-02] 音频槽位精准门控**：仅 `consonant` 与 `vowel` 分配 `lo/pronunciation` 音频槽位；`tone_mark` 与 `other` 强制 `no_audio = true`。
3. **[RULE-ALPHA-03] 全量拼写约束参与**：所有 68 项字符无论是否独立发音，均可作为 `LaoSyllable` 与 `VocabularyEntry` 组成链的有效合法原子节点，参与 Rule 4404 严格拼接校验。
4. **[RULE-ALPHA-04] 标准展示序规范**：展示次序由「物理大类分组 + `sort_order`」联合确定；本次源库导入的初始值按稳定码点序生成，不声称为官方教学序。

---

## Remaining UNKNOWN

1. **[RESOLVED-ALPHA-01] 存量字符码点核销**：已确认 `໌` 为 `U+0ECC`，`ໍ` 归 `vowel`，并仅迁移 68 条主记录；旧修订与音频关联不迁移。
2. **[UNKNOWN-ALPHA-02] 字母级独立笔顺与练习互动模型**：
   - 说明：属于 C 类未决事项，不阻塞 `002-lao-alphabet-management` 管理功能与元数据录入。
