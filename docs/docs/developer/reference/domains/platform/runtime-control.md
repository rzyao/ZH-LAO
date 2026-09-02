---
status: frozen
last_updated: 2026-08-31
---

# 运行控制

本页定义 Platform 的 Feature Flag、范围覆盖和 Runtime Config。

## Feature Flag

Feature Flag 回答：

> 某个已经由代码实现的产品能力，在当前运行环境下是否对某个范围开放？

它不定义业务能力本身。

```text
代码定义能力
↓
Feature Flag 决定开放与否
```

## Flag Definition

Flag 定义至少具有稳定 Key、名称/描述、当前生命周期状态与默认启用语义。

已经进入使用的 Flag 不应通过普通物理删除消失；停止使用时通过 inactive / retired 等生命周期表达。

Flag 的状态与 enabled 语义必须保持一致，不能出现“已 retired 但仍作为普通 active flag 被开放”的矛盾状态。

## Feature Flag Override

Override 用于对特定范围覆盖默认行为。

典型范围可以包括冻结契约允许的：

```text
Region
Client / Platform
其他明确的 rollout scope
```

不同 Scope 使用关系化字段和唯一约束表达，不使用万能 `conditions/rules JSONB`。

Override 是当前状态数据；业务取消某个 Override 时可以删除该当前关系，不需要把所有历史配置都留在业务主表里。

## Flag 不替代状态机

错误示例：

```text
user_123_is_banned = true
conversation_abc_disabled = true
order_x_refundable = false
```

这些都属于具体业务领域状态/规则，不属于 Feature Flag。

正确示例：

```text
新发现页是否开放
某客户端是否展示新功能入口
某地区是否开放某个已经实现的产品能力
```

## Runtime Config

Runtime Config 只保存**真正跨领域、需要运行期统一读取的产品参数**。

V1 是 current-state 模型，不自动维护配置版本/回滚历史。

每个配置项应有稳定 Key、明确 Value Type 和应用层校验规则。

JSONB 可以用于动态配置值，但必须由 `value_type` / schema / application validation 约束其实际语义。

## Runtime Config 边界

以下不应塞入 Platform Runtime Config：

```text
Gift Price
Payment Limit
Refund Rule
Wallet Rule
Reward Amount
Reward Rule
Moderation Threshold（如果属于 Trust 业务规则）
Social Match Rule
Learning Mastery Rule
```

如果一个配置决定某个 Domain 的核心业务行为，应优先由该 Domain 自己拥有。

## 读取与缓存

消费者可以通过 Platform Public Contract / API 获取当前有效运行控制状态。

任何缓存都只是性能优化，不能成为独立 canonical fact；必须有明确失效策略，不能因为缓存导致 Flag/Config 修改长期不生效。

## 管理权限

后台修改 Platform 状态时：

```text
Identity Authentication
↓
Operations RBAC
↓
Platform Application Service
↓
Platform canonical mutation
↓
Operations Audit
```

Operations 只负责 Actor/Permission/Audit，不直接 SQL 修改 `platform.*`。

## 安全原则

Runtime Config 和 Feature Flag 不是 Secret Store。

不得保存：

```text
数据库密码
Provider Secret
JWT Signing Secret
SMS Credential
对象存储 Secret Key
```

真正的服务器 Secret 属部署/Secret Management 基础设施。
