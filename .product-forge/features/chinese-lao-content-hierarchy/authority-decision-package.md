# 权威决策包：中老语言结构与权限

状态：已采用——用户已连续确认整体方案，并授权继续实施

## 为什么需要这份决策包

已经确认的内容层级与现有两项冻结契约存在冲突：

1. `content.zh_pinyin` 当前表达完整的罗马字音节（音节、声母、韵母、声调），而新层级将拼音定义为组成独立中文音节的基础元素。
2. 冻结的知识规格明确规定首期不建立 `zh_sentence_words`，同时也没有老挝语句子—词语组成表；但已确认层级要求中老两种语言都具备“词语 → 句子”关系。

以下建议可同时解决这两个冲突，并确保中文和老挝语结构表完全分离。

## 建议决策

### JCB-001——中文拼音元素与中文音节

- 新模型上线时一次性停止使用现有 `content.zh_pinyin` 写入和读取，不保留旧版投影、双读、双写或旧接口。
- 新增 `content.zh_pinyin_elements`，存储原子拼音元素：
  - `content_id`：主键并关联 `content.contents`；
  - `element_type`：`initial | final | tone_mark | separator | other`；
  - `value`、`display_form`、`sort_order`；
  - `(element_type, value)` 唯一。
- 新增 `content.zh_syllables`，表达独立中文音节：
  - `content_id`：主键并关联 `content.contents`；
  - `base_form`、`tone`（1 至 5）、`display_form`；
  - `(base_form, tone)` 唯一，`display_form` 唯一。
- 新增 `content.zh_syllable_pinyin_elements`，保存有序组成关系：
  - `syllable_content_id`、`pinyin_element_content_id`、`position`、`role`；
  - 主键为 `(syllable_content_id, position)`，允许元素重复。
- 在内容身份类型中新增 `zh_syllable` 和 `zh_pinyin_element`。
- 通过 `content.zh_hanzi_syllables` 关联汉字与中文音节：允许一个可选主读音和任意多个次要读音。
- 数据迁移只转换存在确定拆分映射的旧 `zh_pinyin` 记录。若存在无法确定的记录，迁移必须报错停止，不允许猜测转换，也不允许带着旧表进入运行期。

### JCB-002——词语与句子的有序组成关系

- 保留既有 `content.zh_word_hanzi` 有序关系；关系本质为多对多，并通过位置允许同一汉字重复出现。
- 分别新增 `content.zh_sentence_words` 和 `content.lo_sentence_words`，禁止中老文共用关系表。
- 两张表均以 `(sentence_content_id, position)` 为主键，并通过同语言外键关联词语；允许词语重复。
- 关系项可保存可选 `surface_form`，用于还原标点、空格或变体展示，不修改规范词语本身。
- 草稿阶段允许组成不完整；提交审核和发布时必须满足非空、位置连续。
- 发布前必须确认所有下级依赖均已有发布版本，并拒绝任何跨语言引用。

### JCB-003——可配置权限，不预设固定角色矩阵

- 角色继续由 Operations 自定义配置，不新增“编辑员、审核员、管理员”等固定角色或强制分配矩阵。
- 每个内容类别登记四类能力：`read`、`write`、`review`、`publish`。
- 权限资源按语言分离：
  - 中文：`zh_pinyin_elements`、`zh_syllables`、`zh_hanzi`、`zh_words`、`zh_sentences`；
  - 老挝语：`lo_letters`、`lo_syllables`、`lo_words`、`lo_sentences`。
- 示例：`content.zh_syllables.write`、`content.lo_words.review`。
- 菜单可见性使用对应的 `.read` 权限；正式上线后，这些类别菜单不再依赖“空权限代表所有人可见”。
- 权限迁移只默认授予既有 `super_admin` 角色；其他角色由运营人员通过现有角色权限页面配置。
- 审核和发布始终是两项独立能力，可授予相同或不同的自定义角色。

## 迁移策略

1. 只通过新的前向迁移新增表和内容类型，不改冻结迁移。
2. 新增权限，并且只默认授予 `super_admin`。
3. 在切换前离线检查旧拼音数据，自动转换可确定拆分的记录；发现模糊记录时直接阻止迁移。
4. 同一个发布窗口内完成数据转换、后台和后端接口切换，不设置双读或双写阶段。
5. 切换成功后移除旧 `content.zh_pinyin` 结构及旧接口；新代码不得引用旧模型。
6. 迁移不得静默清空旧数据。若产品决定旧数据无需保留，必须另行明确授权数据清除范围。

## 确认后的影响

本决策包采用后，`BLOCKER-001`、`BLOCKER-002`、`BLOCKER-003` 已一次性解除，并已同步修改 Content/Operations 权威文档、增加一次性切换的前向数据迁移。后续按该契约实现后端接口以及完整类别增删改查和版本流程。本决策不包含移动端、Audio 音频生产、固定角色、跨语言通用结构表或旧版运行兼容。
