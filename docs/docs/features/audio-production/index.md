---
feature_id: audio-production
title: 音频生产
portfolio_status: active
domain:
  - audio
  - content
  - operations
status:
  design: done
  backend: blocked
  admin: active
  mobile: na
  integration: blocked
  acceptance: todo
mobile_pages: []
admin_pages:
  - admin-audio-production
blocks:
  backend: CONTENT_GATE
  integration: AUDIO_GATE + CONTENT_GATE
evidence:
  design:
    - /domains/audio/production
    - /domains/audio/contracts
    - /development/07-audio/AUDIO_DESIGN_RECOVERY_BRIEF.md
    - /development/07-audio/AUDIO_DESIGN_AUDIT.md
  backend:
    - /development/07-audio/AUDIO_IMPLEMENTATION_PLAN.md
    - /development/07-audio/AUDIO_PRODUCTION_CONTRACTS.md
  admin:
    - /development/admin/audio-production/
    - /development/admin/audio-production/AUDIO_PRODUCTION_ADMIN_DESIGN_BRIEF.md
  integration:
    - /domains/audio/contracts
    - /development/07-audio/AUDIO_PRODUCTION_CONTRACTS.md
active_notes:
  admin: AUDIO-PRODUCTION-ADMIN-DESIGN 仅进入 ready 的 Admin 设计 Stage；尚未形成 AUDIO_PRODUCTION_ADMIN_DESIGN_GATE PASS，也未开始 Admin Implementation。
---

# 音频生产

## 功能概览

Portfolio Status：`active`。

本 Feature 只覆盖 **Audio Production**：把 Content 的规范音频需求转化为可追溯的生产任务、候选音频版本、人工审核与正式发布结果。

本次证据回填以远程 `main @ 3ddab9c4d610559abedd6a234752b7abc18d4681` 为审计基线。若旧轮次设计与当前事实冲突，以 Recovery 后冻结的 canonical、最新 Design Gate、当前真实实现依次裁决。

责任边界必须保持：

```text
Content canonical text / pronunciation / revision
≠
Audio production snapshot / task / version / review / official pointer

TTS provider / model / voice / preset parameters
≠
Audio tts_preset_key usage fact

Asset storage provider / bucket / object key / MIME / size / checksum
≠
Audio asset_id + Audio business version fact

Learning / Mobile 标准音频消费
≠
Audio Production
```

## 设计

状态：done

### Scope

Audio 负责生产控制面与业务事实：Slot 当前需求、Task、TTS Generation Attempt、人工录音最终提交、Asset Version、Review、Publish、Fresh/Stale、successor/retry、批次与默认 Preset Key 选择。

Audio **不**成为 Content 规范文本/发音的事实拥有者，不复制 TTS Provider/Model/Voice/Preset 参数，不拥有 R2/对象存储的 provider、bucket、object key 等物理文件 metadata，也不承接 Learning / Mobile 的标准音频消费能力。

### Stage / Artifact

Recovery 后的当前有效设计链：

- [生产与审核](/domains/audio/production)：冻结 Audio Production 业务语义与 Content / TTS / Asset 边界；
- [契约与边界](/domains/audio/contracts)：冻结 Content、Operations、TTS、Asset Infrastructure 跨域契约；
- [Audio Design Recovery Brief](/development/07-audio/AUDIO_DESIGN_RECOVERY_BRIEF.md)：说明旧污染设计的清理边界和 source precedence；
- [Audio Production Contracts](/development/07-audio/AUDIO_PRODUCTION_CONTRACTS.md)：冻结状态机、并发、worker、TTS、Asset、人工录音、审核与发布契约；
- `database/v2/migrations/0600_audio.sql`：冻结 9-table Slot / Task 模型，Recovery 明确保持 migration changes = 0；
- [Audio Design Audit](/development/07-audio/AUDIO_DESIGN_AUDIT.md)：Recovery 后独立审计与 Design Gate authority。

### Gate / Evidence

真实 Gate 结论：

```text
AUDIO_DESIGN_RECOVERY = COMPLETE
AUDIO_DESIGN_GATE = PASS
AUDIO_IMPLEMENTATION = NOT_STARTED
AUDIO_IMPLEMENTATION_ENTRY = BLOCKED_BY_CONTENT_GATE
```

PASS 只证明当前 Audio Production **设计**无 BLOCKER/HIGH/未决设计冲突；它不等于 `AUDIO_GATE = PASS`，也不授权在本 Feature 文档任务中启动 Backend、worker 或 Admin Implementation。

### Next Action

保持 Recovery 后 canonical 与冻结 `0600_audio.sql` 不变。后续若进入独立 Audio Implementation 会话，必须先按 [Audio Implementation Plan](/development/07-audio/AUDIO_IMPLEMENTATION_PLAN.md) 重新审计 Entry Gate；本 Lane 不再重新设计 Audio Domain。

