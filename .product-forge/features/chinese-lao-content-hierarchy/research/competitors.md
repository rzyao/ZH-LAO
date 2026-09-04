# 竞品与参考研究：中老语言内容层级

> 研究状态：仅作为证据，不修改产品、领域、架构、数据库或接口权威。

## 范围与确认基线

- 首期仅建设内部管理后台，不包含学习者端或移动端。
- 老挝语内容层级为“字母 → 音节 → 词语 → 句子”。
- 中文内容层级为“拼音 → 中文音节 → 汉字 → 词语 → 句子”。中文音节不是音频资产。
- 中文与老挝语使用独立物理结构表，音频生产和资产仍由 Audio 域负责。
- 两种语言都需要编辑版本、审核和发布生命周期。

## 可公开验证的参考模式

### 一、可复用内容应集中管理并受角色权限控制

[Moodle 内容库](https://docs.moodle.org/405/en/Content_bank)将可复用互动内容集中保存，并将访问、创建编辑、管理、上传、下载和删除能力分配给不同角色。[H5P 导入与导出](https://h5p.org/documentation/for-authors/import-and-export)展示了互补的复用方式：作者可在兼容内容类型中复用已有内容，而跨站复用是明确的导入导出动作。

对本功能的启示：规范语言单位应作为语言专属目录中的一等记录维护，不能重复嵌入课程字段。复用关系需要显式建模，编辑和发布操作需要权限保护。中文与老挝语仍必须使用独立结构表，不能以通用 `content_item` 表代替。

### 二、发布内容必须与草稿隔离

[GitBook 变更请求](https://gitbook.com/docs/collaboration/change-requests)提供了可借鉴的治理模型：从正式内容创建可编辑副本，发起审核后才允许合并。其[接口参考](https://gitbook.com/docs/developers/gitbook-api/api-reference/change-requests)提供持久状态、版本标识、时间和过期指示；[审核工作流](https://gitbook.com/docs/guides/editing-and-publishing-documentation/how-to-collaborate-on-change-requests)则强调合并前差异预览以及合并后的正式发布。

对本功能的启示：每个中老语言单位都需要稳定身份和不可变、可恢复的编辑版本。审核人员在发布前应看到版本差异及候选层级关系；存在新草稿或待审核版本时，学习者可见的已发布投影必须保持不变。具体状态、审核人数和回滚规则仍由本项目权威契约决定，不能从竞品直接照搬。

### 三、语言元数据与分词不能当成普通文本处理

W3C 的[语言标签指南](https://www.w3.org/International/articles/language-tags/index.en.html)说明语言标签用于标识内容语言，与地区偏好不同；应使用足以表达差异的最短标签。[标签选择指南](https://www.w3.org/International/questions/qa-choosing-language-tags.en.html)指出拼音可关联 `zh-Latn`，需要明确普通话时可使用 `cmn-Latn-pinyin`。

Unicode UAX #29 相关工作指出，中文和老挝语的词边界都需要词典支持，不能假设像英文一样以空格或单一字符边界完成切分，参见 [Unicode 技术草案](https://www.unicode.org/L2/L2022/22159-uax29-40-wd.pdf)。

对本功能的启示：必须保留显式的语言专属层级关系和编辑顺序；禁止仅按 Unicode 字符或空格自动推导中文词语、老挝语词语及句子组成。语言标识用于校验边界，不能成为合并两种语言结构表的理由。

### 四、发音知识与音频资产是不同概念

[Lexicala 接口文档](https://api.lexicala.com/documentation/)将 IPA 等发音信息和例句视为词汇数据，与音频资产并不等同。W3C 的语言标签指南也说明音频可附带语言信息，但文字脚本标签通常不适用于音轨本身。

对本功能的启示：中文音节应作为中文层级中受版本治理的语言知识实体，拥有独立身份；获批音频通过 Audio 域的绑定机制关联，媒体文件不能成为中文音节的定义。

## 首期后台建议

1. 中文和老挝语采用独立工作区、导航、搜索、校验和批量导入导出契约。
2. 层级编辑器显示父子关系、顺序、引用数量以及修改或发布影响。
3. 每种语言拥有独立审核工作区，支持派生草稿、比较正式版本、提交审核、原子发布和历史追踪。
4. 发布前检查同语言依赖、关系顺序和跨语言引用，任何失败均阻止发布。
5. 语言结构编辑器只展示音频绑定状态，音频选择和生产不进入其事实源。

## 风险与后续问题

- 已确认结构表分离，但具体表集合、字段、基数、版本快照和发布事务边界仍需权威契约确定。
- 汉字到词语、词语到句子在自然语言中均可能是多对多关系，首期应明确允许重复、变体和有序成员关系。
- 拼音到中文音节需要规范化规则，包括声调、分隔符、替代拼法和方言范围。
- 老挝语正字法切分和中文分词必须使用语言相关编辑规则；任何自动建议都需人工审核。

## 参考来源

- Moodle：[内容库](https://docs.moodle.org/405/en/Content_bank)
- H5P：[导入与导出](https://h5p.org/documentation/for-authors/import-and-export)
- GitBook：[变更请求](https://gitbook.com/docs/collaboration/change-requests)、[变更请求接口](https://gitbook.com/docs/developers/gitbook-api/api-reference/change-requests)
- W3C：[HTML/XML 语言标签](https://www.w3.org/International/articles/language-tags/index.en.html)、[选择语言标签](https://www.w3.org/International/questions/qa-choosing-language-tags.en.html)
- Unicode：[UAX #29 词边界草案](https://www.unicode.org/L2/L2022/22159-uax29-40-wd.pdf)
- Lexicala：[接口文档](https://api.lexicala.com/documentation/)
