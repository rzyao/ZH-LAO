---
status: active
last_updated: 2026-09-02
---

# 功能交付

Feature 表达**用户或运营人员能够完成的端到端能力**。每个正式 Feature 都有一个人工维护的 canonical Feature Page；索引从这些页面派生。

它是横向交付视图，不拥有第二份 Domain、API、数据库或状态机事实。

```text
Domain defines truth
        ↓
Backend exposes capability
        ↓
Admin / Mobile builds experience
        ↓
Feature E2E proves deliverable value
```

## 完整功能进度

完整 Feature Inventory 不再手工复制到本页，统一查看：

完整 Feature 清单、领域归属、页面关联和证据线索以各 Feature Page 与 `FEATURE_PAGE_INDEX.json` 为准；真实执行状态读取 Task Manifest、Stage Registry 与 Gate / Report。

这样功能数量增加后不会出现多个页面各维护一套状态的漂移。

## Canonical Feature Page

正式 Feature 清单中的每个功能都已经建立独立页面（当前 `102 / 102`）。页面由人工维护 Portfolio 状态、领域归属、边界、页面关联和证据线索，Feature 索引只读取这些页面。

- [用户登录与会话](login/index.md)
- [音频生产](audio-production/index.md)
- 其余功能通过左侧按 Domain 分组的“功能目录”进入。

尚未启动的 Feature Page 也必须存在，但必须写明功能定位、所属 Domain、决策阻塞或真实证据，不能是真正的空白页，也不得生成固定状态占位结构。

## Domain ↔ Feature

Feature 与 Domain 是二维关系：

```text
Domain Capability
= 领域内部稳定能力

Product Feature
= 跨层交付切片
```

一个 Feature 可以跨多个 Domain，一个 Domain 也可以服务多个 Feature。

Feature Inventory 的 `primary_domain` 只表示主要业务协调领域，不改变任何 canonical ownership。

规范见 [功能文档规范](FEATURE_DOCUMENT_STANDARD.md)，双向关系模型见 [领域能力与产品功能关系模型](/domains/FEATURE_RELATIONSHIP_MODEL)。
