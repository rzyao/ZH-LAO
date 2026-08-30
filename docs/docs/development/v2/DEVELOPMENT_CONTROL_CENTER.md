---
status: control-center
last_updated: 2026-08-31
---

# ZH-LAO V2 开发流程控制中心

> 本页是 **V2 开发执行与流程控制总览**。它解决“只看 Phase 表无法判断现在该做什么、什么能并行、哪些 Gate 没关、Admin/Mobile 是否落后、是否存在恢复任务”的问题。
>
> **状态事实来源优先级**：最终 Gate / Implementation Report → Design Audit / Design Gate → Execution Brief → `DEVELOPMENT_PROGRESS.md` → 本页摘要。若本页与更高优先级证据冲突，以更高优先级证据为准并修正文档漂移。

## 1. 三张控制图怎么用

日常只需要按顺序看：

1. **当前执行窗口**：今天/当前会话应该做什么。
2. **Domain 三轨矩阵**：Backend、Admin、Mobile/Client 是否同步。
3. **Gate / 依赖矩阵**：下一步为什么能开始或为什么被阻塞。

完整历史和测试证据仍保留在 [开发进度记录表](DEVELOPMENT_PROGRESS.md)；全局冻结规则见 [全量开发总计划](MASTER_DEVELOPMENT_PLAN.md)。

---

## 2. 当前执行窗口

基于当前 `main` 可验证文档，当前控制面应理解为：

| 工作流 | 当前状态 | 可以做什么 | 不允许做什么 |
| --- | --- | --- | --- |
| Platform Admin | `READY / Stage B pending` | 完成真实 Operator / RBAC / Audit / Live E2E | 不重做 Platform Backend |
| Operations Backend | `COMPLETE / PASS / FROZEN` | 作为后续 Admin / Domain RBAC 基础 | 不改变 frozen RBAC 语义 |
| Content Backend | `Design PASS / Implementation entry ready` | 依据 `CONTENT_EXECUTION_BRIEF.md` 正式实现并关闭 `CONTENT_GATE` | Content Admin 不得绕过 Content Gate |
| Content Admin | `BLOCKED` | 保留 Brief 与入口审计结果 | `CONTENT_GATE` 未 PASS 前不做正式业务实现 |
| Learning | `Design package exists` | 只有在真实 Content Gate 满足后进入 Backend Implementation | 不把 Learning 用户事实写回 Content |
| Audio Production | `DESIGN RECOVERY` | 执行 `AUDIO_DESIGN_RECOVERY_BRIEF.md`，恢复正确 Slot/Task 设计并重跑 Design Gate | 不开始 Audio Implementation；不修改 `0600_audio.sql` |

> 注意：本表是流程控制摘要，不替代具体 Gate 报告。执行任何工作前仍必须读取对应 Brief 的 Entry Audit。

---

## 3. 标准 Spec-Driven Domain 流程

每个 Domain 默认使用以下完整生命周期：

```text
Repository Audit
      ↓
Product Semantics
      ↓
Use Cases / Workflows
      ↓
API + Public Contract
      ↓
Implementation Plan
      ↓
Design Audit
      ↓
DESIGN_GATE = PASS
      ↓
Execution Brief
      ↓
Backend Implementation
      ↓
Integration / Security / Race / Regression
      ↓
IMPLEMENTATION_GATE = PASS
      ↓
DOMAIN = FROZEN
      ↓
Admin / Mobile Integration
      ↓
CLIENT_GATE / ADMIN_GATE
```

### Gate 之间不能互相替代

- `*_DESIGN_GATE = PASS`：只说明设计闭环，不表示代码完成。
- `*_GATE = PASS`：表示 Backend Domain Implementation 完成并冻结。
- `*_ADMIN_GATE = PASS`：表示管理后台已按真实 RBAC / API / E2E 完成。
- Mobile/Client 是否完成必须单独有集成证据，不能因为 Backend PASS 自动视为客户端完成。

---

## 4. Domain 三轨控制矩阵

