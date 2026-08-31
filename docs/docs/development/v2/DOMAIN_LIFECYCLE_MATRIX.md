---
layout: page
sidebar: false
aside: false
outline: false
footer: false
pageClass: domain-lifecycle-matrix-page
status: control-matrix
last_updated: 2026-08-31
---

# ZH-LAO V2 Domain 全生命周期矩阵

本页把每个 Domain 从 **数据库契约 → Spec → Backend → Admin → Client → Integration → Validation → Release** 的状态放在同一张控制矩阵中。

它是流程控制视图，不直接创造 Gate 事实。发生冲突时按：**Final Gate / Final Audit → Implementation Report → Design Audit → 当前代码与测试 → DEVELOPMENT_PROGRESS → 本页摘要** 的顺序裁决。

**阅读方式：** 页面已关闭左侧 Sidebar 与右侧 Aside；矩阵本身横向滚动。第一列 Domain 尽量保持固定。

快速入口：[流程控制中心](DEVELOPMENT_CONTROL_CENTER.md) · [详细进度台账](DEVELOPMENT_PROGRESS.md) · [Master Plan](MASTER_DEVELOPMENT_PLAN.md)

状态：`PASS / COMPLETE` · `FROZEN` · `READY` · `BLOCKED` · `PENDING` · `RECOVERED` · `N/A`

## Domain 生命周期总矩阵

| Domain | DB Contract | Product Semantics | Use Cases / Workflows | HTTP API | Public Contract | Implementation Plan | Design Gate | Execution Brief | Backend Implementation | Backend Gate / Freeze | Admin Brief | Admin Implementation | Admin Gate | Client Contract / UX | Client Implementation | Client Gate | Cross-Domain Contracts | Events / Workers / Jobs | Security / Concurrency | Regression / CI | Production Readiness | Recovery / Drift | Dependencies / Blockers | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Identity | FROZEN | PASS | PASS | PASS | FROZEN | COMPLETE | PASS | 已执行 | COMPLETE | PASS / FROZEN | 未单列 | 未单列 | — | Auth / Session / Device 契约可消费 | Phase 14 收口 | Phase 14 | Identity public contract frozen | OTP / Provider / Session runtime | PASS | PASS | Phase 16 | 无 active recovery | 无当前阻塞 | 保持冻结；后续只做回归修复与 Client Integration |
| Platform | FROZEN | PASS | PASS | FROZEN | FROZEN | COMPLETE | PASS | 已执行 | COMPLETE | PASS / FROZEN | READY | Stage A COMPLETE；Stage B pending | PENDING | Runtime feature/app-version/announcement/region APIs | Phase 14 收口 | Phase 14 | Operations RBAC integration contract | Runtime control-plane logic | PASS | Backend PASS；Admin live E2E pending | Phase 16 | 无 active recovery | Stage B 尚未收口 | 完成 Platform Admin Stage B |
| Operations | FROZEN | PASS | PASS | FROZEN | FROZEN | COMPLETE | PASS | 已执行 | COMPLETE | PASS / FROZEN | MISSING TRACK | NOT STARTED | — | N/A（后台控制面） | N/A | N/A | RBAC / Audit owner | 无独立 queue | PASS | PASS | Phase 16 | 无 active recovery | Admin track 尚未建立 | 建立并执行 Operations Admin Brief |
| Content | FROZEN | PASS | PASS | PASS | PASS | COMPLETE | PASS | READY | NOT STARTED | — | PREPARED | BLOCKED / NOT STARTED | FAIL entry audit | Runtime curriculum / dictionary / practice contracts已设计 | NOT STARTED | — | Identity / Audio / Learning boundaries 已设计 | 仅真实消费者需要时 Outbox | Design coverage complete；runtime race 待实现 | NOT RUN | Phase 16 | 无 recovery；注意文档漂移 | CONTENT_GATE 未 PASS | 执行 Content Backend 并关闭 CONTENT_GATE |
| Learning | FROZEN | PASS | PASS | PASS | PASS | COMPLETE | PASS | READY WHEN DEPENDENCY PASSES | BLOCKED / NOT STARTED | — | NOT CREATED | NOT STARTED | — | Progress / mastery / review / practice / translation UX 已设计 | NOT STARTED | — | Content trusted scoring + Identity UUID | 真实消费者成立后再落事件 | Design invariants complete；implementation tests待执行 | NOT RUN | Phase 16 | 无 active recovery | 依赖 CONTENT_GATE | Content PASS 后执行 Learning Backend |
| Audio Production | FROZEN：9-table Slot/Task；0600 unchanged | PASS | PASS | PASS | PASS | COMPLETE | PASS（Recovered） | NOT CREATED | BLOCKED / NOT STARTED | — | NOT CREATED；Workbench requirements已设计 | NOT STARTED | — | Official-audio resolution / playback contract 已设计 | NOT STARTED | — | Content revision + Asset + Operations RBAC boundaries | TTS polling worker / retry / lease / batch 已设计 | Concurrency matrix 已设计；implementation validation待执行 | Design audit PASS；implementation CI未开始 | Phase 16 | RECOVERED；错误设计包已清理 | CONTENT_GATE 未 PASS；Operations PASS | 保持 Design PASS；Content Gate 后生成/执行 Audio Execution Brief |
| Social | FROZEN DB | 产品文档存在；V2 Phase Design 未启动 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED | — | NOT CREATED | NOT STARTED | — | NOT CREATED | NOT STARTED | — | NOT STARTED | NOT STARTED | — | Identity UUID / Trust report boundary 已冻结 | Application phase未设计 | Application phase未设计 | NOT RUN | Phase 16 | 无 active recovery | Identity PASS 已满足；尚未正式排期 | 进入流水线时先执行 Social Design |
| Chat | FROZEN DB | 产品文档存在；V2 Phase Design 未启动 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED | — | NOT CREATED | NOT STARTED | — | NOT CREATED | NOT STARTED | — | NOT STARTED | NOT STARTED | — | Identity + Social public contracts required | Application phase未设计 | Application phase未设计 | NOT RUN | Phase 16 | 无 active recovery | 依赖 Social 所需契约 / Gate | Social required contract 可用后进入 Chat Design |
| Commerce | FROZEN DB | 产品文档存在；V2 Phase Design 未启动 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED | — | NOT CREATED | NOT STARTED | — | NOT CREATED | NOT STARTED | — | NOT STARTED | NOT STARTED | — | Identity + Chat logical UUID / contract | Payment/outbox application flows未设计 | Application phase未设计 | NOT RUN | Phase 16 | 无 active recovery | 依赖 Chat 所需契约 | Chat required contract 可用后进入 Commerce Design |
| Rewards | FROZEN DB | 产品文档存在；V2 Phase Design 未启动 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED | — | NOT CREATED | NOT STARTED | — | NOT CREATED | NOT STARTED | — | NOT STARTED | NOT STARTED | — | Commerce event contract upstream | Reward consumer/delivery application未设计 | Application phase未设计 | NOT RUN | Phase 16 | 无 active recovery | 依赖 Commerce Event Contract | Commerce event contract PASS 后进入 Rewards Design |
| Trust & Safety | FROZEN DB；trust.reports canonical | 产品文档存在；V2 Phase Design 未启动 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED | — | NOT CREATED | NOT STARTED | — | NOT CREATED | NOT STARTED | — | NOT STARTED | NOT STARTED | — | Identity + Social + Chat + Commerce subject/report contracts | Moderation/enforcement application flows未设计 | Application phase未设计 | NOT RUN | Phase 16 | 无 active recovery | 依赖上游 subject contracts | 上游 subject contracts 稳定后进入 Trust Design |

