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

<div class="matrix-toolbar">
  <div><strong>阅读方式：</strong>横向滚动查看完整生命周期；第一列 Domain 与表头保持固定。</div>
  <div class="matrix-links"><a href="/development/v2/DEVELOPMENT_CONTROL_CENTER">流程控制中心</a><a href="/development/v2/DEVELOPMENT_PROGRESS">详细进度台账</a><a href="/development/v2/MASTER_DEVELOPMENT_PLAN">Master Plan</a></div>
</div>

<div class="matrix-legend">
  <span class="s pass">PASS / COMPLETE</span>
  <span class="s frozen">FROZEN</span>
  <span class="s ready">READY</span>
  <span class="s blocked">BLOCKED</span>
  <span class="s pending">PENDING</span>
  <span class="s recovery">RECOVERED</span>
  <span class="s na">N/A / 未单列</span>
</div>

<div class="matrix-scroll">
<table class="lifecycle-matrix">
  <thead>
    <tr class="group-row">
      <th rowspan="2">Domain</th>
      <th rowspan="2">DB Contract</th>
      <th colspan="6">Spec / Design</th>
      <th colspan="3">Backend</th>
      <th colspan="3">Admin</th>
      <th colspan="3">Mobile / Client</th>
      <th colspan="4">Integration / Validation</th>
      <th rowspan="2">Production Readiness</th>
      <th colspan="3">Flow Control</th>
    </tr>
    <tr>
      <th>Product Semantics</th>
      <th>Use Cases / Workflows</th>
      <th>HTTP API</th>
      <th>Public Contract</th>
      <th>Implementation Plan</th>
      <th>Design Gate</th>
      <th>Execution Brief</th>
      <th>Implementation</th>
      <th>Backend Gate / Freeze</th>
      <th>Admin Brief</th>
      <th>Admin Implementation</th>
      <th>Admin Gate</th>
      <th>Client Contract / UX</th>
      <th>Client Implementation</th>
      <th>Client Gate</th>
      <th>Cross-Domain Contracts</th>
      <th>Events / Workers / Jobs</th>
      <th>Security / Concurrency</th>
      <th>Regression / CI</th>
      <th>Recovery / Drift</th>
      <th>Dependencies / Blockers</th>
      <th>Next Action</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>Identity</th>
      <td><span class="s frozen">FROZEN</span><br>Identity schema + runtime forward migrations</td>
      <td><span class="s pass">PASS</span></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/02-identity/IDENTITY_USE_CASES">Use Cases</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/02-identity/IDENTITY_API">API</a></td>
      <td><span class="s frozen">FROZEN</span><br>IdentityPublicQueries</td>
      <td><span class="s pass">COMPLETE</span><br><a href="/development/v2/02-identity/IDENTITY_IMPLEMENTATION_PLAN">Plan</a></td>
      <td><span class="s pass">PASS</span></td>
      <td><span class="s na">历史执行已完成</span></td>
      <td><span class="s pass">COMPLETE</span></td>
      <td><span class="s frozen">PASS / FROZEN</span><br><a href="/development/v2/02-identity/IDENTITY_IMPLEMENTATION_REPORT">Report</a></td>
      <td><span class="s na">未单列</span><br>控制面复用 Operations</td>
      <td><span class="s pending">未作为独立 Identity Admin Phase</span></td>
      <td><span class="s pending">—</span></td>
      <td>Auth / Session / Device 契约已可被客户端消费</td>
      <td><span class="s pending">Foundation wiring 已有；完整旅程待 Phase 14</span></td>
      <td><span class="s pending">Phase 14</span></td>
      <td><span class="s frozen">Public contract frozen</span></td>
      <td>OTP / Provider / Session runtime 已实现</td>
      <td><span class="s pass">PASS</span><br>Race / Provider / stale-read regression</td>
      <td><span class="s pass">PASS</span></td>
      <td><span class="s na">无 active recovery</span></td>
      <td>无当前阻塞</td>
      <td>保持冻结；只接受回归修复和后续 Client Integration</td>
    </tr>

    <tr>
      <th>Platform</th>
      <td><span class="s frozen">FROZEN</span><br>6 tables + legal forward index migration</td>
      <td><span class="s pass">PASS</span></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/03-platform/PLATFORM_USE_CASES">Use Cases</a></td>
      <td><span class="s frozen">FROZEN</span><br><a href="/development/v2/03-platform/PLATFORM_API">API</a></td>
      <td><span class="s frozen">FROZEN</span><br>Feature / Config / Region readers</td>
      <td><span class="s pass">COMPLETE</span></td>
      <td><span class="s pass">PASS</span></td>
      <td><span class="s pass">EXECUTED</span></td>
      <td><span class="s pass">COMPLETE</span></td>
      <td><span class="s frozen">PASS / FROZEN</span><br><a href="/development/v2/03-platform/PLATFORM_IMPLEMENTATION_REPORT">Report</a></td>
      <td><span class="s ready">READY</span><br><a href="/development/v2/03-platform/PLATFORM_ADMIN_EXECUTION_BRIEF">Admin Brief</a></td>
      <td><span class="s ready">Stage A COMPLETE</span><br>Stage B pending</td>
      <td><span class="s pending">WAITING Stage B</span></td>
      <td>Runtime feature/app-version/announcement/region APIs</td>
      <td><span class="s pending">最终 Client Integration 待 Phase 14</span></td>
      <td><span class="s pending">Phase 14</span></td>
      <td><span class="s frozen">Operations RBAC integration contract</span></td>
      <td>Runtime control-plane logic；无额外消息系统</td>
      <td><span class="s pass">PASS</span><br>race / stale write semantics</td>
      <td><span class="s pass">Backend PASS</span><br>Admin live E2E pending</td>
      <td><span class="s na">无 active recovery</span></td>
      <td>Operations Gate 已解除；Stage B 尚未收口</td>
      <td>完成 Platform Admin Stage B：real operator/RBAC/audit/live E2E</td>
    </tr>

    <tr>
      <th>Operations</th>
      <td><span class="s frozen">FROZEN</span><br>5 tables</td>
      <td><span class="s pass">PASS</span></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/04-operations/OPERATIONS_USE_CASES">Use Cases</a></td>
      <td><span class="s frozen">FROZEN</span><br><a href="/development/v2/04-operations/OPERATIONS_API">API</a></td>
      <td><span class="s frozen">FROZEN</span><br>authorization / operator public boundary</td>
      <td><span class="s pass">COMPLETE</span></td>
      <td><span class="s pass">PASS</span></td>
      <td><span class="s pass">EXECUTED</span><br><a href="/development/v2/04-operations/OPERATIONS_EXECUTION_BRIEF">Brief</a></td>
      <td><span class="s pass">COMPLETE</span></td>
      <td><span class="s frozen">PASS / FROZEN</span><br><a href="/development/v2/04-operations/OPERATIONS_IMPLEMENTATION_REPORT">Report</a></td>
      <td><span class="s pending">MISSING TRACK</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s na">N/A</span><br>Operations 为后台控制面</td>
      <td><span class="s na">N/A</span></td>
      <td><span class="s na">N/A</span></td>
      <td><span class="s frozen">RBAC / Audit contract owner</span></td>
      <td>无独立 queue；审计与权限在应用事务语义内</td>
      <td><span class="s pass">PASS</span><br>authorization snapshot / bootstrap races</td>
      <td><span class="s pass">PASS</span></td>
      <td><span class="s na">无 active recovery</span></td>
      <td>Backend 无阻塞；Admin track 尚未建立</td>
      <td>建立并执行 Operations Admin Brief：Operators / Roles / Assignments / Audit Logs</td>
    </tr>

    <tr>
      <th>Content</th>
      <td><span class="s frozen">FROZEN</span><br>31 core tables + content revision forward contract</td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/05-content/CONTENT_PRODUCT_SEMANTICS">Semantics</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/05-content/CONTENT_USE_CASES">Use Cases</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/05-content/CONTENT_API">API</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/05-content/CONTENT_PUBLIC_CONTRACTS">Public</a></td>
      <td><span class="s pass">COMPLETE</span><br><a href="/development/v2/05-content/CONTENT_IMPLEMENTATION_PLAN">Plan</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/05-content/CONTENT_DESIGN_AUDIT">Audit</a></td>
      <td><span class="s ready">READY</span><br><a href="/development/v2/05-content/CONTENT_EXECUTION_BRIEF">Execution Brief</a></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s ready">PREPARED</span><br><a href="/development/v2/05-content/CONTENT_ADMIN_EXECUTION_BRIEF">Admin Brief</a></td>
      <td><span class="s blocked">BLOCKED / NOT STARTED</span></td>
      <td><span class="s blocked">FAIL entry audit</span></td>
      <td>Runtime curriculum / dictionary / practice contracts已设计</td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td>Identity / Audio / Learning boundaries 已设计；实现待 Backend</td>
      <td>Outbox only for proven consumers；无独立 queue requirement</td>
      <td><span class="s pending">Design coverage complete；runtime race tests待实现</span></td>
      <td><span class="s pending">NOT RUN for implementation</span></td>
      <td><span class="s na">无 recovery；注意 Progress/Report drift</span></td>
      <td><strong>CONTENT_GATE 未 PASS</strong></td>
      <td>执行 Content Backend，完成 integration/security/race/regression 后关闭 CONTENT_GATE</td>
    </tr>

    <tr>
      <th>Learning</th>
      <td><span class="s frozen">FROZEN</span><br>10 user-learning fact tables</td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/06-learning/LEARNING_PRODUCT_SEMANTICS">Semantics</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/06-learning/LEARNING_USE_CASES">Use Cases</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/06-learning/LEARNING_API">API</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/06-learning/LEARNING_PUBLIC_CONTRACTS">Public</a></td>
      <td><span class="s pass">COMPLETE</span><br><a href="/development/v2/06-learning/LEARNING_IMPLEMENTATION_PLAN">Plan</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/06-learning/LEARNING_DESIGN_AUDIT">Audit</a></td>
      <td><span class="s ready">READY WHEN DEPENDENCY PASSES</span><br><a href="/development/v2/06-learning/LEARNING_EXECUTION_BRIEF">Execution Brief</a></td>
      <td><span class="s blocked">BLOCKED / NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT CREATED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td>Progress / mastery / review / practice / translation UX contracts 已设计</td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td>Content trusted scoring/resolution + Identity logical UUID</td>
      <td>未来 Rewards/event 只在真实消费者成立时落地</td>
      <td><span class="s pending">Design invariants complete；implementation tests待执行</span></td>
      <td><span class="s pending">NOT RUN for implementation</span></td>
      <td><span class="s na">无 active recovery</span></td>
      <td><strong>依赖 CONTENT_GATE</strong></td>
      <td>Content PASS 后执行 Learning Backend；随后再建立 Learning Admin/Client integration track</td>
    </tr>

    <tr>
      <th>Audio Production</th>
      <td><span class="s frozen">FROZEN</span><br>9-table Slot / Task model; 0600 unchanged</td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/07-audio/AUDIO_PRODUCT_SEMANTICS">Semantics</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/07-audio/AUDIO_USE_CASES">Use Cases</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/07-audio/AUDIO_API">API</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/07-audio/AUDIO_PUBLIC_CONTRACTS">Public</a></td>
      <td><span class="s pass">COMPLETE</span><br><a href="/development/v2/07-audio/AUDIO_IMPLEMENTATION_PLAN">Plan</a></td>
      <td><span class="s pass">PASS</span><br><a href="/development/v2/07-audio/AUDIO_DESIGN_AUDIT">Recovered Audit</a></td>
      <td><span class="s pending">NOT CREATED</span></td>
      <td><span class="s blocked">BLOCKED / NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT CREATED</span><br>Workbench requirements已设计</td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td>Official-audio resolution / playback contract 已设计</td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td>Content revision + Asset Infrastructure + Operations RBAC boundaries 已冻结</td>
      <td>TTS polling worker / retry / lease / batch orchestration 已设计</td>
      <td><span class="s pending">Concurrency matrix 已设计；implementation validation待执行</span></td>
      <td><span class="s pending">Design audit PASS；implementation CI未开始</span></td>
      <td><span class="s recovery">RECOVERED</span><br>12 contaminated docs removed; Grounding Gate PASS</td>
      <td><strong>CONTENT_GATE 未 PASS</strong><br>Operations 已 PASS</td>
      <td>保持 Design PASS；等待 Content Gate，再生成/执行 Audio Execution Brief</td>
    </tr>

    <tr>
      <th>Social</th>
      <td><span class="s frozen">FROZEN DB</span></td>
      <td>Domain 产品文档存在；<span class="s pending">V2 Phase design未启动</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT CREATED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT CREATED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td>Identity logical UUID / Trust report boundary 已由 frozen architecture约束</td>
      <td><span class="s pending">Application phase未设计</span></td>
      <td><span class="s pending">Application phase未设计</span></td>
      <td><span class="s pending">NOT RUN</span></td>
      <td><span class="s na">无 active recovery</span></td>
      <td>Master dependency：Identity PASS（已满足）；正式排期未进入</td>
      <td>进入流水线时先创建并执行 Social Design Brief</td>
    </tr>

    <tr>
      <th>Chat</th>
      <td><span class="s frozen">FROZEN DB</span></td>
      <td>Domain 产品文档存在；<span class="s pending">V2 Phase design未启动</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT CREATED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT CREATED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td>Identity + Social logical/public contracts required</td>
      <td><span class="s pending">Application phase未设计</span></td>
      <td><span class="s pending">Application phase未设计</span></td>
      <td><span class="s pending">NOT RUN</span></td>
      <td><span class="s na">无 active recovery</span></td>
      <td>依赖 Social 所需契约 / Gate</td>
      <td>Social required contract可用后进入 Chat Design</td>
    </tr>

    <tr>
      <th>Commerce</th>
      <td><span class="s frozen">FROZEN DB</span></td>
      <td>Domain 产品文档存在；<span class="s pending">V2 Phase design未启动</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT CREATED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT CREATED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td>Identity + Chat logical UUID / contract dependency</td>
      <td><span class="s pending">Payment/outbox application flows未进入实施设计</span></td>
      <td><span class="s pending">Application phase未设计</span></td>
      <td><span class="s pending">NOT RUN</span></td>
      <td><span class="s na">无 active recovery</span></td>
      <td>依赖 Chat 所需契约</td>
      <td>Chat required contract可用后进入 Commerce Design</td>
    </tr>

    <tr>
      <th>Rewards</th>
      <td><span class="s frozen">FROZEN DB</span></td>
      <td>Domain 产品文档存在；<span class="s pending">V2 Phase design未启动</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT CREATED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT CREATED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td>Commerce event contract is primary upstream dependency</td>
      <td><span class="s pending">Reward event consumer/delivery application未设计</span></td>
      <td><span class="s pending">Application phase未设计</span></td>
      <td><span class="s pending">NOT RUN</span></td>
      <td><span class="s na">无 active recovery</span></td>
      <td>依赖 Commerce Event Contract</td>
      <td>Commerce event contract PASS 后进入 Rewards Design</td>
    </tr>

    <tr>
      <th>Trust &amp; Safety</th>
      <td><span class="s frozen">FROZEN DB</span><br>trust.reports is canonical report fact</td>
      <td>Domain 产品文档存在；<span class="s pending">V2 Phase design未启动</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT CREATED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT CREATED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">NOT STARTED</span></td>
      <td><span class="s pending">—</span></td>
      <td>Identity + Social + Chat + Commerce subject/report contracts</td>
      <td><span class="s pending">Moderation/enforcement application flows未进入实施设计</span></td>
      <td><span class="s pending">Application phase未设计</span></td>
      <td><span class="s pending">NOT RUN</span></td>
      <td><span class="s na">无 active recovery</span></td>
      <td>依赖 Identity + Social + Chat + Commerce 所需契约</td>
      <td>上游 subject contracts 稳定后进入 Trust Design</td>
    </tr>
  </tbody>