> 这一张表是原 `DEVELOPMENT_PROGRESS` 最缺少的视角：一个 Domain 的 Backend 完成，不等于 Admin 和 Mobile 完成。

| Domain | Design | Backend | Admin | Mobile / Client | 下一控制动作 |
| --- | --- | --- | --- | --- | --- |
| Identity | `PASS` | `PASS / FROZEN` | Foundation/Operations 复用 | 后续完整 Client Integration 收口 | 保持冻结，只接受回归修复 |
| Platform | `PASS` | `PASS / FROZEN` | `Stage A complete / Stage B pending` | Runtime API 已存在，最终 Phase 14 收口 | 完成 Platform Admin Stage B |
| Operations | `PASS` | `PASS / FROZEN` | **待独立 Operations Admin 集成** | N/A | 建立/执行 Operations Admin Brief |
| Content | `PASS` | `ENTRY READY` | `BLOCKED by CONTENT_GATE` | 待 Backend PASS 后增量接入 | 先关闭 Content Backend Gate |
| Learning | `PASS`（已有完整设计包） | 依赖 Content Gate | 未开始 | 主要面向 Mobile，待 Backend | Content PASS 后执行 Learning Backend |
| Audio Production | `RECOVERY` | 未授权 | 未开始 | Runtime 只消费 official audio | 先完成 Design Recovery Gate |
| Social | 未开始 | 未开始 | 未开始 | 未开始 | 等正式排入流水线 |
| Chat | 未开始 | 未开始 | 未开始 | 未开始 | 等 Social 所需契约 |
| Commerce | 未开始 | 未开始 | 未开始 | 未开始 | 等 Chat 所需契约 |
| Rewards | 未开始 | 未开始 | 未开始 | 未开始 | 等 Commerce Event Contract |
| Trust & Safety | 未开始 | 未开始 | 未开始 | 未开始 | 等 Identity/Social/Chat/Commerce 所需契约 |

### 为什么 Operations Admin 单独列出来

Operations Backend 提供 Operator / Role / Permission / Audit 控制平面，但管理这些数据本身仍需要 Admin UI。Backend PASS 不代表 Operators、Roles、Role Assignments、Permission Matrix、Audit Logs 页面已经完成。

---

## 5. 三线并行流水线

项目默认不是“一个 Domain 全部做完才碰下一个”，而采用受 Gate 约束的错位并行：

```text
上一 Domain Admin Integration
            +
当前 Domain Backend Implementation
            +
下一 Domain Design
```

推荐节奏：

| 轮次 | Admin 轨 | Backend 轨 | Design 轨 |
| --- | --- | --- | --- |
| 当前 | Platform / Operations / Content Admin 按 Gate 收口 | Content / Learning 按实际 Gate 顺序 | Audio Recovery |
| 下一轮 | Content Admin | Learning Backend | Audio Production Design（Recovery PASS 后即已完成设计） |
| 后续 | Learning Admin | Audio Backend | Social Design |
| 后续 | Audio Admin | Social Backend | Chat Design |
| 后续 | Social Admin | Chat Backend | Commerce Design |
| 后续 | Chat Admin | Commerce Backend | Rewards Design |
| 后续 | Commerce Admin | Rewards Backend | Trust Design |
| 后续 | Rewards Admin | Trust Backend | Cross-Domain Integration Design/Execution |

> 同时并行不等于绕过依赖。某轨道 Entry Gate 不满足时，该轨道必须停在 `READY/BLOCKED`，其他独立轨道仍可继续。

---

## 6. Gate 与依赖控制矩阵

| 工作项 | 必须满足 | 允许提前做 | Gate 不满足时 |
| --- | --- | --- | --- |
| Domain Design | 上游 frozen contract 可读 | 可与前一 Domain Implementation 并行 | 记录 implementation dependency，不伪造 PASS |
| Domain Backend | 自己的 Design Gate + Master Plan 上游 Gate | 无 | `BLOCKED / NOT_STARTED` |
| Domain Admin | Admin Foundation + Domain Backend Gate + Operations RBAC Gate | 可做纯 UI/Contract Stage A（只有 Brief 明确允许时） | 不接 Fake production authorization |
| Mobile Integration | Mobile Foundation + 所需 Backend API Gate | 可做 REUSE/REFACTOR/REWRITE 评估 | 不伪造 API / 不直连 DB |
| Cross-Domain Integration | 相关 Domain Gate / Public Contract | 可先设计 contract | 不导入对方 infrastructure/repository |
| Production Readiness | Full-System Validation PASS | 无 | 不上线 |

