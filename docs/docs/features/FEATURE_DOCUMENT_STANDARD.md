---
status: active
---

# Feature 文档规范 V2

## 1. Feature Page 定位

每个正式 Feature 必须有且只有一个人工维护的 canonical Feature Page：

```text
/features/<feature_id>/index.md
```

Feature Page 是：

```text
产品交付事实源
```

它描述：

- 用户或运营人员能够完成的端到端能力；
- 当前生命周期状态；
- 各交付 Lane 的真实进展；
- Evidence 与 Gate 关系。

Feature Page **不复制**：

- Domain canonical 数据事实；
- Backend Contract；
- 数据库模型事实；
- 领域状态机事实。

来源关系：

```text
Domain
 ↓
Capability
 ↓
Feature
 ↓
Implementation
 ↓
Evidence
```

---

# 2. Frontmatter 规范

```yaml
feature_id: audio-production
title: 音频生产
portfolio_status: active

domain:
  primary: audio

dependencies:
  - content
  - operations

status:
  design: done
  backend: blocked
  admin: active
  mobile: na
  integration: blocked
  acceptance: todo
```

## 状态规则

Lane 状态只允许：

```text
todo
ready
active
blocked
done
na
```

展示：

|状态|展示|
|-|-|
|todo|○ 未启动|
|ready|▶ 就绪|
|active|⏳ 进行中|
|blocked|⛔ 阻塞|
|done|✅ 完成|
|na|— 不适用|

规则：

- blocked 必须说明阻塞对象、原因、解除条件；
- active 必须说明已完成和当前进行内容；
- done 必须提供真实 Evidence；
- na 必须说明不适用原因。

---

# 3. 页面固定结构

所有 Feature Page 必须使用以下顺序：

```text
功能概览
生命周期状态
核心能力
参与角色
责任边界
架构关系
状态机
设计
Backend
Admin
Mobile
集成
验收
证据
Gate 汇总
下一步
```

章节顺序不可随意调整。

---

# 4. 功能概览

必须回答：

- 这个 Feature 是什么；
- 解决什么业务问题；
- 属于哪个交付范围。

禁止只写技术模块名称。

---

# 5. 生命周期状态

Feature Page 必须展示当前生命周期：

示例：

|阶段|状态|说明|
|-|-|-|
|需求定义|✅|能力已确认|
|设计|✅|Canonical 已冻结|
|Backend|⛔|等待依赖|
|Admin|⏳|设计阶段|
|集成|⛔|等待实现|
|验收|○|未开始|

生命周期状态用于人工理解，Frontmatter 用于机器读取。

---

# 6. 核心能力 Capability

每个 Feature 必须明确能力层。

结构：

```text
Feature
 ↓
Capability
 ↓
Implementation
```

Capability 描述业务能力，不描述代码文件。

例如：

```text
音频生产
 ├── 音频任务管理
 ├── 音频版本管理
 ├── 审核发布
 └── 运营管理
```

---

# 7. 参与角色

Feature 必须说明参与者：

例如：

- 用户；
- 运营人员；
- 管理员；
- 系统服务；
- 外部 Provider。

用于明确责任边界。

---

# 8. 责任边界

必须明确：

## 本 Feature 负责

## 本 Feature 不负责

禁止因为 Feature 跨 Domain 而复制其他 Domain 的事实。

例如：

```text
Audio Production
≠
Learning 播放能力
```

---

# 9. 状态机

涉及生命周期的 Feature 必须展示状态机。

例如：

```text
创建
 ↓
处理中
 ↓
审核
 ↓
发布
```

状态机事实来源仍属于 Domain Canonical。

Feature Page 只展示交付相关视图。

---

# 10. Lane 规范

固定 Lane：

```text
设计
Backend
Admin
Mobile
集成
验收
```

每个 Lane 必须包含：

```text
状态
范围
Stage / 工件 / Gate
下一步
```

---

# 11. Gate 与 Evidence

Gate 用于判断阶段是否通过。

Evidence 必须是真实来源：

- 文档；
- 代码；
- 测试；
- Report；
- Gate 产物。

禁止：

```text
设计完成
=
系统完成
```

禁止使用数据库 Migration 存在证明 Backend 已实现。

---

# 12. 派生关系

以下内容从 Feature Page 派生：

- FEATURE_PAGE_INDEX.json；
- DOMAIN_LIFECYCLE_MATRIX；
- Feature Inventory。

Matrix 只展示 Lane 概览，不展示详细 Stage。

详细信息必须回到 Feature Page。

---

# 13. 中文化规范

Feature Page 展示层优先使用中文。

推荐：

|英文|中文|
|-|-|
|Capability|核心能力|
|Lifecycle|生命周期|
|Actor|参与角色|
|Scope Boundary|责任边界|
|Architecture|架构关系|
|Evidence|证据|
|Gate|阶段门禁|
|Next Action|下一步|

代码、API、数据库字段保持原英文。

---

# 14. Feature 页面质量标准

一个合格 Feature Page 必须回答：

1. 这个功能是什么？
2. 当前做到哪一步？
3. 谁负责什么？
4. 依赖什么？
5. 为什么是当前状态？
6. 下一步是什么？
7. 如何证明？

