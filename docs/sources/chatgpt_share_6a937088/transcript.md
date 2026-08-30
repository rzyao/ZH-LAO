# 拆分学习域

_消息数：11　总字符：4603_


---

### [01] SYSTEM　status=finished_successfully

_(empty)_


---

### [02] SYSTEM　status=finished_successfully

_(empty)_


---

### [03] USER　status=finished_successfully

[全域数据库最终审计](chatgpt-conversation://6a934480-c434-83e9-993a-c120d7688e3c)把学习域拆分为内容域和学习域


---

### [04] SYSTEM　status=finished_successfully

_(empty)_


---

### [05] SYSTEM　status=finished_successfully

_(empty)_


---

### [06] SYSTEM　status=finished_successfully

_(empty)_


---

### [07] ASSISTANT　status=finished_successfully

_(empty)_


---

### [08] ASSISTANT　status=finished_successfully

The output of this plugin was redacted.


---

### [09] ASSISTANT　status=finished_successfully

_(empty)_


---

### [10] ASSISTANT　status=finished_successfully

_(empty)_


---

### [11] ASSISTANT　status=finished_successfully

可以。这里应当把《全域数据库最终审计》里原来的 **Learning Domain** 拆成两个独立边界，但**只调整 Domain 归属，不重新设计已经定稿的数据模型**。

:::writing{variant="document" id="48317"}
# 全域数据库最终审计修订：Learning 拆分为 Content + Learning

基于已经完成的全域数据库最终审计，现对原 `Learning Domain` 做一次边界修订。

本次修订属于 **Domain 职责拆分**，不是重新设计数据库。

## 一、最终裁决

原：

`Learning Domain`

正式拆分为：

- `Content Domain`
- `Learning Domain`

原则：

> Content 管“用户学什么”；Learning 管“用户学得怎么样”。

原 Learning 中已经定稿的数据模型、字段、约束、索引等原则上保持不变，只根据职责重新划分所属 Domain。

---

# 二、Content Domain

## 定位

`Content Domain` 是学习内容的 canonical source of truth。

负责所有与具体用户无关、可以被多个用户共同消费的教学内容。

典型职责包括：

- 课程体系
- 单元
- 课程 / Lesson
- 词汇
- 句子
- 教学文本
- 内容之间的组织关系
- 内容语言信息
- 标准答案
- 标准发音要求
- 教学内容版本
- Content Revision
- 内容发布状态

判断标准：

> 即使系统中一个用户都没有，这些数据依然存在，则原则上属于 Content Domain。

Content Domain 不负责：

- 用户学习进度
- 用户掌握程度
- 用户完成状态
- 用户个人学习记录
- 用户复习状态
- 用户学习行为

---

# 三、Learning Domain

## 定位

新的 `Learning Domain` 专门负责：

> 用户 × Content 之间产生的学习状态和学习事实。

典型职责包括：

- 用户课程进度
- 用户 Lesson / Unit 进度
- 用户词汇学习状态
- 用户句子学习状态
- 用户完成记录
- 用户掌握状态
- 学习历史
- 复习状态
- 学习统计所需的 canonical learning facts

判断标准：

> 数据只有在某个用户开始学习之后才产生，则原则上属于 Learning Domain。

Learning 不再拥有课程、词汇、句子等 canonical 内容本身。

---

# 四、两个 Domain 的关系

依赖方向明确为：

`Learning → Content`

Learning 可以保存：

- `user_id`
- `content_id`
- `course_id`
- `lesson_id`
- `unit_id`
- `vocabulary_id`
- `sentence_id`

等 logical references。

但必须遵守全局数据库规范：

- Content 内部实体可以继续使用已经定稿的内部 PK。
- 所有会被其他 Domain 引用的 Content 实体必须具有稳定 UUID logical/public ID。
- Learning → Content 不建立跨 Domain physical FK。
- Learning 不得引用 Content 的内部 BIGINT PK。
- Identity 用户同样通过稳定 UUID logical ID 引用。
- Learning → Identity 不建立 physical FK。

---

# 五、内容事实与用户事实严格分离

以下事实属于 Content：

`这个词是什么`
`这个句子的正文是什么`
`这个 Lesson 包含什么`
`正确答案是什么`
`标准发音要求是什么`
`当前 Content Revision 是什么`

以下事实属于 Learning：

`用户是否学过这个词`
`用户是否完成这个 Lesson`
`用户对这个句子的掌握程度`
`用户最后一次学习时间`
`用户是否需要复习`

不得为了查询方便在 Learning 中复制第二份 canonical 内容。

---

# 六、Content Revision

原 Learning Domain 中承担的 Content Revision 职责现在正式迁移到：

`Content Domain`

Content Revision 描述：

> 教学内容本身发生了什么版本变化。

它不是用户学习进度的一部分。

Learning 可以记录：

`用户学习时对应的 content revision`

用于判断：

- 内容更新后是否需要重新学习
- 已学习进度是否仍然有效
- 统计应该按照哪个内容版本解释

但 Revision 本身仍由 Content Domain 管理。

---

# 七、Audio Production Domain 契约同步修正

此前已经确定：

> 文本、正确发音要求、Content Revision 由学习侧拥有，Audio Production 只负责生产音频。

Learning 拆分后，此处正式修订为：

> **Content Domain 拥有文本、正确发音要求和 Content Revision。**

因此依赖关系改为：

`Audio Production → Content`

而不是：

`Audio Production → Learning`

Content 提供稳定 logical UUID，例如：

`content_entity_id / content_revision_id`

Audio Production 使用 logical reference，不建立跨 Domain FK。

Audio Production 仍然只负责：

- audio slot
- production task
- generation attempt
- asset version
- review
- production event
- batch
- preset

Audio Production 不拥有教学文本，不成为教学内容 canonical source。

---

# 八、其他 Domain 引用学习内容时的规则

Social、Chat、Commerce、Rewards、Audio Production、Operations、Trust 等 Domain，如果需要指向教学内容：

统一引用：

`Content Domain logical UUID`

而不是 Learning Domain 内部 ID。

如果引用的是：

> 某个用户的学习事实

才引用：

`Learning Domain logical UUID`

因此两个概念必须严格区分：

`content_id`

和：

`learning_record_id / progress_id`

不得混用。

---

# 九、事件归属

内容相关事件归 Content，例如：

- content_created
- content_updated
- content_published
- content_revision_created
- lesson_published

学习行为事件归 Learning，例如：

- learning_started
- lesson_completed
- vocabulary_learned
- review_completed
- progress_updated

Content 不记录用户学习事实。

Learning 不产生第二份内容事实。

---

# 十、数据库 Schema

建议最终数据库 Schema 明确分离为：

`content.*`

和：

`learning.*`

原 Learning Domain 中的表按照职责迁移：

### 迁入 `content.*`

所有：

- 教学内容定义表
- 内容组织关系表
- 课程 / Unit / Lesson 定义表
- Vocabulary / Sentence 等 canonical content 表
- Content Revision / Version 相关表

### 保留在 `learning.*`

所有：

- 用户进度表
- 用户学习状态表
- 用户完成事实表
- 用户复习状态表
- 用户与教学内容产生的学习关系表

本次只是 Schema / Domain ownership 调整。

**不得因为拆 Domain 顺便重新设计已经最终定稿的表。**

---

# 十一、最终架构规则

从本次修订开始，全域设计统一采用以下定义：

### Content Domain

**Canonical Learning Content**

回答：

> 系统有什么可以学？

### Learning Domain

**User Learning State & Facts**

回答：

> 某个用户学了什么，以及学得怎么样？

关系：

`Identity → Learning → Content`

其中箭头仅表示逻辑依赖，不表示数据库 physical FK。

---

# 十二、最终裁决

本次修订正式覆盖此前所有将以下职责统称为 `Learning Domain` 的表述：

- 教学内容
- 用户学习状态

以后必须严格区分：

**Content Domain = 教学内容事实**

**Learning Domain = 用户学习事实**

原有已经定稿的业务模型继续有效。

除 Domain ownership、Schema 名称以及由此产生的跨 Domain logical reference 调整之外，不因本次拆分增加、删除或重新设计业务表。

全域其他已经最终定稿的 Domain 保持不变。
:::

这里有一个需要同步修改的关键点：之前 **Audio Production Domain** 定稿里写的是“Learning 拥有文本 / 正确发音 / Content Revision”，现在应该统一改成 **Content Domain 拥有这三类事实**；Learning 不再承担它们。memcite
