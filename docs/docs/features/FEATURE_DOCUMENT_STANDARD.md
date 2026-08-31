---
status: active
---

# Feature 文档规范 V4

## 1. Feature Page 定位

每个正式 Feature 必须拥有唯一 canonical Feature Page：

```text
/features/<feature_id>/index.md
```

Feature Page 是端到端交付事实源，用于描述：

- 功能目标；
- 核心能力；
- 生命周期状态；
- 责任边界；
- Contract 边界；
- Dependency 关系；
- Gate 与 Evidence。

Feature Page 不复制：

- Domain canonical 数据事实；
- Backend Contract 定义；
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

## 2. Frontmatter

标准结构：

```yaml
feature_id: login
title: 用户登录与会话

portfolio_status: active

status:
  design: done
  backend: done
  admin: na
  mobile: ready
  integration: todo
  acceptance: todo

contracts:
  owns:
    - authentication
    - session
  consumes:
    - otp-provider
  forbidden:
    - profile-mutation

dependencies:
  upstream:
    - otp-provider
  downstream:
    - user-profile
  external:
    - facebook-provider
```

---

## 3. Feature 生命周期状态

状态：

```text
todo
ready
active
blocked
deferred
done
na
```

说明：

|状态|含义|
|-|-|
|todo|尚未进入执行|
|ready|输入条件满足，可以开始|
|active|正在执行|
|blocked|正在执行但存在阻塞|
|deferred|明确延期，不进入当前周期|
|done|完成并具备证据|
|na|不适用|

规则：

- blocked 必须说明原因、阻塞对象、解除条件；
- active 必须说明已完成内容和当前进行内容；
- done 必须提供 Evidence；
- deferred 必须说明延期原因。

---

## 4. Contract 边界规范

每个 Feature 必须声明自身责任边界。

格式：

```yaml
contracts:
  owns:
    - feature-owned-contract

  consumes:
    - upstream-contract

  forbidden:
    - out-of-scope-responsibility
```

必须明确：

- 本 Feature 拥有什么能力；
- 依赖什么外部 Contract；
- 禁止侵入哪些领域。

禁止：

```text
Login 修改 Profile
Profile 管理 Session
```

造成领域责任混乱。

---

## 5. Dependency 规范

每个 Feature 必须声明依赖关系。

格式：

```yaml
dependencies:
  upstream:
    - required-feature

  downstream:
    - dependent-feature

  external:
    - external-service
```

必须明确：

- 当前 Feature 依赖哪些前置能力；
- 哪些 Feature 依赖当前 Feature；
- 哪些外部系统影响当前 Feature。

Dependency 不等于 Contract：

```text
Contract
= 能力交互规则

Dependency
= 生命周期与交付依赖关系
```

禁止：

```text
Feature blocked
但是没有说明依赖对象
```

---

## 6. Evidence 规范

Evidence 必须结构化表达。

推荐格式：

```yaml
evidence:
  backend:
    artifacts:
      - implementation-report
    tests:
      - backend-test
    gate:
      - backend-gate
```

Evidence 来源只能是：

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

## 7. Gate 规范

Gate 必须说明：

```text
目标
 ↓
输入
 ↓
检查项
 ↓
结果
 ↓
Evidence
```

不同交付阶段使用对应 Gate，不允许使用 Domain Gate 替代 Feature Gate。

---

## 8. 状态机规范

涉及业务生命周期的 Feature 必须定义状态机。

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

多实体 Feature 必须拆分多个状态机。

---

## 9. 中文化规范

展示层优先中文。

代码、API、数据库字段保持英文。

|英文|中文|
|-|-|
|Capability|核心能力|
|Lifecycle|生命周期|
|Evidence|证据|
|Gate|阶段门禁|
|Contract|契约|
|Dependency|依赖|

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
8. 与哪些 Contract 有关系？
9. 与哪些 Feature 或外部系统存在 Dependency？