</table>
</div>

## 矩阵之外仍需单独控制的全局阶段

<div class="global-stage-grid">
  <div><strong>Cross-Domain Integration</strong><span>11 Domain Gate / Public Contract 达到准入后执行全域契约、事件与读模型闭环。</span></div>
  <div><strong>Complete Client Integration</strong><span>不是首次开发客户端，而是 Admin/Mobile 导航、权限和跨域旅程的最终收口。</span></div>
  <div><strong>Full-System Validation</strong><span>E2E、security、performance、recovery、migration、CI 的系统级验证。</span></div>
  <div><strong>Production Readiness</strong><span>部署、可观测性、runbook、provider、backup/recovery、上线前 Gate。</span></div>
</div>

## 维护规则

1. **不要因为有代码 commit 就把 Backend Gate 改成 PASS。** 必须有 Final Gate / Report / 测试证据。
2. **不要因为 Backend PASS 就把 Admin 或 Client 改成 COMPLETE。** 三条轨独立收口。
3. **Design Gate PASS 只授权进入 Backend Entry Audit，不等于 Implementation 已开始。**
4. `BLOCKER / HIGH / DB_CONFLICT / DESIGN_CONFLICT` 必须执行 Grounding Gate 后才能进入本矩阵。
5. 本页只记录可从当前 `main` 证实的状态；不确定的状态保持 `— / NOT STARTED / 未单列`。
6. 状态变化时，同时检查 `DEVELOPMENT_PROGRESS.md` 和 `DEVELOPMENT_CONTROL_CENTER.md` 是否发生文档漂移。

