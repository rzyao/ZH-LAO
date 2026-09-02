---
status: frozen
last_updated: 2026-09-02
---

# 领域能力与产品功能关系模型

本页定义领域能力（Domain Capability）与产品功能（Product Feature）的关系。

## 核心区别

```text
Domain Capability
= 某个领域稳定拥有的业务能力

Product Feature
= 用户或运营人员能够完成的端到端产品能力
```

例如：

```text
Identity Capability
- OTP 认证
- Session 创建与刷新
- 设备与会话管理

Product Feature
- 登录与会话
```

`登录与会话` 使用 Identity 能力，但不是 Identity 内部事实的第二份副本。

音频生产则天然跨多个边界：

```text
音频生产 Feature
├─ Content：提供 canonical 内容与生产输入
├─ Audio Production：拥有生产事实与生命周期
├─ Operations：提供 Operator / RBAC / 审计身份
├─ Asset Infrastructure：拥有物理文件事实
└─ Admin：提供音频生产工作台体验
```

因此 Feature 不物理放进某个 Domain 目录。

## 双向索引规则

每个 Domain 概览应在存在正式 Feature 时维护：

```text
领域能力地图
参与的产品功能
```

每个 Feature 应维护：

```text
primary_domain
participating_domains
```

`primary_domain` 表示该 Feature 的主要业务协调领域，不代表其它参与领域从属于它，也不改变 canonical ownership。

## 导航规则

Domain 页面和侧边栏可以链接相关 Feature，但真实文件仍位于：

```text
docs/docs/developer/features/<feature>.md
```

这类链接只是导航关系，不是文件所有权关系。

## 禁止

- 不得因为 Feature 的 `primary_domain` 把跨域事实复制进该 Domain；
- 不得为了“一个 Domain 下看起来完整”复制 Feature 文档；
- 不得在多个 Domain 下维护同一 Feature 的多份正文；
- 不得由 Feature 文档重新定义数据库、API、Public Contract 或状态机。

最终模型是二维关系：Domain 纵向定义稳定事实，Feature 横向组织产品交付。
