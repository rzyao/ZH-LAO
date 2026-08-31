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

本页把每个 Domain 从 **数据库契约 → 规格设计 → 后端 → 管理后台 → 客户端 → 集成 → 验证 → 发布** 的状态放在同一张控制矩阵中。

它是流程控制视图，不直接创造 Gate 事实。发生冲突时按：**最终 Gate / 最终审计 → Implementation Report → Design Audit → 当前代码与测试 → DEVELOPMENT_PROGRESS → 本页摘要** 的顺序裁决。

**阅读方式：** 页面已关闭左侧 Sidebar 与右侧 Aside；矩阵本身横向滚动。第一列 Domain 尽量保持固定。

快速入口：[流程控制中心](DEVELOPMENT_CONTROL_CENTER.md) · [详细进度台账](DEVELOPMENT_PROGRESS.md) · [Master Plan](MASTER_DEVELOPMENT_PLAN.md)

状态图例：<span class="st st-pass">通过 / 完成</span> <span class="st st-frozen">已冻结</span> <span class="st st-ready">已就绪</span> <span class="st st-blocked">阻塞 / 失败</span> <span class="st st-pending">待处理</span> <span class="st st-recovered">已恢复</span> <span class="st st-na">不适用 / 未单列</span>

## Domain 生命周期总矩阵