<style>
.domain-lifecycle-matrix-page .VPContent { padding: 0 !important; }
.domain-lifecycle-matrix-page .VPPage { width: 100%; max-width: none !important; }
.domain-lifecycle-matrix-page main { width: 100%; max-width: none !important; padding: 0 !important; }
.domain-lifecycle-matrix-page .content-container { max-width: none !important; }
.domain-lifecycle-matrix-page { overflow-x: hidden; }
.domain-lifecycle-matrix-page h1,
.domain-lifecycle-matrix-page h2,
.domain-lifecycle-matrix-page > p,
.domain-lifecycle-matrix-page > ol,
.domain-lifecycle-matrix-page > ul {
  margin-left: 24px;
  margin-right: 24px;
}
.domain-lifecycle-matrix-page h1 { margin-top: 30px; margin-bottom: 8px; font-size: 30px; line-height: 1.25; }
.domain-lifecycle-matrix-page h2 { margin-top: 28px; margin-bottom: 12px; font-size: 21px; }
.domain-lifecycle-matrix-page p,
.domain-lifecycle-matrix-page li { line-height: 1.7; }
.domain-lifecycle-matrix-page a { color: var(--vp-c-brand-1); text-decoration: none; }
.domain-lifecycle-matrix-page a:hover { text-decoration: underline; }
.matrix-toolbar {
  margin: 18px 24px 10px;
  padding: 14px 16px;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}
