---
status: control-center
last_updated: 2026-08-31
---

# ZH-LAO V2 开发流程控制中心

> 本页负责 **V2 开发执行与流程控制**：当前应该做什么、哪些工作可以并行、哪些 Gate 未关闭、哪些轨道落后、是否存在 Recovery / Drift。
>
> Domain 的完整生命周期状态已拆到独立全宽页面：[Domain 全生命周期矩阵](DOMAIN_LIFECYCLE_MATRIX.md)。
>
> **状态事实来源优先级**：Final Gate / Final Audit → Implementation Report → Design Audit / Design Gate → 当前代码与测试 → `DEVELOPMENT_PROGRESS.md` → 本页摘要。

## 1. 四个控制入口怎么用

日常按顺序查看：

1. **当前执行窗口**：现在可以做什么、禁止做什么。
2. **[Domain 全生命周期矩阵](DOMAIN_LIFECYCLE_MATRIX.md)**：DB、Spec、Backend、Admin、Client、Integration、Validation、Release 是否同步。
3. **Gate / 依赖矩阵**：下一步为什么能开始或为什么被阻塞。
4. **[开发进度记录表](DEVELOPMENT_PROGRESS.md)**：详细测试证据、报告和更新历史。

全局冻结规则见 [全量开发总计划](MASTER_DEVELOPMENT_PLAN.md)。

---

## 2. 当前执行窗口

基于当前 `main` 可验证文档：

| 工作流 | 当前状态 | 可以做什么 | 不允许做什么 |
| --- | --- | --- | --- |
| Platform Admin | `READY / Stage B pending` | 完成真实 Operator / RBAC / Audit / Live E2E | 不重做 Platform Backend |
| Operations Backend | `COMPLETE / PASS / FROZEN` | 作为所有后台授权与审计基础 | 不改变 frozen RBAC 语义 |
| Operations Admin | `MISSING TRACK` | 建立独立 Admin Brief / Gate | 不把 Backend PASS 当成 Admin 已完成 |
| Content Backend | `Design PASS / ENTRY READY` | 执行 `CONTENT_EXECUTION_BRIEF.md` 并关闭 `CONTENT_GATE` | Content Admin 不得绕过 Content Gate |
| Content Admin | `BLOCKED` | 保留已完成的 Entry Audit / Brief | `CONTENT_GATE` 未 PASS 前不做正式业务实现 |
| Learning Backend | `Design PASS / BLOCKED` | 等待真实 `CONTENT_GATE` | 不把 Learning 用户事实写回 Content |
| Audio Production | `Design Recovery COMPLETE / Design Gate PASS` | 保持 recovered canonical design；准备后续 Backend Entry | `CONTENT_GATE` 未 PASS 前不开始 Audio Implementation；不得改 frozen `0600_audio.sql` |
| Social Design | `NOT STARTED` | 作为后续 Design 轨候选 | 不自动越过当前正式调度进入实现 |

> 本表只是控制摘要。任何执行会话都必须先读取对应 Brief，并重新审计执行时最新 `main`。

---

## 3. 标准 Spec-Driven Domain 生命周期

```text
Frozen DB / Architecture Contract
        ↓
Repository Audit
        ↓
Product Semantics
        ↓
Use Cases / Workflows
        ↓
HTTP API + Public Contract
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
DOMAIN_GATE = PASS
        ↓
DOMAIN = FROZEN
        ↓
Admin Integration     Mobile / Client Integration
        ↓                       ↓
ADMIN_GATE             CLIENT_GATE / evidence
        └──────────┬────────────┘
                   ↓
Cross-Domain Integration
                   ↓
Full-System Validation
                   ↓
Production Readiness
                   ↓
Launch
```

### Gate 不能互相替代

- `*_DESIGN_GATE = PASS`：设计闭环，不表示代码完成。
- `*_GATE = PASS`：Backend Domain Implementation 完成并可冻结。
- `*_ADMIN_GATE = PASS`：管理后台按真实 API / RBAC / Audit / E2E 完成。
- Client/Mobile 需要独立实现和验收证据，Backend PASS 不自动代表客户端完成。

---

## 4. Domain 全生命周期矩阵

原来的“Domain 三轨控制矩阵”已拆成独立页面，并从 4 条粗粒度列扩展为完整生命周期控制矩阵。

**[打开全宽 Domain 生命周期矩阵 →](DOMAIN_LIFECYCLE_MATRIX.md)**

独立页面当前覆盖：