---

## 7. 当前关键依赖图

```text
Foundation PASS
   ├─ Identity PASS/FROZEN
   ├─ Platform PASS/FROZEN
   │      └─ Platform Admin Stage B ← Operations PASS
   └─ Operations PASS/FROZEN
             ↓
          Content
             ↓
          Learning

Content PASS + Operations PASS
             ↓
      Audio Production

Identity PASS
   ↓
 Social → Chat → Commerce → Rewards
                 └──────────────┐
Identity + Social + Chat + Commerce
                 ↓              │
          Trust & Safety        │
                                │
11 Domain Gates ────────────────┘
             ↓
Cross-Domain Integration
             ↓
Complete Client Integration
             ↓
Full-System Validation
             ↓
Production Readiness
             ↓
Launch
```

---

## 8. Blocker / Recovery / Drift Register

这部分专门记录“不是普通开发任务，但会让流程失真”的事项。

| 类型 | 对象 | 当前情况 | 正确动作 |
| --- | --- | --- | --- |
| Recovery | Audio Design | 曾出现一次错误 Spec 污染；12 份错误设计产物已定位到单一 commit，Recovery Brief 已建立 | 执行 `07-audio/AUDIO_DESIGN_RECOVERY_BRIEF.md`，重新 Grounding Audit + Design Gate |
| Gate Blocker | Content Admin | Backend `CONTENT_GATE` 未在当前进度事实中关闭 | 先完成 Content Backend，不绕过 Gate |
| Pending Integration | Platform Admin | Stage A 已完成，Operations dependency 已解除 | 执行 Stage B real RBAC/audit/live E2E |
| Missing Track | Operations Admin | Backend 已冻结，但没有在总进度里作为独立 Admin 轨完整管理 | 建立独立 Admin Execution/Gate |
| Documentation Drift Risk | `DEVELOPMENT_PROGRESS.md` | 大表容易晚于实际 Implementation Report / Gate commit | 任何状态冲突优先以实际 Gate/Report 为准，再同步进度页 |
| Grounding Risk | AI Design/Execution | AI 可能把未出现在 Brief 的要求带入 canonical docs | BLOCKER/HIGH/DB_CONFLICT 必须二次 exact-source 验证 |

### Recovery 与普通 FAIL 的区别

如果 FAIL 是真实契约冲突：修设计/实现后重新 Gate。

如果 FAIL 建立在错误引用、错误路径或无来源需求上：必须先做 Recovery / Grounding，不允许用错误 FAIL 反向修改 frozen architecture。

---

## 9. Grounding Gate（所有 AI 会话强制）

任何准备写入最终审计的：

```text
BLOCKER
HIGH
DATABASE_CONTRACT_CONFLICT
DESIGN_CONTRACT_CONFLICT
UNRESOLVED_DECISION
```

必须有：

1. source file path；
2. exact heading / table / field；
3. 重新 fetch 当前 `main`；
4. exact-search finding 依赖的关键字符串；
5. 与 frozen migration / public contract 交叉验证；
6. evidence；
7. 才能计入 Gate severity。

如果声称“Brief requires X”，但当前 Brief 中 exact-search 不存在 X：

```text
finding = INVALID
不得进入 Gate 计数
```

---

## 10. Source-of-Truth 优先级

### 数据库 / Architecture

```text
Frozen Physical Migration
→ Frozen Domain DB Docs / Accepted ADR
→ Current Phase Design Brief
→ Upstream Frozen Public Contracts
→ Newly Generated Design Docs
```

### 开发完成状态