| 领域 | 数据库契约 | 产品语义 | 用例 / 工作流 | HTTP API | 公共契约 | 实施计划 | 设计 Gate | 执行简报 | 后端实现 | 后端 Gate / 冻结 | Admin 简报 | Admin 实现 | Admin Gate | 客户端契约 / UX | 客户端实现 | 客户端 Gate | 跨域契约 | 事件 / Worker / Job | 安全 / 并发 | 回归 / CI | 生产就绪 | 恢复 / 漂移 | 依赖 / 阻塞 | 下一动作 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Identity | <span class="st st-frozen">已冻结</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-frozen">已冻结</span> | <span class="st st-pass">已完成</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">已执行</span> | <span class="st st-pass">已完成</span> | <span class="st st-frozen">通过 / 已冻结</span> | <span class="st st-na">未单列</span> | <span class="st st-na">未单列</span> | <span class="st st-na">—</span> | Auth / Session / Device 契约可消费 | <span class="st st-pending">待 Phase 14 收口</span> | <span class="st st-pending">待 Phase 14</span> | Identity public contract 已冻结 | OTP / Provider / Session runtime | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pending">待 Phase 16</span> | <span class="st st-na">无 active recovery</span> | 无当前阻塞 | 保持冻结；后续只做回归修复与 Client Integration |
| Platform | <span class="st st-frozen">已冻结</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-frozen">已冻结</span> | <span class="st st-frozen">已冻结</span> | <span class="st st-pass">已完成</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">已执行</span> | <span class="st st-pass">已完成</span> | <span class="st st-frozen">通过 / 已冻结</span> | <span class="st st-ready">已就绪</span> | <span class="st st-ready">Stage A 已完成</span>；<span class="st st-pending">Stage B 待处理</span> | <span class="st st-pending">待 Stage B</span> | Runtime feature / app-version / announcement / region APIs | <span class="st st-pending">待 Phase 14 收口</span> | <span class="st st-pending">待 Phase 14</span> | Operations RBAC integration contract | Runtime control-plane logic | <span class="st st-pass">通过</span> | <span class="st st-pass">Backend 通过</span>；<span class="st st-pending">Admin live E2E 待处理</span> | <span class="st st-pending">待 Phase 16</span> | <span class="st st-na">无 active recovery</span> | Stage B 尚未收口 | 完成 Platform Admin Stage B |
| Operations | <span class="st st-frozen">已冻结</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-frozen">已冻结</span> | <span class="st st-frozen">已冻结</span> | <span class="st st-pass">已完成</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">已执行</span> | <span class="st st-pass">已完成</span> | <span class="st st-frozen">通过 / 已冻结</span> | <span class="st st-pending">轨道缺失</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-na">不适用（后台控制面）</span> | <span class="st st-na">不适用</span> | <span class="st st-na">不适用</span> | RBAC / Audit owner | 无独立 queue | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pending">待 Phase 16</span> | <span class="st st-na">无 active recovery</span> | Admin track 尚未建立 | 建立并执行 Operations Admin Brief |
| Content | <span class="st st-frozen">已冻结</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">已完成</span> | <span class="st st-pass">通过</span> | <span class="st st-ready">已就绪</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-ready">已准备</span> | <span class="st st-blocked">阻塞 / 未开始</span> | <span class="st st-blocked">入口审计失败</span> | Runtime curriculum / dictionary / practice contracts 已设计 | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | Identity / Audio / Learning boundaries 已设计 | 仅真实消费者需要时 Outbox | <span class="st st-pending">设计覆盖完成；runtime race 待实现</span> | <span class="st st-pending">实现回归未运行</span> | <span class="st st-pending">待 Phase 16</span> | <span class="st st-na">无 recovery；注意文档漂移</span> | <span class="st st-blocked">CONTENT_GATE 未通过</span> | 执行 Content Backend 并关闭 CONTENT_GATE |
| Learning | <span class="st st-frozen">已冻结</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">已完成</span> | <span class="st st-pass">通过</span> | <span class="st st-ready">依赖满足后就绪</span> | <span class="st st-blocked">阻塞 / 未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未创建</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | Progress / mastery / review / practice / translation UX 已设计 | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | Content trusted scoring + Identity UUID | 真实消费者成立后再落事件 | <span class="st st-pending">设计不变量完成；实现测试待执行</span> | <span class="st st-pending">实现回归未运行</span> | <span class="st st-pending">待 Phase 16</span> | <span class="st st-na">无 active recovery</span> | <span class="st st-blocked">依赖 CONTENT_GATE</span> | Content PASS 后执行 Learning Backend |
| Audio Production | <span class="st st-frozen">已冻结：9-table Slot/Task；0600 unchanged</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">通过</span> | <span class="st st-pass">已完成</span> | <span class="st st-recovered">恢复后通过</span> | <span class="st st-pending">未创建</span> | <span class="st st-blocked">阻塞 / 未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未创建</span>；Workbench requirements 已设计 | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | Official-audio resolution / playback contract 已设计 | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | Content revision + Asset + Operations RBAC boundaries | TTS polling worker / retry / lease / batch 已设计 | <span class="st st-pending">Concurrency matrix 已设计；实现验证待执行</span> | <span class="st st-pass">Design audit 通过</span>；<span class="st st-pending">实现 CI 未开始</span> | <span class="st st-pending">待 Phase 16</span> | <span class="st st-recovered">已恢复</span>；错误设计包已清理 | <span class="st st-blocked">CONTENT_GATE 未通过</span>；<span class="st st-pass">Operations 已通过</span> | 保持 Design PASS；Content Gate 后生成/执行 Audio Execution Brief |
| Social | <span class="st st-frozen">数据库已冻结</span> | 产品文档存在；<span class="st st-pending">V2 Phase Design 未启动</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未创建</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未创建</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | Identity UUID / Trust report boundary 已冻结 | <span class="st st-pending">Application phase 未设计</span> | <span class="st st-pending">Application phase 未设计</span> | <span class="st st-pending">未运行</span> | <span class="st st-pending">待 Phase 16</span> | <span class="st st-na">无 active recovery</span> | <span class="st st-pass">Identity PASS 已满足</span>；尚未正式排期 | 进入流水线时先执行 Social Design |
| Chat | <span class="st st-frozen">数据库已冻结</span> | 产品文档存在；<span class="st st-pending">V2 Phase Design 未启动</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未创建</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未创建</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | Identity + Social public contracts required | <span class="st st-pending">Application phase 未设计</span> | <span class="st st-pending">Application phase 未设计</span> | <span class="st st-pending">未运行</span> | <span class="st st-pending">待 Phase 16</span> | <span class="st st-na">无 active recovery</span> | <span class="st st-blocked">依赖 Social 所需契约 / Gate</span> | Social required contract 可用后进入 Chat Design |
| Commerce | <span class="st st-frozen">数据库已冻结</span> | 产品文档存在；<span class="st st-pending">V2 Phase Design 未启动</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未创建</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未创建</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | Identity + Chat logical UUID / contract | <span class="st st-pending">Payment / outbox application flows 未设计</span> | <span class="st st-pending">Application phase 未设计</span> | <span class="st st-pending">未运行</span> | <span class="st st-pending">待 Phase 16</span> | <span class="st st-na">无 active recovery</span> | <span class="st st-blocked">依赖 Chat 所需契约</span> | Chat required contract 可用后进入 Commerce Design |
| Rewards | <span class="st st-frozen">数据库已冻结</span> | 产品文档存在；<span class="st st-pending">V2 Phase Design 未启动</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未创建</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未创建</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | Commerce event contract upstream | <span class="st st-pending">Reward consumer / delivery application 未设计</span> | <span class="st st-pending">Application phase 未设计</span> | <span class="st st-pending">未运行</span> | <span class="st st-pending">待 Phase 16</span> | <span class="st st-na">无 active recovery</span> | <span class="st st-blocked">依赖 Commerce Event Contract</span> | Commerce event contract PASS 后进入 Rewards Design |
| Trust & Safety | <span class="st st-frozen">数据库已冻结；trust.reports canonical</span> | 产品文档存在；<span class="st st-pending">V2 Phase Design 未启动</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未创建</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未创建</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | <span class="st st-pending">未开始</span> | <span class="st st-pending">未开始</span> | <span class="st st-na">—</span> | Identity + Social + Chat + Commerce subject/report contracts | <span class="st st-pending">Moderation / enforcement application flows 未设计</span> | <span class="st st-pending">Application phase 未设计</span> | <span class="st st-pending">未运行</span> | <span class="st st-pending">待 Phase 16</span> | <span class="st st-na">无 active recovery</span> | <span class="st st-blocked">依赖上游 subject contracts</span> | 上游 subject contracts 稳定后进入 Trust Design |