.matrix-links { display: flex; gap: 14px; flex-wrap: wrap; }
.matrix-legend { margin: 10px 24px 14px; display: flex; gap: 8px; flex-wrap: wrap; }
.matrix-scroll {
  width: calc(100vw - 16px);
  max-width: none;
  margin: 0 8px;
  overflow: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  max-height: calc(100vh - 150px);
}
.lifecycle-matrix {
  width: max-content;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12.5px;
  line-height: 1.45;
}
.lifecycle-matrix th,
.lifecycle-matrix td {
  min-width: 150px;
  max-width: 230px;
  padding: 10px 11px;
  vertical-align: top;
  text-align: left;
  border-right: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}
.lifecycle-matrix thead th {
  position: sticky;
  top: 0;
  z-index: 4;
  font-weight: 700;
  background: var(--vp-c-bg-soft);
}
.lifecycle-matrix thead .group-row th {
  top: 0;
  text-align: center;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-alt);
}
.lifecycle-matrix thead tr:nth-child(2) th { top: 39px; }
.lifecycle-matrix th:first-child,
.lifecycle-matrix td:first-child {
  position: sticky;
  left: 0;
  z-index: 3;
  min-width: 145px;
  max-width: 145px;
  font-weight: 700;
  background: var(--vp-c-bg-soft);
}
.lifecycle-matrix thead th:first-child { z-index: 7; }
.lifecycle-matrix tbody tr:hover td,
.lifecycle-matrix tbody tr:hover th:first-child { background: var(--vp-c-bg-soft); }
.s {
  display: inline-block;
  margin: 0 2px 3px 0;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.s.pass { color: var(--vp-c-green-1); background: var(--vp-c-green-soft); }
.s.frozen { color: var(--vp-c-indigo-1); background: var(--vp-c-indigo-soft); }
.s.ready { color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.s.blocked { color: var(--vp-c-danger-1); background: var(--vp-c-danger-soft); }
.s.pending { color: var(--vp-c-yellow-1); background: var(--vp-c-yellow-soft); }
.s.recovery { color: var(--vp-c-purple-1, var(--vp-c-brand-1)); background: var(--vp-c-brand-soft); }
.s.na { color: var(--vp-c-text-2); background: var(--vp-c-default-soft); }
.global-stage-grid {
  margin: 0 24px 40px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}
.global-stage-grid > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}
.global-stage-grid span { color: var(--vp-c-text-2); line-height: 1.6; }
@media (max-width: 768px) {
  .domain-lifecycle-matrix-page h1,
  .domain-lifecycle-matrix-page h2,
  .domain-lifecycle-matrix-page > p,
  .domain-lifecycle-matrix-page > ol,
  .domain-lifecycle-matrix-page > ul,
  .matrix-toolbar,
  .matrix-legend,
  .global-stage-grid { margin-left: 12px; margin-right: 12px; }
  .matrix-scroll { width: calc(100vw - 8px); margin: 0 4px; }
}
</style>
