---
status: active
---

# Feature 文档规范 V3

## 1. Feature Page 定位

每个正式 Feature 必须拥有唯一 canonical Feature Page：

```text
/features/<feature_id>/index.md
```

Feature Page 是端到端交付事实源，用于描述：

- 功能目标；
- 核心能力；
- 生命周期状态；
- 交付 Lane；
- Evidence 与 Gate。

Feature Page 不复制：

- Domain canonical 数据事实；
- Backend Contract；
- 数据库事实；
- Domain 状态机事实。

关系：

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

## 2. 页面导航规范

Feature 文档必须保证右侧目录可以完整展示所有章节。

规则：

1. 一级章节必须使用 `##`；
2. 二级内容使用 `###`；
3. 禁止跳级标题；
4. 所有 Feature 页面固定章节必须保持同级；
5. 不允许使用过深标题导致侧边导航折叠丢失。

固定导航：

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

文档系统生成目录时必须完整显示以上节点。

---

## 3. Frontmatter

```yaml
feature_id: audio-production
title: 音频生产
portfolio_status: active

status:
  design: done
  backend: blocked
  admin: active
  mobile: na
  integration: blocked
  acceptance: todo
```

状态：

```text
todo
ready
active
blocked
done
na
```

规则：

- blocked 必须说明原因、阻塞对象、解除条件；
- active 必须说明已完成和当前进行内容；
- done 必须提供 Evidence；
- na 必须说明不适用原因。

---

## 4. 固定章节

所有 Feature Page 必须包含：

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

章节不可删除。

---

## 5. 状态机规范

涉及生命周期的 Feature 必须设计状态机。

禁止：

```text
简单流程图
A → B → C
```

状态机必须明确：

```text
实体
 ↓
状态
 ↓
状态迁移
 ↓
权限动作
 ↓
Gate
 ↓
Evidence
```

必须回答：

- 状态属于哪个实体；
- 谁可以触发迁移；
- 什么条件允许迁移；
- 失败如何处理；
- 回滚如何处理。

---

### 5.1 状态机最小结构

```text
实体：xxx

状态：
创建
处理中
完成
失败

迁移：
创建 → 处理中
条件：xxx
权限：xxx
证据：xxx
```

---

### 5.2 多实体 Feature

如果 Feature 包含多个业务对象，禁止合并成一个状态机。

例如：

```text
生产任务状态机

音频版本状态机

正式引用状态机

权限决策层
```

必须分别定义。

---

## 6. 权限要求

涉及运营、后台、审核、发布能力的 Feature，状态迁移必须绑定权限。

格式：

```text
操作
 ↓
权限
 ↓
角色
 ↓
状态变化
```

例如：

```text
发布音频
 ↓
audio.publish
 ↓
发布人员
 ↓
候选版本 → 正式版本
```

禁止：

- 普通操作人员直接完成最终发布；
- 审核角色修改生产事实；
- 绕过 Gate 修改状态。

---

## 7. Lane 规范

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

## 8. Evidence 与 Gate

Evidence 必须是真实来源：

- 文档；
- 代码；
- 测试；
- Report；
- Gate 产物。

禁止：

```text
设计完成 = 系统完成
```

禁止：

```text
Migration 存在 = Backend 完成
```

---

## 9. 中文化规范

展示层优先中文。

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

代码、API、数据库字段保持英文。

---

## 10. 合格标准

Feature Page 必须回答：

1. 功能是什么？
2. 当前做到哪一步？
3. 谁负责什么？
4. 状态如何变化？
5. 谁可以改变状态？
6. 为什么当前状态成立？
7. 如何验证完成？

