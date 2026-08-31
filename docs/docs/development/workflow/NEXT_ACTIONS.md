---
status: grounded
last_updated: 2026-08-31
source_head: 8b43386611b4e1cb5423df8f1d16f513b93e4625
---

# Current Scheduling Snapshot

Workflow Bootstrap 已完成。当前没有 active Claim；以下 READY Stage 已按最新 `main` 的 Gate / Report / code evidence 重新核验。

## PRIMARY

```text
▶ CONTENT-BACKEND-PREP
```

Content 已通过 Design Gate，Identity / Platform / Operations 均已 PASS；完成本 Stage 后才能安全生成新协议下的 Backend Implementation Task，并继续解锁 Content Admin、Learning Backend 与 Audio Backend。

## PARALLEL SAFE

```text
▶ PLATFORM-ADMIN-STAGE-B
▶ LOGIN-MOBILE-DESIGN
▶ OPERATIONS-ADMIN-DESIGN
▶ AUDIO-PRODUCTION-ADMIN-DESIGN
```

这些 Stage 当前 owned paths / 角色 / 依赖互不冲突；开始前仍必须重新检查 latest main、Claim、Entry Gate 与 Drift。

## ACTIVE

`none`

## BLOCKED

```text
CONTENT-ADMIN                    → CONTENT_BACKEND_GATE
LEARNING-BACKEND-PREP            → CONTENT_BACKEND_GATE
AUDIO-BACKEND-PREP               → CONTENT_BACKEND_GATE
AUDIO-PRODUCTION-INTEGRATION     → AUDIO_BACKEND_GATE + CONTENT_BACKEND_GATE
CHAT-DESIGN                      → SOCIAL_DESIGN_GATE
COMMERCE-DESIGN                  → CHAT_DESIGN_GATE
REWARDS-DESIGN                   → COMMERCE_DESIGN_GATE
TRUST-DESIGN                     → upstream subject contracts
```

`SOCIAL-DESIGN` 已识别为 `todo`，本次 Bootstrap 不为它制造未经正式 Task/Brief grounding 的 READY 权限。

## RECOVERY REQUIRED

`none`

## NEXT CONVERSATION PROMPTS

### CONTENT-BACKEND-PREP

```text
使用 GitHub 连接器连接 `rzyao/ZH-LAO`，读取最新 `main`。
Task ID / Stage ID：CONTENT-BACKEND-PREP
首先读取 workflow/index.md、TASK_MANIFEST_SCHEMA.md 与 workflow/tasks/CONTENT-BACKEND-PREP.yaml。
严格按 Manifest 指向的 Brief、required_sources、Entry Gate 和路径权限执行。本 Stage 角色为 design_worker，只负责 Content Backend 实现准备：grounding 当前仓库，生成 Backend Execution Brief、Implementation Blueprint、trace/test/file mapping 和 Prep Report。
不得修改 apps/backend、apps/admin、apps/mobile 或 frozen migration；不得开始 Content Backend Implementation；不得依赖聊天上下文。
开始前检查 active claims；完成前重验 latest main 与 authority drift。只有满足 expected_gate 才可声明 CONTENT_IMPLEMENTATION_READY = PASS。
完成后直接推送 GitHub main，报告 commits / outputs / gate / blockers，然后 STOP。
```

### PLATFORM-ADMIN-STAGE-B

```text
使用 GitHub 连接器连接 `rzyao/ZH-LAO`，读取最新 `main`。
Task ID / Stage ID：PLATFORM-ADMIN-STAGE-B
首先读取 workflow/index.md 与 workflow/tasks/PLATFORM-ADMIN-STAGE-B.yaml。
重新验证 ADMIN_FOUNDATION_GATE、PLATFORM_GATE、OPERATIONS_GATE、Platform management HTTP 与 Operations operator authorization/audit，并检查 active claims。
严格执行 Manifest 与 PLATFORM_ADMIN_EXECUTION_BRIEF.md 的 Stage B，只修改允许的 Admin 路径；不得修改 Backend、Mobile 或 migration。
完成 real operator auth、RBAC 401/403、permission-aware UI、live management integration/E2E 和成功操作审计验证。
不得依赖聊天上下文。完成前重验 repository drift；只有真实证据满足时才能声明 PLATFORM_ADMIN_GATE = PASS。
把新 Report 写入 Manifest 指定的新 Admin 目录，推送 main，然后 STOP。
```

### LOGIN-MOBILE-DESIGN

```text
使用 GitHub 连接器连接 `rzyao/ZH-LAO`，读取最新 `main`。
Task ID / Stage ID：LOGIN-MOBILE-DESIGN
首先读取 workflow/index.md 与 workflow/tasks/LOGIN-MOBILE-DESIGN.yaml。
本 Stage 是 design_worker。重验 MOBILE_FOUNDATION_GATE 与 IDENTITY_GATE，读取 Login Feature、Identity authority、真实 Identity API/Public Contract 和当前 Mobile Auth/Session/Secure Storage/HTTP Client。
严格执行 LOGIN_MOBILE_DESIGN_BRIEF.md，生成 Mobile Execution Brief、Implementation Blueprint 和 Design Report。
不得修改 apps/mobile 代码，不得重新设计 Identity，不得依赖聊天上下文。
完成前检查 claims / drift；只有满足时声明 LOGIN_MOBILE_DESIGN_GATE = PASS。推送 main 后 STOP，不开始 Mobile Implementation。
```

### OPERATIONS-ADMIN-DESIGN

```text
使用 GitHub 连接器连接 `rzyao/ZH-LAO`，读取最新 `main`。
Task ID / Stage ID：OPERATIONS-ADMIN-DESIGN
首先读取 workflow/index.md 与 workflow/tasks/OPERATIONS-ADMIN-DESIGN.yaml。
本 Stage 是 design_worker。重验 ADMIN_FOUNDATION_GATE 与 OPERATIONS_GATE，并读取 Operations RBAC/Audit/API authority 与当前 Admin Foundation。
严格执行 OPERATIONS_ADMIN_DESIGN_BRIEF.md，生成 Admin Execution Brief、Implementation Blueprint 和 Design Report。
不得修改 apps/admin 业务代码，不得重新定义 Operations 权限模型，不得依赖聊天上下文。
完成前检查 claims / drift；只有满足时声明 OPERATIONS_ADMIN_DESIGN_GATE = PASS。推送 main 后 STOP，不开始 Admin Implementation。
```

### AUDIO-PRODUCTION-ADMIN-DESIGN

```text
使用 GitHub 连接器连接 `rzyao/ZH-LAO`，读取最新 `main`。
Task ID / Stage ID：AUDIO-PRODUCTION-ADMIN-DESIGN
首先读取 workflow/index.md 与 workflow/tasks/AUDIO-PRODUCTION-ADMIN-DESIGN.yaml。
本 Stage 是 design_worker。重验 ADMIN_FOUNDATION_GATE、AUDIO_DESIGN_GATE、CONTENT_DESIGN_GATE、OPERATIONS_GATE，并读取 Audio Production Feature、Audio lifecycle/contracts、Content/Operations authority 与 Admin Foundation。
严格执行 AUDIO_PRODUCTION_ADMIN_DESIGN_BRIEF.md，生成 Workbench Execution Brief、Implementation Blueprint 和 Design Report。
不得修改 apps/admin 业务代码，不得重新设计 Audio/Content/Operations，不得依赖聊天上下文。
完成前检查 claims / drift；只有满足时声明 AUDIO_PRODUCTION_ADMIN_DESIGN_GATE = PASS。推送 main 后 STOP，不开始 Admin Implementation。
```