```text
Final Gate / Final Audit
→ Implementation Report
→ Current Code + Tests / CI Evidence
→ DEVELOPMENT_PROGRESS.md
→ Control Center summary
```

因此：进度页没有及时更新，不等于真实代码一定没完成；反过来，有代码 commit 也不等于 Gate 已 PASS。

---

## 11. 每个 Domain 必须具备的文档闭环

### Design package

```text
<DOMAIN>_PRODUCT_SEMANTICS.md
<DOMAIN>_USE_CASES.md
<DOMAIN>_API.md
<DOMAIN>_PUBLIC_CONTRACTS.md
<DOMAIN>_IMPLEMENTATION_PLAN.md
<DOMAIN>_DESIGN_AUDIT.md
```

复杂状态机可以增加：

```text
<DOMAIN>_WORKFLOWS.md
<DOMAIN>_CONTRACTS.md
```

### Execution package

```text
<DOMAIN>_EXECUTION_BRIEF.md
<DOMAIN>_IMPLEMENTATION_REPORT.md
```

### Admin package（需要管理后台的 Domain）

```text
<DOMAIN>_ADMIN_EXECUTION_BRIEF.md
<DOMAIN>_ADMIN_IMPLEMENTATION_REPORT.md
<DOMAIN>_ADMIN_GATE = PASS
```

### Recovery package（仅异常时）

```text
<DOMAIN>_*_RECOVERY_BRIEF.md
Recovery Audit / Report
重新执行原 Gate
```

Recovery 不是常规 Phase，不能代替正式 Design/Implementation Gate。

---

## 12. 状态字典

| 状态 | 含义 |
| --- | --- |
| `NOT_STARTED` | 尚未进入正式工作 |
| `PREPARED` | Brief/Plan 已准备，但 Entry Gate 未确认 |
| `READY` | Entry Gate 已满足，可正式执行 |
| `IN_PROGRESS` | 正在执行 |
| `VALIDATING` | 实现完成，正在测试/审计/Gate |
| `BLOCKED` | 有明确 Gate/Contract/Dependency 阻塞 |
| `RECOVERY` | 需要恢复被污染/错误的设计或执行事实 |
| `COMPLETE` | 任务完成但仍需结合 Gate 判断是否可作为依赖 |
| `FROZEN` | Gate PASS 后成为下游稳定契约 |

### Gate 字典

| Gate | 含义 |
| --- | --- |
| `—` | 尚未执行 |
| `PASS` | 所有 mandatory 条件满足，可进入依赖阶段 |
| `PASS_WITH_BLOCKERS` | 仅记录结果，不满足严格依赖准入 |
| `FAIL` | mandatory 条件不满足 |
| `INVALID / RECOVERY_REQUIRED` | Gate 本身建立在错误事实上，需要 Recovery 后重跑 |

---

## 13. “现在该做什么”决策规则

每次准备开新 AI 会话，按下面判断：

```text
1. 有没有 Recovery / Invalid Gate？
   有 → Recovery 优先，禁止继续向下实现

2. 当前 Backend Domain Design Gate 是否 PASS？
   否 → 做 Design
   是 → 检查上游 Implementation Gate

3. 上游 Gate 是否 PASS？
   否 → Backend BLOCKED，但下一 Domain Design 可按 Parallel Rule 判断是否继续
   是 → 执行 Backend

4. 上一 Domain Backend 是否 PASS？
   是 → 启动/继续上一 Domain Admin Integration

5. 当前 Backend 是否正在执行？
   是 → 可以同时准备下一 Domain Design

6. 三条轨都没有合法工作？
   → 检查文档漂移、遗漏 Admin Gate、Cross-Domain Contract 或 Master Plan 依赖
```

---

## 14. 完整阶段路线图