## 矩阵之外仍需单独控制的全局阶段

| 全局阶段 | 准入条件 | 主要目标 |
| --- | --- | --- |
| 跨域集成 | 相关 Domain Gate / Public Contract 达到准入 | 全域契约、事件、读模型与幂等闭环 |
| 完整客户端集成 | Required APIs / Domain Gates 可用 | Admin / Mobile 导航、权限、跨域用户旅程最终收口 |
| 全系统验证 | Product Feature Complete | E2E、Security、Performance、Recovery、Migration、CI |
| 生产就绪 | Full-System Validation PASS | Deploy、Observability、Runbook、Provider、Backup / Recovery |
| 上线 | All mandatory Gates PASS | 正式上线 |

## 维护规则

1. **有代码 commit ≠ 后端 Gate PASS。** 必须有 Final Gate / Report / 测试证据。
2. **Backend PASS ≠ Admin / Client COMPLETE。** 三条实现轨独立收口。
3. **Design Gate PASS 只授权进入 Backend Entry Audit。**
4. `BLOCKER / HIGH / DB_CONFLICT / DESIGN_CONFLICT` 必须先执行 Grounding Gate。
5. 本页只记录当前 `main` 能证实的状态；不确定保持 `— / 未开始 / 未单列`。
6. 状态变化时同步检查 `DEVELOPMENT_PROGRESS.md` 与 `DEVELOPMENT_CONTROL_CENTER.md`。
7. 表格必须保持为标准 Markdown table；不要再次改成包含空行的 raw HTML `<table>`，避免 VitePress 将 `<tr>/<td>` 解析成文本。
8. 状态值使用本页 `.st` 徽章样式；不要退回无颜色的裸状态文本。

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
.st {
  display: inline-block;
  box-sizing: border-box;
  margin: 1px 2px 2px 0;
  padding: 2px 7px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
  white-space: nowrap;
}
.st-pass { color: #166534; background: #dcfce7; border-color: #86efac; }
.st-frozen { color: #3730a3; background: #e0e7ff; border-color: #a5b4fc; }
.st-ready { color: #1d4ed8; background: #dbeafe; border-color: #93c5fd; }
.st-blocked { color: #b91c1c; background: #fee2e2; border-color: #fca5a5; }
.st-pending { color: #92400e; background: #fef3c7; border-color: #fcd34d; }
.st-recovered { color: #6d28d9; background: #ede9fe; border-color: #c4b5fd; }
.st-na { color: #4b5563; background: #f3f4f6; border-color: #d1d5db; }
.dark .st-pass { color: #86efac; background: rgba(22,101,52,.28); border-color: #166534; }
.dark .st-frozen { color: #c7d2fe; background: rgba(55,48,163,.32); border-color: #4f46e5; }
.dark .st-ready { color: #bfdbfe; background: rgba(29,78,216,.28); border-color: #2563eb; }
.dark .st-blocked { color: #fecaca; background: rgba(185,28,28,.28); border-color: #dc2626; }
.dark .st-pending { color: #fde68a; background: rgba(146,64,14,.30); border-color: #b45309; }
.dark .st-recovered { color: #ddd6fe; background: rgba(109,40,217,.30); border-color: #7c3aed; }
.dark .st-na { color: #d1d5db; background: rgba(75,85,99,.30); border-color: #6b7280; }
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