```text
DB Contract
Product Semantics
Use Cases / Workflows
HTTP API
Public Contract
Implementation Plan
Design Gate
Execution Brief
Backend Implementation
Backend Gate / Freeze
Admin Brief
Admin Implementation
Admin Gate
Client Contract / UX
Client Implementation
Client Gate
Cross-Domain Contracts
Events / Workers / Jobs
Security / Concurrency
Regression / CI
Production Readiness
Recovery / Drift
Dependencies / Blockers
Next Action
```

该页面使用全宽 VitePress Page Layout，关闭普通左侧 Sidebar 和右侧 Aside，允许超宽矩阵横向浏览。

---

## 5. 三线并行流水线

项目默认采用受 Gate 约束的错位并行：

```text
上一 Domain Admin Integration
            +
当前 Domain Backend Implementation
            +
下一 Domain Design
```

当前可理解为：

| 轨道 | 当前重点 | 说明 |
| --- | --- | --- |
| Admin 轨 | Platform Stage B；补 Operations Admin；Content Admin 等待 Gate | Admin Gate 独立于 Backend Gate |
| Backend 轨 | Content Backend | 这是 Learning / Audio Implementation 的关键前置 |
| Design 轨 | Audio Design 已 Recovery PASS；Social 为后续候选 | 不因 Design 提前完成就自动开始 Implementation |

后续正常节奏仍是：

```text
Content Admin + Learning Backend + Audio 已完成 Design
Learning Admin + Audio Backend + Social Design
Audio Admin + Social Backend + Chat Design
Social Admin + Chat Backend + Commerce Design
Chat Admin + Commerce Backend + Rewards Design
Commerce Admin + Rewards Backend + Trust Design
Rewards Admin + Trust Backend + Cross-Domain Integration
```

> “并行”只表示不同轨道可同时推进，不表示允许绕过任何 Entry Gate。

---

## 6. Gate 与依赖控制矩阵

| 工作项 | 必须满足 | 允许提前做 | Gate 不满足时 |
| --- | --- | --- | --- |
| Domain Design | 上游 frozen contract 可读 | 可与前一 Domain Implementation 并行 | 记录 implementation dependency，不伪造 PASS |
| Domain Backend | 自己的 Design Gate + Master Plan 上游 Gate | 无 | `BLOCKED / NOT_STARTED` |
| Domain Admin | Admin Foundation + Domain Backend Gate + Operations RBAC Gate | Brief 明确允许时可先做 Stage A UI/Contract | 不接 Fake production authorization |
| Mobile / Client Integration | Mobile Foundation + 所需 Backend API Gate | 可提前做 REUSE/REFACTOR/REWRITE 评估 | 不伪造 API，不直连 DB |
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

| 类型 | 对象 | 当前情况 | 正确动作 |
| --- | --- | --- | --- |
| Recovered | Audio Design | `ab1d4ebe...` 污染设计包已清理；7 份 canonical docs 重建；`AUDIO_DESIGN_GATE = PASS` | 保持 recovered source-of-truth；Implementation 继续遵守 Content Gate |
| Gate Blocker | Content Admin | `CONTENT_GATE` 尚未关闭 | 先完成 Content Backend |
| Gate Blocker | Learning Backend | 依赖 `CONTENT_GATE` | Content PASS 后执行 Learning Execution Brief |
| Gate Blocker | Audio Backend | Design Gate 已 PASS，但依赖 `CONTENT_GATE` | Content PASS 后建立/执行 Audio Execution Brief |
| Pending Integration | Platform Admin | Stage A 已完成，Operations dependency 已解除 | 执行 Stage B real RBAC/audit/live E2E |
| Missing Track | Operations Admin | Backend 已冻结，但独立 Admin track 未建立 | 创建 Operations Admin Execution Brief / Report / Gate |
| Documentation Drift Risk | Progress / Control docs | 大表和摘要可能晚于实际 Gate commit | 以 Final Gate/Report 为准，再同步控制文档 |
| Grounding Risk | AI Design/Execution | AI 可能带入未出现在当前 Brief 的要求 | BLOCKER/HIGH/DB_CONFLICT 必须二次 exact-source 验证 |

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

