---
status: grounded
last_updated: 2026-08-31
source_head: 8b43386611b4e1cb5423df8f1d16f513b93e4625
---

# AI Task Registry

| Task ID | Stage ID | 对象 | Lane | Role | Status | Gate | 依赖 | Claim | Brief |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `CONTENT-BACKEND-PREP` | `CONTENT-BACKEND-PREP` | Content | backend | design_worker | `READY` | `CONTENT_IMPLEMENTATION_READY` | Content/Identity/Platform/Operations Gate PASS | none | [Brief](../backend/content/CONTENT_BACKEND_PREP_BRIEF.md) |
| `PLATFORM-ADMIN-STAGE-B` | `PLATFORM-ADMIN-STAGE-B` | Platform | admin | admin_worker | `READY` | `PLATFORM_ADMIN_GATE` | Admin Foundation/Platform/Operations PASS | none | [Brief](../03-platform/PLATFORM_ADMIN_EXECUTION_BRIEF.md) |
| `LOGIN-MOBILE-DESIGN` | `LOGIN-MOBILE-DESIGN` | Login Feature | mobile | design_worker | `READY` | `LOGIN_MOBILE_DESIGN_GATE` | Mobile Foundation/Identity PASS | none | [Brief](../mobile/auth/LOGIN_MOBILE_DESIGN_BRIEF.md) |
| `OPERATIONS-ADMIN-DESIGN` | `OPERATIONS-ADMIN-DESIGN` | Operations | admin | design_worker | `READY` | `OPERATIONS_ADMIN_DESIGN_GATE` | Admin Foundation/Operations PASS | none | [Brief](../admin/access-control/OPERATIONS_ADMIN_DESIGN_BRIEF.md) |
| `AUDIO-PRODUCTION-ADMIN-DESIGN` | `AUDIO-PRODUCTION-ADMIN-DESIGN` | Audio Production Feature | admin | design_worker | `READY` | `AUDIO_PRODUCTION_ADMIN_DESIGN_GATE` | Admin Foundation/Audio Design/Content Design/Operations PASS | none | [Brief](../admin/audio-production/AUDIO_PRODUCTION_ADMIN_DESIGN_BRIEF.md) |

当前没有 active Claim。`CONTENT-ADMIN`、`LEARNING-BACKEND-PREP`、`AUDIO-BACKEND-PREP` 等仍由明确 Gate 阻塞，因此暂不创建可领取的 READY Manifest。Matrix 中的 blocker 来自现有 Gate/Report；对应前置 Gate PASS 后由 Dispatcher 创建/升级正式 Task Manifest。