---
layout: page
sidebar: false
aside: false
outline: false
footer: false
pageClass: ai-stage-matrix-page
status: derived-ai-stage-matrix
last_updated: 2026-08-31
---

| 对象 | 设计 AI | Backend AI | Admin AI | Mobile AI | 集成 AI | 验收 AI | 下一段提示词 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <span class="obj system">◆ 工作流控制面</span> | <a class="stage stage-ready" title="WORKFLOW-BOOTSTRAP" href="/development/workflow/WORKFLOW_BOOTSTRAP_BRIEF">▶ 工作流 Bootstrap</a> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <a class="stage stage-ready" title="WORKFLOW-BOOTSTRAP" href="/development/workflow/WORKFLOW_BOOTSTRAP_BRIEF">▶ WORKFLOW-BOOTSTRAP</a> |
| <span class="obj domain">◆ 身份（Identity）</span> | <a class="stage stage-done" title="IDENTITY-DESIGN" href="/domains/identity/">✅ 领域设计</a> | <a class="stage stage-done" title="IDENTITY-BACKEND-LEGACY" href="/development/backend/identity/">✅ 后端实现（历史）</a><br><a class="stage stage-done" title="IDENTITY-BACKEND-VERIFY" href="/development/backend/identity/">✅ 后端验证</a> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <a class="stage stage-done" title="IDENTITY-DOMAIN-COMPLETE" href="/development/backend/identity/">✅ Domain 主链已完成</a> |
| <span class="obj feature">↳ ◇ 登录与会话</span> | <a class="stage stage-done" title="LOGIN-FEATURE-DESIGN" href="/features/login/">✅ 功能定义</a> | <a class="stage stage-done" title="LOGIN-IDENTITY-DEPENDENCY" href="/development/backend/identity/">✅ Identity Backend</a> | <span class="stage stage-na">—</span> | <a class="stage stage-todo" title="LOGIN-MOBILE-DESIGN" href="/development/mobile/auth/">○ Mobile 设计</a><br><a class="stage stage-todo" title="LOGIN-MOBILE" href="/development/mobile/auth/">○ Mobile 实现</a> | <a class="stage stage-todo" title="LOGIN-INTEGRATION" href="/features/login/">○ 真实 API 集成</a> | <a class="stage stage-todo" title="LOGIN-ACCEPTANCE" href="/features/login/">○ E2E 验收</a> | <a class="stage stage-todo" title="LOGIN-MOBILE-DESIGN" href="/development/workflow/WORKFLOW_BOOTSTRAP_BRIEF">○ LOGIN-MOBILE-DESIGN</a> |
| <span class="obj domain">◆ 平台（Platform）</span> | <a class="stage stage-done" title="PLATFORM-DESIGN" href="/domains/platform/">✅ 领域设计</a> | <a class="stage stage-done" title="PLATFORM-BACKEND" href="/development/backend/platform/">✅ 后端实现与验证</a> | <a class="stage stage-done" title="PLATFORM-ADMIN-STAGE-A" href="/development/admin/platform-control/">✅ Admin Stage A</a><br><a class="stage stage-todo" title="PLATFORM-ADMIN-STAGE-B" href="/development/admin/platform-control/">○ Admin Stage B</a> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <a class="stage stage-todo" title="PLATFORM-ADMIN-STAGE-B" href="/development/workflow/WORKFLOW_BOOTSTRAP_BRIEF">○ PLATFORM-ADMIN-STAGE-B</a> |
| <span class="obj domain">◆ 运营（Operations）</span> | <a class="stage stage-done" title="OPERATIONS-DESIGN" href="/domains/operations/">✅ 领域设计</a> | <a class="stage stage-done" title="OPERATIONS-BACKEND" href="/development/backend/operations/">✅ 后端实现与验证</a> | <a class="stage stage-todo" title="OPERATIONS-ADMIN-DESIGN" href="/development/admin/access-control/">○ Admin 设计</a> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <a class="stage stage-todo" title="OPERATIONS-ADMIN-DESIGN" href="/development/workflow/WORKFLOW_BOOTSTRAP_BRIEF">○ OPERATIONS-ADMIN-DESIGN</a> |
| <span class="obj domain">◆ 内容（Content）</span> | <a class="stage stage-done" title="CONTENT-DESIGN" href="/domains/content/">✅ 领域设计</a> | <a class="stage stage-todo" title="CONTENT-BACKEND-PREP" href="/development/backend/content/">○ 后端实现准备</a><br><a class="stage stage-todo" title="CONTENT-BACKEND" href="/development/backend/content/">○ 后端实现</a><br><a class="stage stage-todo" title="CONTENT-BACKEND-AUDIT" href="/development/backend/content/">○ 后端独立审计</a> | <a class="stage stage-blocked" title="CONTENT-ADMIN · blocked_by=CONTENT_BACKEND_GATE" href="/development/admin/content-management/">⛔ 内容管理实现</a> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <a class="stage stage-todo" title="CONTENT-BACKEND-PREP" href="/development/workflow/WORKFLOW_BOOTSTRAP_BRIEF">○ CONTENT-BACKEND-PREP</a> |
| <span class="obj domain">◆ 学习（Learning）</span> | <a class="stage stage-done" title="LEARNING-DESIGN" href="/domains/learning/">✅ 领域设计</a> | <a class="stage stage-blocked" title="LEARNING-BACKEND-PREP · blocked_by=CONTENT_BACKEND_GATE" href="/development/backend/learning/">⛔ 后端实现准备</a><br><a class="stage stage-blocked" title="LEARNING-BACKEND · blocked_by=CONTENT_BACKEND_GATE" href="/development/backend/learning/">⛔ 后端实现</a><br><a class="stage stage-todo" title="LEARNING-BACKEND-AUDIT" href="/development/backend/learning/">○ 后端独立审计</a> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <a class="stage stage-blocked" title="LEARNING-BACKEND-PREP" href="/development/backend/content/">⛔ 等 CONTENT_BACKEND_GATE</a> |
| <span class="obj domain">◆ 音频生产（Audio Production）</span> | <a class="stage stage-done" title="AUDIO-DESIGN-RECOVERY" href="/domains/audio/">✅ Design Recovery</a><br><a class="stage stage-done" title="AUDIO-DESIGN-GATE" href="/domains/audio/">✅ 领域设计</a> | <a class="stage stage-todo" title="AUDIO-BACKEND-PREP" href="/development/backend/audio/">○ 后端实现准备</a><br><a class="stage stage-todo" title="AUDIO-BACKEND" href="/development/backend/audio/">○ 后端实现</a><br><a class="stage stage-todo" title="AUDIO-BACKEND-AUDIT" href="/development/backend/audio/">○ 后端独立审计</a> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <a class="stage stage-todo" title="AUDIO-BACKEND-PREP" href="/development/workflow/WORKFLOW_BOOTSTRAP_BRIEF">○ AUDIO-BACKEND-PREP</a> |
| <span class="obj feature">↳ ◇ 音频生产</span> | <a class="stage stage-done" title="AUDIO-PRODUCTION-FEATURE-DESIGN" href="/features/audio-production/">✅ 功能定义</a> | <a class="stage stage-blocked" title="AUDIO-PRODUCTION-AUDIO-DEPENDENCY · blocked_by=AUDIO_BACKEND_GATE" href="/development/backend/audio/">⛔ Audio Backend</a><br><a class="stage stage-blocked" title="AUDIO-PRODUCTION-CONTENT-DEPENDENCY · blocked_by=CONTENT_BACKEND_GATE" href="/development/backend/content/">⛔ Content Backend</a><br><a class="stage stage-done" title="AUDIO-PRODUCTION-OPERATIONS-DEPENDENCY" href="/development/backend/operations/">✅ Operations Backend</a> | <a class="stage stage-todo" title="AUDIO-PRODUCTION-ADMIN-DESIGN" href="/development/admin/audio-production/">○ Workbench 设计</a><br><a class="stage stage-todo" title="AUDIO-PRODUCTION-ADMIN" href="/development/admin/audio-production/">○ Workbench 实现</a> | <span class="stage stage-na">—</span> | <a class="stage stage-blocked" title="AUDIO-PRODUCTION-INTEGRATION · blocked_by=AUDIO_BACKEND_GATE + CONTENT_BACKEND_GATE" href="/features/audio-production/">⛔ 跨层集成</a> | <a class="stage stage-todo" title="AUDIO-PRODUCTION-ACCEPTANCE" href="/features/audio-production/">○ E2E 验收</a> | <a class="stage stage-blocked" title="AUDIO-PRODUCTION-INTEGRATION" href="/features/audio-production/">⛔ 等 Audio / Content Backend</a> |
| <span class="obj domain">◆ 社交（Social）</span> | <a class="stage stage-done" title="SOCIAL-DB-LEGACY" href="/domains/social/database">✅ 数据模型定稿（历史）</a><br><a class="stage stage-todo" title="SOCIAL-DESIGN" href="/domains/social/">○ 正式领域设计</a> | <a class="stage stage-todo" title="SOCIAL-BACKEND" href="/development/backend/">○ 后端实现</a> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <a class="stage stage-todo" title="SOCIAL-DESIGN" href="/development/workflow/WORKFLOW_BOOTSTRAP_BRIEF">○ SOCIAL-DESIGN</a> |
| <span class="obj domain">◆ 聊天（Chat）</span> | <a class="stage stage-done" title="CHAT-DB-LEGACY" href="/domains/chat/database">✅ 数据模型定稿（历史）</a><br><a class="stage stage-todo" title="CHAT-DESIGN" href="/domains/chat/">○ 正式领域设计</a> | <a class="stage stage-blocked" title="CHAT-BACKEND · blocked_by=SOCIAL_DESIGN_GATE" href="/development/backend/">⛔ 后端实现</a> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <a class="stage stage-blocked" title="CHAT-DESIGN" href="/domains/social/">⛔ 等 SOCIAL_DESIGN_GATE</a> |
| <span class="obj domain">◆ 商业（Commerce）</span> | <a class="stage stage-done" title="COMMERCE-DB-LEGACY" href="/domains/commerce/database">✅ 数据模型定稿（历史）</a><br><a class="stage stage-todo" title="COMMERCE-DESIGN" href="/domains/commerce/">○ 正式领域设计</a> | <a class="stage stage-blocked" title="COMMERCE-BACKEND · blocked_by=CHAT_DESIGN_GATE" href="/development/backend/">⛔ 后端实现</a> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <a class="stage stage-blocked" title="COMMERCE-DESIGN" href="/domains/chat/">⛔ 等 CHAT_DESIGN_GATE</a> |
| <span class="obj domain">◆ 奖励（Rewards）</span> | <a class="stage stage-done" title="REWARDS-DB-LEGACY" href="/domains/rewards/database">✅ 数据模型定稿（历史）</a><br><a class="stage stage-todo" title="REWARDS-DESIGN" href="/domains/rewards/">○ 正式领域设计</a> | <a class="stage stage-blocked" title="REWARDS-BACKEND · blocked_by=COMMERCE_DESIGN_GATE" href="/development/backend/">⛔ 后端实现</a> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <a class="stage stage-blocked" title="REWARDS-DESIGN" href="/domains/commerce/">⛔ 等 COMMERCE_DESIGN_GATE</a> |
| <span class="obj domain">◆ 信任与安全（Trust &amp; Safety）</span> | <a class="stage stage-done" title="TRUST-DB-LEGACY" href="/domains/trust/database">✅ 数据模型定稿（历史）</a><br><a class="stage stage-todo" title="TRUST-DESIGN" href="/domains/trust/">○ 正式领域设计</a> | <a class="stage stage-blocked" title="TRUST-BACKEND · blocked_by=UPSTREAM_SUBJECT_CONTRACTS" href="/development/backend/">⛔ 后端实现</a> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <span class="stage stage-na">—</span> | <a class="stage stage-blocked" title="TRUST-DESIGN" href="/domains/trust/">⛔ 等上游 Subject Contracts</a> |

