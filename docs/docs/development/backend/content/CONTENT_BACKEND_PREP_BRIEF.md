---
status: ready
role: design_worker
stage_id: CONTENT-BACKEND-PREP
last_updated: 2026-08-31
---

# Content Backend 实现准备 Brief

本 Stage 只把已经冻结的 Content 设计编译成可机械实施的 Backend 执行包；**不修改业务代码，不重新设计 Content**。

## Mission

```text
latest main grounding
→ verify CONTENT_DESIGN_GATE / Identity / Platform / Operations
→ read frozen Content authority
→ inspect current backend symbols and conventions
→ reconcile legacy Content Execution Brief
→ create current Backend Execution Brief
→ create Implementation Blueprint
→ create requirement/test/file trace
→ CONTENT_IMPLEMENTATION_READY
→ push
→ STOP
```

## Mandatory Sources

至少读取：

- `/domains/content/**`
- `development/05-content/CONTENT_DESIGN_AUDIT.md`
- `CONTENT_PRODUCT_SEMANTICS.md`
- `CONTENT_USE_CASES.md`
- `CONTENT_PUBLIC_CONTRACTS.md`
- `CONTENT_API.md`
- `CONTENT_IMPLEMENTATION_PLAN.md`
- `CONTENT_EXECUTION_BRIEF.md`
- `SPEC_SYSTEM.md`
- `IMPLEMENTATION_BLUEPRINT_TEMPLATE.md`
- Identity / Platform / Operations 当前 public contracts 与 final reports
- `database/migrations/0400_content.sql`
- `database/migrations/1240_content_revision.sql`
- 当前 `apps/backend` module conventions

## Required Outputs

创建：

```text
docs/docs/development/backend/content/CONTENT_BACKEND_EXECUTION_BRIEF.md
docs/docs/development/backend/content/CONTENT_BACKEND_IMPLEMENTATION_BLUEPRINT.md
docs/docs/development/backend/content/CONTENT_BACKEND_PREP_REPORT.md
```

Blueprint 必须绑定实际 `base_commit`，精确到 file / symbol / transaction / concurrency / error / permission / test。不得伪造 canonical spec adoption；如当前 Domain 未 adopted，明确记录 `adopted: false`。

## Gate

只有以下全部满足才能声明：

```text
CONTENT_IMPLEMENTATION_READY = PASS
```

- 上游 Gate 仍 PASS；
- frozen migration 未被改写；
- Brief 与 Blueprint 无 authority conflict；
- Backend 实现自由度已压缩到 Decision Budget；
- 测试、并发、幂等、安全和跨域调用均有明确方案；
- 无 material repository drift。

完成后直接推送 GitHub `main`，然后 STOP。不要开始 Content Backend Implementation。