如果声称“Brief requires X”，但当前 Brief exact-search 不存在 X：

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
→ DEVELOPMENT_CONTROL_CENTER.md
→ DOMAIN_LIFECYCLE_MATRIX.md
```

有代码 commit 不等于 Gate PASS；进度页没及时更新也不等于真实 Implementation 一定未完成。

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

复杂状态机可增加：

```text
<DOMAIN>_WORKFLOWS.md
<DOMAIN>_CONTRACTS.md
```

### Execution package

```text
<DOMAIN>_EXECUTION_BRIEF.md
<DOMAIN>_IMPLEMENTATION_REPORT.md
```

### Admin package

```text
<DOMAIN>_ADMIN_EXECUTION_BRIEF.md
<DOMAIN>_ADMIN_IMPLEMENTATION_REPORT.md
<DOMAIN>_ADMIN_GATE = PASS
```

### Recovery package（异常时）

```text
<DOMAIN>_*_RECOVERY_BRIEF.md
Recovery Audit / evidence
重新执行原 Gate
```

---

## 12. 状态 / Gate 字典

| 状态 | 含义 |
| --- | --- |
| `NOT_STARTED` | 尚未进入正式工作 |
| `PREPARED` | Brief/Plan 已准备，但 Entry Gate 未确认 |
| `READY` | Entry Gate 已满足，可执行 |
| `IN_PROGRESS` | 正在执行 |
| `VALIDATING` | 正在测试 / 审计 / Gate |
| `BLOCKED` | 有明确依赖或 Gate 阻塞 |
| `RECOVERY` | 需要恢复被污染或错误的设计/执行事实 |
| `COMPLETE` | 任务完成，仍需结合 Gate 判断依赖资格 |
| `FROZEN` | Gate PASS 后成为下游稳定契约 |

| Gate | 含义 |
| --- | --- |
| `—` | 尚未执行 |
| `PASS` | mandatory 条件满足，可作为依赖 |
| `PASS_WITH_BLOCKERS` | 记录结果，但不满足严格依赖准入 |
| `FAIL` | mandatory 条件不满足 |
| `INVALID / RECOVERY_REQUIRED` | Gate 建立在错误事实，需要 Recovery 后重跑 |

---

## 13. “现在该做什么”决策规则

```text
1. 有没有 Invalid Gate / active Recovery？
   有 → Recovery 优先，禁止继续扩散

2. 当前 Backend Domain 的 Design Gate 是否 PASS？
   否 → 做 Design
   是 → 检查上游 Backend Gate

3. 上游 Gate 是否 PASS？
   否 → Backend BLOCKED；独立 Design/Admin 轨按各自 Gate继续判断
   是 → 执行 Backend

4. 上一 Domain Backend 是否 PASS？
   是 → 启动/继续对应 Admin Integration

5. 当前 Backend 正在执行？
   是 → 可以准备下一 Domain Design

6. 三条轨都没有合法工作？
   → 检查遗漏 Admin Gate、Client Gate、文档漂移、Cross-Domain Contract 或 Master Plan 依赖
```

---

## 14. 完整阶段路线图

| 顺序 | Phase | 主要 Exit Gate | 客户端/后台收口 |
| ---: | --- | --- | --- |
| 0 | PostgreSQL Baseline | DB Baseline PASS | — |
| 1 | Application Foundation | Foundation PASS | Admin/Mobile Foundation 独立 PASS |
| 2 | Identity | `IDENTITY_GATE` | Client Integration 后续收口 |
| 3 | Platform | `PLATFORM_GATE` | `PLATFORM_ADMIN_GATE` |
| 4 | Operations | `OPERATIONS_GATE` | `OPERATIONS_ADMIN_GATE` |
| 5 | Content | `CONTENT_GATE` | `CONTENT_ADMIN_GATE` + Client Content |
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

各 Domain 客户端应在 Backend Gate 后增量接入；Phase 14 只负责最终全局收口：

```text
全局导航一致性
权限一致性
跨 Domain 用户旅程
Admin Operator E2E
Mobile end-to-end journeys
全局 loading / error / empty states
placeholder / fake / temporary wiring 清理
统一回归
```

---

## 16. 进度维护规则

每个 Design / Execution / Admin / Recovery 会话完成后，必须检查：

- `DEVELOPMENT_PROGRESS.md`
- 本页“当前执行窗口”
- [Domain 全生命周期矩阵](DOMAIN_LIFECYCLE_MATRIX.md)
- Blocker / Recovery / Drift Register
- 对应 Design / Implementation / Admin Report

只有真实 Gate 变化才能把状态改为 `PASS / FROZEN`。

禁止：

```text
有 commit → 自动 COMPLETE
有代码 → 自动 PASS
有 Design docs → 自动 Implementation started
Admin 页面存在 → 自动 ADMIN_GATE PASS
Progress 写 PASS → 忽略实际失败测试
```

---

## 17. 快速入口

- [Domain 全生命周期矩阵](DOMAIN_LIFECYCLE_MATRIX.md) — 全宽完整状态控制。
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

> **设计可以错位并行，Implementation 必须守 Gate；Backend、Admin、Client 是独立但相关的完成轨；Recovery 优先于继续扩散；任何重大 finding 必须重新 Grounding 到当前 main 的真实 source。**