| 顺序 | Phase | 主要 Exit Gate | 客户端/后台收口 |
| ---: | --- | --- | --- |
| 0 | PostgreSQL Baseline | DB Baseline PASS | — |
| 1 | Application Foundation | Foundation PASS | Admin/Mobile Foundation 独立 PASS |
| 2 | Identity | `IDENTITY_GATE` | Client Integration 后续收口 |
| 3 | Platform | `PLATFORM_GATE` | `PLATFORM_ADMIN_GATE` |
| 4 | Operations | `OPERATIONS_GATE` | `OPERATIONS_ADMIN_GATE`（需独立管理） |
| 5 | Content | `CONTENT_GATE` | `CONTENT_ADMIN_GATE` + Mobile Content |
| 6 | Learning | `LEARNING_GATE` | Learning Admin（若需要）+ Mobile Learning |
| 7 | Audio Production | `AUDIO_GATE` | Audio Admin Workbench + runtime official audio |
| 8 | Social | `SOCIAL_GATE` | Social Admin + Mobile Social |
| 9 | Chat | `CHAT_GATE` | Chat Admin + Mobile Chat |
| 10 | Commerce | `COMMERCE_GATE` | Commerce Admin + Client Commerce |
| 11 | Rewards | `REWARDS_GATE` | Rewards Admin + Client Rewards |
| 12 | Trust & Safety | `TRUST_GATE` | Moderation/Admin Workbench |
| 13 | Cross-Domain Integration | Integration Gate | 全域事件/契约闭环 |
| 14 | Complete Client Integration | Client Gate | Admin/Mobile 全局导航、权限、关键旅程 |
| 15 | Full-System Validation | Validation PASS | E2E / security / performance / recovery |
| 16 | Production Readiness | Readiness PASS | Deploy / observability / runbook |
| 17 | Launch | Launch Gate | 正式上线 |

---

## 15. Phase 14 的正确含义

`Complete Client Integration` **不是**“到 Phase 14 才开始做 Admin/Mobile”。

各 Domain 客户端应在 Backend Gate 后增量接入；Phase 14 负责最终收口：

```text
全局导航一致性
权限一致性
跨 Domain 用户旅程
Admin Operator E2E
Mobile end-to-end journey
全局 loading/error/empty states
残留 placeholder / fake / temporary wiring 清理
统一回归
```

---

## 16. 进度维护规则

每个 Design/Execution/Admin/Recovery 会话完成后，必须检查是否需要更新：

- `DEVELOPMENT_PROGRESS.md`
- 本页“当前执行窗口”
- 本页“Domain 三轨矩阵”
- Blocker / Recovery / Drift Register
- 对应 Implementation/Design Report

但只有真实 Gate 变化才能把状态改为 `PASS/FROZEN`。

禁止：

```text
有 commit → 自动 COMPLETE
有代码 → 自动 PASS
有 Design docs → 自动 Implementation started
Admin 页面存在 → 自动 ADMIN_GATE PASS
进度表写 PASS → 忽略实际失败测试
```

---

## 17. 快速入口

- [开发进度记录表](DEVELOPMENT_PROGRESS.md) — 详细状态、证据、历史。
- [全量开发总计划](MASTER_DEVELOPMENT_PLAN.md) — Phase 顺序与全局冻结规则。
- [Platform Admin Execution Brief](03-platform/PLATFORM_ADMIN_EXECUTION_BRIEF.md)
- [Operations Execution Brief](04-operations/OPERATIONS_EXECUTION_BRIEF.md)
- [Content Execution Brief](05-content/CONTENT_EXECUTION_BRIEF.md)
- [Content Admin Execution Brief](05-content/CONTENT_ADMIN_EXECUTION_BRIEF.md)
- [Learning Execution Brief](06-learning/LEARNING_EXECUTION_BRIEF.md)
- [Audio Design Brief](07-audio/AUDIO_DESIGN_BRIEF.md)
- [Audio Design Recovery Brief](07-audio/AUDIO_DESIGN_RECOVERY_BRIEF.md)

---

## 18. 控制原则

> **设计可以错位并行，Implementation 必须守 Gate；Backend、Admin、Mobile 是三条独立但相关的完成轨；Recovery 优先于继续扩散；任何重大 finding 必须重新 Grounding 到当前 main 的真实 source。**
