# ADR-021：Learning 域拆分为 Content + Learning

**状态：** `已接受`

**日期：** `2026-08-30`

**相关：** [ADR-018 全局数据库设计原则最终版](ADR-018-global-database-design-principles-final.md)、[ADR-020 Audio Production 独立成域](ADR-020-audio-production-domain.md)、[ADR-004 Learning Content Registry](ADR-004-learning-content-registry.md)、[Content 域](../domains/content/index.md)、[Content 数据库](../domains/content/database.md)、[Learning 数据库](../domains/learning/database.md)

## 背景

原 `Learning Domain` 同时承担两类职责：① 教学内容（课程/词汇/句子/练习定义/词典/发音知识）本身；② 用户学习产生的状态（进度/掌握/复习/历史）。「全域数据库最终审计」识别出这两类事实的成熟度、变更频率与跨域引用形态差异很大：

- 教学内容是**多用户共享的 canonical 事实**，变更走内容发布与版本（Revision），被 Audio、Rewards、Trust 等多个域引用。
- 用户学习状态是**单用户私有事实**，随学习行为高频产生，引用对象是「内容 + 用户」。

「拆分学习域」会话（分享 `https://chatgpt.com/share/6a937088-e570-83e9-912e-11cc3de27eba`）据此裁决拆分。

## 决策

1. **原 Learning Domain 正式拆分为两个一级域**：
   - **Content Domain** = Canonical Learning Content（用户学什么）：课程体系、单元、Lesson、词汇、句子、教学文本、内容组织关系、内容语言信息、标准答案、标准发音要求、教学内容版本、Content Revision、内容发布状态。判断标准：**即使系统中一个用户都没有，这些数据依然存在**。
   - **Learning Domain** = User Learning State & Facts（用户学得怎么样）：课程/Lesson/Unit 进度、词汇/句子学习状态、完成记录、掌握状态、学习历史、复习状态、学习统计 canonical facts。判断标准：**数据只有在某个用户开始学习之后才产生**。
2. **依赖方向**：`Identity → Learning → Content`（逻辑箭头，非数据库物理 FK）。Learning 可以保存 `user_id` / `content_id` / `course_id` / `lesson_id` / `unit_id` / `vocabulary_id` / `sentence_id` 等 logical references。
3. **跨域规则**：Content 内部实体保留已定稿内部 PK；**被其他域引用的 Content 实体必须具有稳定 UUID logical/public ID**；Learning → Content 不建跨域 physical FK；Learning 不得引用 Content 内部 BIGINT PK；Learning → Identity 不建 physical FK。
4. **事实严格分离**：不得在 Learning 中复制第二份 canonical 内容（D-099 Canonical Fact 单一归属）。Content Revision 归 Content 管理；Learning 只记录「用户学习时对应的 content revision」用于判断是否需要重学。
5. **Audio Production 契约同步（D-148）**：文本、正确发音要求、Content Revision 的拥有者由 Learning 修订为 **Content**；依赖 `Audio Production → Content`（取代原 `Audio Production → Learning`）。
6. **事件归属（D-149）**：内容事件（`content_created/updated/published`、`content_revision_created`、`lesson_published`）归 Content；学习行为事件（`learning_started`、`lesson_completed`、`vocabulary_learned`、`review_completed`、`progress_updated`）归 Learning。
7. **Schema 拆分**：`content.*` 与 `learning.*`。原 Learning 43 张必建表按职责迁移（定义类 → content、用户状态/行为类 → learning），**不因拆分增加、删除或重新设计已定稿业务表**；逐表归属清单待主会话给出（`designing`）。
8. **覆盖范围**：本裁决正式覆盖此前所有将「教学内容 + 用户学习状态」统称为 Learning Domain 的表述；原已定稿业务模型继续有效；全域其他已定稿 Domain 保持不变。业务 Schema 总数 10 → **11**。

## 备选方案与取舍

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| 拆分为 Content + Learning（本 ADR） | 两类事实边界清晰；跨域引用（Audio/其他域 → 内容）用 Content logical UUID；内容版本变更不影响学习状态模型 | 新增一个一级域与 Schema；43 张表需重新按职责归位（ownership 调整） | 采用 |
| 保持单一 Learning Domain | 不新增域 | 内容 canonical 事实与用户私有状态混域；跨域引用与内容发布/版本职责纠缠 | 不采用（本 ADR 取代） |

## 后果

### 正面影响

- 跨域引用语义清晰：引用**教学内容**统一用 Content logical UUID，引用**用户学习事实**才用 Learning logical UUID；`content_id` 与 `learning_record_id / progress_id` 不得混用。
- Content Revision、标准答案、标准发音要求等 canonical 事实归属唯一，符合 D-099。
- Audio Production 契约（D-148）与事实单一归属原则一致。

### 代价与风险

- 43 张必建表在 `content.*` / `learning.*` 的**逐表归属清单**待主会话给出（当前文档为按职责的建议映射，`designing`）。
- 跨域 logical reference 字段级落地（被跨域引用的 Content 实体 `public_id` 等）待逐表确认。
- Learning 旧音频表（`pronunciation_audios` / `tts_jobs`）迁移与计数调整沿用 D-145 未决项。

## 后续行动

- [ ] 主会话给出 43 张表的逐表归属清单（D-147 `designing`）。
- [ ] 主会话确认被跨域引用的 Content 实体 `public_id` 字段级落地。
- [ ] Learning 旧音频表删除/迁移与计数调整随 D-145 一并确认。
