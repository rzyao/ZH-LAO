---
status: ready
role: design_worker
stage_id: AUDIO-PRODUCTION-ADMIN-DESIGN
last_updated: 2026-08-31
---

# 音频生产工作台 Admin 设计 Brief

本 Stage 将已经冻结的 Audio Production 业务模型映射为 Admin 工作台页面/运营流程；**不实现页面，不修改 Audio/Content/Operations canonical 语义**。

## Mission

```text
latest main grounding
→ verify ADMIN_FOUNDATION_GATE + AUDIO_DESIGN_GATE + OPERATIONS_GATE + CONTENT_DESIGN_GATE
→ read Audio Feature / Domain / contracts / lifecycle
→ inspect Admin Foundation
→ define workbench IA and operator flows
→ map permissions + designed API contracts
→ define loading/error/concurrency/retry states
→ create Execution Brief + Blueprint + tests
→ AUDIO_PRODUCTION_ADMIN_DESIGN_GATE
→ push
→ STOP
```

## Required Outputs

```text
docs/docs/development/admin/audio-production/AUDIO_PRODUCTION_ADMIN_EXECUTION_BRIEF.md
docs/docs/development/admin/audio-production/AUDIO_PRODUCTION_ADMIN_IMPLEMENTATION_BLUEPRINT.md
docs/docs/development/admin/audio-production/AUDIO_PRODUCTION_ADMIN_DESIGN_REPORT.md
```

至少覆盖：任务队列、生产/TTS/人工录音入口、试听、审核、发布、批量任务、权限与审计、Fresh/Stale 展示、技术失败与质量拒绝区分，以及缺失 Backend 时的契约驱动设计边界。不得按 9 张表机械生成 CRUD 页面。

完成条件：`AUDIO_PRODUCTION_ADMIN_DESIGN_GATE = PASS`。完成后 push `main` 并 STOP，不开始 Admin Implementation。