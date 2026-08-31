---
status: design-ready
last_updated: 2026-08-31
feature_id: audio-production
feature_type: cross-domain
primary_domain: audio
participating_domains:
  - content
  - operations
---

# 音频生产

## 运营目标

运营人员能够把 Content 提供的音频生产需求转化为经过生产、审核并发布的正式音频版本。

## 端到端流程

```text
Content 提供业务对象与规范生产输入
↓
Audio 建立 / 识别 Slot
↓
创建生产 Task
↓
TTS 或人工录音产生候选 Asset Version
↓
审核
↓
发布
↓
official_asset_version_id 成为当前正式音频
```

authoritative 业务规则见 [音频生产领域](/domains/audio/)、[生产与审核](/domains/audio/production) 与 [工作流与状态机](/domains/audio/lifecycle)。

## 领域关系

| 角色 | 领域 | 本功能中的职责 |
| --- | --- | --- |
| 主要领域 | [音频生产（Audio Production）](/domains/audio/) | Slot、Task、Attempt、Asset Version、Review、Publish 与生产生命周期 |
| 参与领域 | [内容（Content）](/domains/content/) | canonical 教学内容、发音要求与生产输入 |
| 参与领域 | [运营（Operations）](/domains/operations/) | Operator、RBAC 与后台操作审计身份 |

此外依赖 [基础设施与集成](/architecture/infrastructure/) 提供物理 Asset/Storage、Outbox 与外部 Provider Adapter；Infrastructure 不是业务 Domain，因此不放入 `participating_domains`。

`primary_domain: audio` 只表示 Feature 的主要业务协调领域，不表示 Content 或 Operations 从属于 Audio，也不改变各自 canonical ownership。

## Backend

- [Audio Backend 实施入口](/development/backend/audio/)
- 当前设计已经恢复并通过设计门禁；正式 Backend 实施仍需按当前 Entry Gate / Task Manifest 推进。

## Admin

- [音频生产工作台实施入口](/development/admin/audio-production/)
- Admin 是本 Feature 的主要人工操作界面，应按页面/工作流组织，而不是把 9 张 Audio 表各做一个 CRUD 页面。

## Mobile

Mobile 不是音频**生产** Feature 的 required 操作端。App 对正式音频的播放消费属于学习/内容消费能力，应由对应 Feature 单独验收。

## Feature 验收重点

最终 Feature Gate 至少应覆盖：

- 能看到合法待生产任务；
- TTS 与人工生产路径遵守同一业务边界；
- 审核拒绝不会伪造成技术失败；
- approved 不自动等于 published；
- 发布只改变同一 Slot 的正式版本指针；
- 并发生产/发布不产生两个当前正式版本；
- 操作权限与审计能够追踪到 Operator；
- 物理文件事实仍由 Asset Infrastructure 管理。

## 交付状态

| 轨道 | 当前状态 |
| --- | --- |
| Audio Domain | 设计已冻结主要业务事实 |
| Content / Operations | 已提供所需边界事实 |
| Backend | 正式实现待推进 |
| Admin Workbench | 待建立/执行页面实施任务 |
| Mobile | 非生产主入口 |
| E2E Feature Gate | 待完成 |

因此当前状态是“设计可用于实施”，不是“音频生产功能已交付”。