## Backend

状态：blocked

### Scope

Backend 的目标实现边界由冻结计划限定为：

```text
apps/backend/src/modules/audio/
  domain
  application
  infrastructure
  http
  public
```

并复用 Foundation worker / Job 与 Asset Infrastructure，通过 public contract 消费 Content、Operations、TTS、Asset 能力。不得直接以跨域 SQL/FK 读取 `content.*` / `operations.*`，不得把对象存储/R2 metadata 搬入 Audio，也不得另造队列、Asset 或 TTS 配置体系。

### Stage / Artifact

当前 Stage 仍是 **ready-after-upstream-gates 的冻结实施计划**，不是正在实施：

- [Audio Implementation Plan](/development/07-audio/AUDIO_IMPLEMENTATION_PLAN.md) 明确 `design_only: true`、`implementation_started: false`；
- [Audio Production Contracts](/development/07-audio/AUDIO_PRODUCTION_CONTRACTS.md) 已提供实现所需业务契约；
- 当前仓库有 Foundation `apps/backend/src/assets/object-storage.ts`、Asset Repository、Job / WorkerHost 等可复用基础设施；
- 当前仓库仍没有 `apps/backend/src/modules/audio/`；
- 当前仓库仍没有 `apps/backend/src/modules/content/`；
- 当前 `07-audio` 没有 `AUDIO_IMPLEMENTATION_REPORT.md`，也没有能够证明 Backend 完成的 `AUDIO_GATE = PASS` 产物；
- 当前 Backend tests 没有 Audio module / Audio worker / Audio API 的完成测试集。

已有 `database/v2/migrations/0600_audio.sql` 只证明冻结的数据库物理契约存在，不等于 Audio Backend 已实现。

### Gate / Evidence

当前结论：**BLOCKED**。

[Audio Design Audit](/development/07-audio/AUDIO_DESIGN_AUDIT.md) 已明确：

```text
AUDIO_DESIGN_GATE = PASS
AUDIO_IMPLEMENTATION = NOT_STARTED
AUDIO_IMPLEMENTATION_ENTRY = BLOCKED_BY_CONTENT_GATE
```

[Audio Implementation Plan](/development/07-audio/AUDIO_IMPLEMENTATION_PLAN.md) 的 Entry Gate 要求至少包括：

```text
AUDIO_DESIGN_GATE = PASS                     # 已满足
CONTENT_GATE = PASS                          # 当前未形成实现 PASS 证据
Content public Audio capabilities implemented and tested
OPERATIONS_GATE = PASS
ADMIN_FOUNDATION_GATE = PASS                 # 后续 Admin integration 前置
```

Recovery Audit 已进一步确认当前不存在 `apps/backend/src/modules/content` 和 `CONTENT_IMPLEMENTATION_REPORT.md / CONTENT_GATE = PASS` 证据。因此这里不能把 Design PASS、migration 存在或 Foundation Asset/Worker 代码写成 Audio Backend 完成。

阻塞对象：`CONTENT_GATE` 及其 Audio 所需 Content public capability 的真实 implementation/test evidence。

### Next Action

本 F09 文档任务 **不解除该阻塞、不启动 Implementation**。只有上游 Entry Gate 在仓库形成真实 PASS 后，另开实现会话先执行 Implementation Plan 的 `AUD-00` re-audit，再从 `AUD-01` 开始实现；完成全部 mandatory tests / CI 并产出 `AUDIO_IMPLEMENTATION_REPORT.md` 后，才允许形成真实 `AUDIO_GATE` 结论。

## Admin

状态：active

### Scope

Admin 只负责 Audio Production 运营工作台：任务队列、分配、TTS / 人工录音入口、试听、候选版本、审核、发布、批量操作 / Preset 展示，以及对应 Operations 权限与审计交互。

Admin UI 不拥有 Audio 生产状态机、Content canonical、TTS 配置或 Asset/R2 物理存储事实；人工录音是管理员生产流程，不是普通用户 UGC 录音。

### Stage / Artifact

当前真实阶段是 `AUDIO-PRODUCTION-ADMIN-DESIGN`：