<style>
.ai-stage-matrix-page .VPContent,
.ai-stage-matrix-page .VPPage,
.ai-stage-matrix-page main,
.ai-stage-matrix-page .content-container { width: 100% !important; max-width: none !important; }
.ai-stage-matrix-page .VPContent,
.ai-stage-matrix-page main { padding-left: 0 !important; padding-right: 0 !important; }
.ai-stage-matrix-page table {
  display: block !important; width: calc(100vw - 8px) !important; max-width: none !important;
  margin: 8px 4px !important; overflow-x: auto !important; white-space: normal;
  border-collapse: separate; border-spacing: 0; font-size: 12px; line-height: 1.35;
}
.ai-stage-matrix-page th,
.ai-stage-matrix-page td {
  box-sizing: border-box; min-width: 180px !important; width: 180px !important;
  max-width: 180px !important; padding: 8px; vertical-align: top;
}
.ai-stage-matrix-page th:first-child,
.ai-stage-matrix-page td:first-child {
  position: sticky; left: 0; z-index: 2; min-width: 190px !important; width: 190px !important;
  max-width: 190px !important; font-weight: 700; background: var(--vp-c-bg-soft);
}
.ai-stage-matrix-page th:last-child,
.ai-stage-matrix-page td:last-child { min-width: 220px !important; width: 220px !important; max-width: 220px !important; }
.ai-stage-matrix-page thead th { font-weight: 700; background: var(--vp-c-bg-soft); }
.obj.feature { padding-left: 14px; font-weight: 600; }
.stage {
  display: inline-block; box-sizing: border-box; max-width: 100%; margin: 1px 2px 3px 0;
  padding: 3px 7px; border: 1px solid transparent; border-radius: 7px;
  font-size: 11px; font-weight: 700; line-height: 1.35; white-space: normal; text-decoration: none !important;
}
.stage-done { color: #166534; background: #dcfce7; border-color: #86efac; }
.stage-ready { color: #1d4ed8; background: #dbeafe; border-color: #93c5fd; }
.stage-active { color: #6d28d9; background: #ede9fe; border-color: #c4b5fd; }
.stage-todo { color: #4b5563; background: #f3f4f6; border-color: #d1d5db; }
.stage-blocked { color: #b91c1c; background: #fee2e2; border-color: #fca5a5; }
.stage-recovery { color: #7e22ce; background: #f3e8ff; border-color: #d8b4fe; }
.stage-na { color: #6b7280; background: transparent; border-color: transparent; }
.dark .stage-done { color: #86efac; background: rgba(22,101,52,.28); border-color: #166534; }
.dark .stage-ready { color: #bfdbfe; background: rgba(29,78,216,.28); border-color: #2563eb; }
.dark .stage-active { color: #ddd6fe; background: rgba(109,40,217,.30); border-color: #7c3aed; }
.dark .stage-todo { color: #d1d5db; background: rgba(75,85,99,.30); border-color: #6b7280; }
.dark .stage-blocked { color: #fecaca; background: rgba(185,28,28,.28); border-color: #dc2626; }
.dark .stage-recovery { color: #e9d5ff; background: rgba(126,34,206,.30); border-color: #9333ea; }
</style>
