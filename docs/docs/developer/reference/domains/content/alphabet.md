---
status: baseline
last_updated: 2026-09-04
---

# Alphabet Domain（老挝语字母/字符）

> 状态：Domain Framework Draft  
> 领域：Content Domain  
> 职责：定义老挝文字母（辅音、元音、声调符号、特殊符号）的语言学属性、分类体系、拼写规范与发音基础事实。

---

## 1. 领域范围与核心实体

### 1.1 实体概念：LaoCharacter [PA]
老挝文字母/字符是老挝语内容体系的原子级叶子节点，不可再向下拆解。所有音节与词汇均由字母按正字法组合而成。

### 1.2 核心属性定义 [PA]
- **字符本体**：老挝文原生字符（存储与检索严格遵循 Unicode 码点级精确匹配，使用 `utf8mb4_bin` 排序规则，禁止忽略声调/变音符比较）。
- **音标定义（Phonetic）**：IPA 风格音标，用于描述字母的标准发音特征。
- **发音属性**：是否包含音频 (`no_audio`)；`tone_mark` 与 `other` 无独立发音。
- **描述说明**：字母名称与语言学说明（如字母称谓、符号用途说明）。

---

## 2. 字母分类体系 [PA]

### 2.1 大分类（Major Classification）
1. **辅音（Consonants）**
2. **元音（Vowels）**
3. **声调符号（`tone_mark`）与其他正字法标记（`other`）**

### 2.2 细分子分类（Subtype Semantics）
- **辅音声调分组**（决定音节拼读声调规则的基础）：
  - `cons_middle`：中音组辅音
  - `cons_high`：高音组辅音
  - `cons_low`：低音组辅音
- **元音形态分组**：
  - `vowel_short`：短元音
  - `vowel_long`：长元音
- **声调与其他正字法标记的子分类**：
  - `symbol_tone`：声调符号（Mai Ek `່`、Mai Tho `້`、Mai Ti `໊`、Mai Chattawa `໋`）
  - `symbol_ligature`：连字符 / 复合符号（如 `ຼ`）
  - `symbol_repeat`：重复符号（`ໆ`，Mai Sam）
  - `symbol_special`：特殊符号（如 `ຯ` 等）
  - `symbol_other`：其他正字法标记

---

## 3. 发音与音频契约 [PA]

### 3.1 音频槽位绑定
- 每个具有发音属性的字母对应 1 个老挝语发音槽位（`lo/pronunciation`）。
- `tone_mark` 与 `other` 标记为 `no_audio = true`，不创建音频生产槽位，不要求音频资产。

### 3.2 字符音标规范
- 字母表维护 IPA 标准音标，作为音节和单词拼读转写的基准输入。
- 声调符号在音标中标记为 `-`（不发音），但参与字符组成链校验。

---

## 4. 组成链与约束规则 [PA]

- **原子性**：字母为老挝语内容组成链的最底层，不依赖任何下级实体。
- **被依赖关系**：字母是有序构建音节（`LaoSyllable`）的基础元素。
- **审核约束**：若字母处于未审核通过状态，引用该字母的音节不得审核通过或正式发布。

---

## 5. Engineering Reality 历史映射 [ER]

> 仅记录旧系统事实备查，不作为新系统架构依赖：
- 旧系统落点于 `app_letter` 表，通过 `classification`（0-3）与 `subtype` 字段维护分类。
- 源库 `study-lao.app_letter` 共 68 行；2026-09-04 已核验为 29 个辅音、31 个元音、4 个声调符号及 4 个其他正字法标记。目标物理枚举严格使用 `consonant` / `vowel` / `tone_mark` / `other`。
- 旧接口 `GET /api/app/letter` 按分类分组返回，并以 Redis 进行 5 分钟缓存。

---

## 6. 未决事项 [UNKNOWN]

1. **[UNKNOWN] 字母学习顺序（Curriculum Sequence）**：旧系统中字母无明确的 `sort/sequence` 教学顺序模型，新系统需决策标准字母表展示与教学推进序列。
2. **[UNKNOWN] 字母级专项练习与测试模型**：旧系统 Lao 方向未建立字母笔顺、认读或听音辨符的练习题库，新系统需决策是否引入字母级交互练习。
3. **[RESOLVED 2026-09-04] 存量 68 行数据构成**：以源库为准，包含 29 辅音（含 `ໜ`、`ໝ`）、31 元音（含 `ໍ`）、4 个 `tone_mark` 及 4 个 `other`；仅迁移主记录，不迁移历史版本或音频关联。