- [音频生产工作台](/development/admin/audio-production/) 入口仍标记 `status: planned`，并明确尚未建立正式 Admin Execution Brief / Blueprint / Report；
- [Audio Production Admin Design Brief](/development/admin/audio-production/AUDIO_PRODUCTION_ADMIN_DESIGN_BRIEF.md) 标记 `status: ready`，其 Mission 明确是**设计工作台而不是实现页面**；
- workflow task `AUDIO-PRODUCTION-ADMIN-DESIGN` 当前 `status: ready`，要求先生成 `AUDIO_PRODUCTION_ADMIN_EXECUTION_BRIEF.md`、`AUDIO_PRODUCTION_ADMIN_IMPLEMENTATION_BLUEPRINT.md`、`AUDIO_PRODUCTION_ADMIN_DESIGN_REPORT.md`；
- 当前 `apps/admin/src/features/` 只有既有 Platform 实现，没有 Audio Production feature implementation。

### Gate / Evidence

当前结论：**ACTIVE，但未完成**。

Admin Design Brief 的真实完成条件是：

```text
AUDIO_PRODUCTION_ADMIN_DESIGN_GATE = PASS
```

当前仓库尚无上述 Design Report / Gate PASS，因此不能把 `status: ready`、Brief 已存在或 Audio Design 已 PASS 写成 Admin done；更不能声称 Admin Implementation 已开始。

### Next Action

只继续 `AUDIO-PRODUCTION-ADMIN-DESIGN` 自己定义的设计产物链，形成可审计的 Design Report 与真实 Gate；随后仍需遵守 Audio Implementation Plan：Audio Backend gate candidate 与 Operations permission 能力真实可用后，才进入独立 Admin Implementation。本 F09 文档回填不代替该 Stage，也不创建 Admin 页面。

## Mobile

状态：na

### Scope

F09 Audio Production 没有面向普通用户的 Mobile 生产 Lane。Mobile / Learning 播放正式音频、缓存、播放器状态等属于标准音频**消费**能力，不属于本 Feature。

### Stage / Artifact

`N/A`。仓库中现有 Mobile audio foundation / playback 代码不得作为 Audio Production 完成证据。

### Gate / Evidence

`N/A by scope`。Canonical Audio contracts 将本 Feature 的生产主体限定在 Content → Audio Production → Asset Version / Review / Publish 链路；人工录音也是管理员主动触发的生产流程，而非普通用户 Mobile UGC 流程。

### Next Action

F09 无 Mobile 实施动作。标准音频消费继续由对应 Learning / Content 消费 Feature 独立维护，不在本页扩大范围。

## 集成

状态：blocked

### Scope

Integration 只验证 Audio Production 的真实跨域链：

```text
Content production requirement / revision
→ Audio Slot / Task
→ TTS or human recording
→ Asset Infrastructure object + canonical asset_id
→ Audio Asset Version
→ Review
→ Publish / official pointer
→ Operations RBAC + audit
→ Admin workbench
```

需要覆盖 Fresh/Stale、失败/重试、幂等/并发、Asset materialization、审核/发布与权限错误传播；不包含 Learning / Mobile 标准播放验收。

### Stage / Artifact

当前只有**冻结的集成契约与实施顺序**，尚无可执行的 Audio Production integration completion artifact：

- [契约与边界](/domains/audio/contracts) 冻结 Content / TTS / Operations / Asset ownership；
- [Audio Production Contracts](/development/07-audio/AUDIO_PRODUCTION_CONTRACTS.md) 冻结 TTS submit/poll、Asset `asset_id` materialization、人工录音、审核/发布、worker/lease 等契约；
- [Audio Implementation Plan](/development/07-audio/AUDIO_IMPLEMENTATION_PLAN.md) 将 Content public capability、Asset Infrastructure、TTS worker、Operations RBAC 与 Admin workbench 分阶段接入；
- 当前没有 Audio Backend module、Audio integration test suite 或 `AUDIO_IMPLEMENTATION_REPORT.md`。

### Gate / Evidence

当前结论：**BLOCKED**。

`AUDIO_GATE` 尚未形成，且 Audio Implementation 仍为 `NOT_STARTED`；同时实现入口仍被 `CONTENT_GATE` / Content public Audio capability 的缺失证据阻塞。Admin 也只在设计 Stage，尚无工作台实现可参与联调。

因此：

```text
AUDIO_DESIGN_GATE = PASS
≠
AUDIO_GATE = PASS
≠
Integration complete
```

现阶段没有真实端到端 PASS 可以回填。

阻塞对象：`CONTENT_GATE` → Audio Backend implementation/test → `AUDIO_GATE` candidate，以及后续 Admin implementation readiness。

### Next Action

等待 Backend 与其真实上游 Gate 解锁，并按冻结 Implementation Plan 完成 Content / TTS / Asset / Operations 集成与 mandatory tests；只有实际 integration / CI evidence 形成后才更新本 Lane。不得用设计契约替代端到端运行证据。

## 验收

状态：todo

等待 Integration 形成真实可执行证据后再定义/回填验收结果；当前不预写 PASS、不从 Design Gate 推导最终验收完成。