## 矩阵之外仍需单独控制的全局阶段

| 全局阶段 | 准入条件 | 主要目标 |
| --- | --- | --- |
| Cross-Domain Integration | 相关 Domain Gate / Public Contract 达到准入 | 全域契约、事件、读模型与幂等闭环 |
| Complete Client Integration | Required APIs / Domain Gates 可用 | Admin/Mobile 导航、权限、跨域用户旅程最终收口 |
| Full-System Validation | Product Feature Complete | E2E、Security、Performance、Recovery、Migration、CI |
| Production Readiness | Full-System Validation PASS | Deploy、Observability、Runbook、Provider、Backup/Recovery |
| Launch | All mandatory Gates PASS | 正式上线 |

## 维护规则

1. **有代码 commit ≠ Backend Gate PASS。** 必须有 Final Gate / Report / 测试证据。
2. **Backend PASS ≠ Admin / Client COMPLETE。** 三条实现轨独立收口。
3. **Design Gate PASS 只授权进入 Backend Entry Audit。**
4. `BLOCKER / HIGH / DB_CONFLICT / DESIGN_CONFLICT` 必须先执行 Grounding Gate。
5. 本页只记录当前 `main` 能证实的状态；不确定保持 `— / NOT STARTED / 未单列`。
6. 状态变化时同步检查 `DEVELOPMENT_PROGRESS.md` 与 `DEVELOPMENT_CONTROL_CENTER.md`。
7. 表格必须保持为标准 Markdown table；不要再次改成包含空行的 raw HTML `<table>`，避免 VitePress 将 `<tr>/<td>` 解析成文本。

<style>
.domain-lifecycle-matrix-page .VPContent,
.domain-lifecycle-matrix-page .VPPage,
.domain-lifecycle-matrix-page main,
.domain-lifecycle-matrix-page .content-container {
  width: 100% !important;
  max-width: none !important;
}
.domain-lifecycle-matrix-page .VPContent,
.domain-lifecycle-matrix-page main {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.domain-lifecycle-matrix-page h1,
.domain-lifecycle-matrix-page h2,
.domain-lifecycle-matrix-page > p {
  margin-left: 20px;
  margin-right: 20px;
}
.domain-lifecycle-matrix-page table {
  display: block !important;
  width: calc(100vw - 16px) !important;
  max-width: none !important;
  margin: 16px 8px 28px !important;
  overflow-x: auto !important;
  white-space: normal;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  line-height: 1.4;
}
.domain-lifecycle-matrix-page table th,
.domain-lifecycle-matrix-page table td {
  min-width: 145px;
  max-width: 220px;
  padding: 9px 10px;
  vertical-align: top;
}
.domain-lifecycle-matrix-page table th:first-child,
.domain-lifecycle-matrix-page table td:first-child {
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: 135px;
  max-width: 135px;
  font-weight: 700;
  background: var(--vp-c-bg-soft);
}
.domain-lifecycle-matrix-page table thead th {
  font-weight: 700;
  background: var(--vp-c-bg-soft);
}
@media (max-width: 768px) {
  .domain-lifecycle-matrix-page h1,
  .domain-lifecycle-matrix-page h2,
  .domain-lifecycle-matrix-page > p {
    margin-left: 12px;
    margin-right: 12px;
  }
  .domain-lifecycle-matrix-page table {
    width: calc(100vw - 8px) !important;
    margin-left: 4px !important;
    margin-right: 4px !important;
  }
}
</style>
