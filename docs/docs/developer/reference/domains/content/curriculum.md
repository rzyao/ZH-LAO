---
status: baseline
last_updated: 2026-09-02
---

# Curriculum Domain（课程编排与学习大纲）

> 状态：Domain Framework Draft  
> 领域：Content Domain  
> 职责：定义课程组织层级、场景化对话编排、内容挂载契约、VIP 权限门控、每日学习排期与学习流消费模型。

---

## 1. 领域范围与层级模型

### 1.1 课程体系层次结构 [PA]
课程体系负责将离散的字母、音节、单词、句子组织为结构化的教学路径。

新系统统一规范为标准 5 级学习大纲体系：
```text
Course（课程）
   └── Unit（单元）
         └── Lesson（课时/对话组）
               └── LessonSection（课时小节）
                     └── LessonItem（课时项/挂载实体）
```

### 1.2 挂载实体引用契约（Mounting Contract）[PA, ADR-029]
- 课时项（LessonItem）通过受控的内容 logical UUID 关联具体词条或练习；正式课程/课节 revision snapshot 同时固定该引用所对应的 **published Content Revision UUID**。
- **只存引用，不复制本体**：课程结构只维护编排与排序元数据，不冗余复制词条文本或释义。
- **生命周期解耦**：课程编排调整不产生新的词条版本；词条版本升级发布也不自动重排课程顺序。
- Unit 与 LessonItem 是课程 aggregate 内部节点，不对客户端或跨域消费者暴露内部 BIGINT，也不伪造 public UUID。

### 1.3 课程与课节正式视图 [PA, ADR-029]
- Course 与 Lesson 都是独立 revisioned aggregate root；current published view 只由主实体的 `published_revision_id` 解析，working revision 由 `working_revision_id` 指向。
- Course revision snapshot 固定 Unit 顺序与 Lesson UUID/revision UUID；Lesson revision snapshot 固定 Section/Item 顺序及每个挂载内容或练习的 published revision UUID。
- 课程/课节已有 published view 时编辑必须派生新的 working revision；草稿、待审核、驳回或 approved revision 都不得作为学习端 current view。
- Learning 保存的课程、课节或挂载内容 revision UUID 是历史快照引用；之后任何课程或词条发布不得改写它。

---

## 2. 情景对话与场景编排 [PA]

### 2.1 场景化教学组织
- **情景分类/场景（Scene / Category）**：承载主题分类（如日常问候、餐饮就餐、交通出行），支持图标（Icon）、介绍与 VIP 访问级别。
- **对话课（Dialogue Lesson）**：归属于特定场景的会话教学课时，包含角色定义（如角色 A/B）与会话句子流。

### 2.2 编排完整性校验规则
- 页面挂载保存时，系统需进行全量引用有效性校验（内容存在、已上线且具有合法 published revision）；
- 严禁静默丢弃错误挂载，保存失败需精准反馈具体非法项及位置。

---

## 3. 访问控制与 VIP 门控体系 [PA]

### 3.1 权限梯队与门控语义
- 内容与课程节点均支持 VIP 门槛配置：`free`（免费）$\to$ `bronze`（青铜）$\to$ `silver`（白银）$\to$ `gold`（黄金）。
- **核心定义**：*VIP 等级是商业化访问控制门禁，并非语言学学习难度等级。*

### 3.2 访问鉴权规则
- 未登录用户：默认按 `free` 权限解析。
- 已登录用户：若 `vip_expire_at` 超期失效，自动降级为 `free`。
- 权限判定：用户当前有效等级 $\ge$ 节点要求的 VIP 等级方可访问，否则在 C 端隐藏或展示升级锁定提示。

---

## 4. 学习流程与消费模型 [PA]

### 4.1 每日学习与自动轮换回退机制（Daily Content Schedule）
- 每日内容通过排期表指定特定日期的内容条目（`sentence_id` + `word_ids`）。
- **无排期回退机制**：
  - 当日未配置运营排期时，C 端服务根据日期哈希对已上线的推荐内容池（`recommend_daily = true` 且 VIP 可见的正式词条）进行自动取模轮换。
  - 保障任何日期学习者均有合规的每日新词与每日一句展示。

### 4.2 课程学习进度记录
- 学习进度以「用户 × 课时/页面」为基本追踪单元。
- 记录学习状态（学习中 / 已完成）、累计学习时长（秒）、首次学习时间与最近活跃时间。

---

## 5. Engineering Reality 历史映射 [ER]

> 仅记录旧系统事实备查，不作为新系统架构依赖：
- 旧系统老挝语未落地 Level/Course/Chapter 体系，实际物理结构为 `app_menu`（菜单）$\to$ `app_menu_tree`（挂载树）$\to$ `app_category`（场景）$\to$ `app_page`（页面/对话）$\to$ `app_page_unit`（页面单元）。
- 旧表 `lao_course` / `lao_course_revision` 虽已在数据库建立但应用层零读写。
- 树结构变更在旧系统中曾采用存储过程 `update_app_menu_tree` 全量原子重建。

---

## 6. 未决事项 [UNKNOWN]

1. **[UNKNOWN] 老挝语方向官方学习等级大纲（Proficiency Stages）**：旧系统仅中文方向拥有 HSK 1~6 课程树；老挝语方向缺乏官方认定的等级划分（如初级/中级/高级标准），新系统需产品明确规划。
2. **[UNKNOWN] 练习与测试在课程中的节点形式**：旧系统 Lao 方向未设计课后练习或阶段性单元测试，新系统需决策 Lesson 内练习环节的挂载方式。
3. **[UNKNOWN] 离线课程包下载与同步策略**：移动端离线学习的数据同步契约与缓存失效机制待定义。
