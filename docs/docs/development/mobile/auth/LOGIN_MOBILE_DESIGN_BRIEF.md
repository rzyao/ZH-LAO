---
status: ready
role: design_worker
stage_id: LOGIN-MOBILE-DESIGN
last_updated: 2026-08-31
---

# 登录与会话 Mobile 设计 Brief

本 Stage 为登录 Feature 生成 Mobile 代码级执行说明；**不写 Mobile 业务代码，不改变 Identity Contract**。

## Mission

```text
latest main grounding
→ verify MOBILE_FOUNDATION_GATE + IDENTITY_GATE
→ read Login Feature + Identity authority
→ inspect current Mobile Auth/Secure Storage/API skeleton
→ define Screen / Navigation / Session Flow
→ map real Identity API adapter
→ define errors / retries / storage / logout
→ create Execution Brief + Blueprint + tests
→ LOGIN_MOBILE_DESIGN_GATE
→ push
→ STOP
```

## Required Sources

- `/features/login/`
- `/domains/identity/` 与账户/会话流程
- Identity 当前 API/Public Contract 与 final report
- `MOBILE_FOUNDATION_REPORT.md`
- `apps/mobile/src` 当前 Auth、Session、HTTP Client、Secure Storage、Navigation
- `SPEC_SYSTEM.md`、`IMPLEMENTATION_BLUEPRINT_TEMPLATE.md`

## Required Outputs

```text
docs/docs/development/mobile/auth/LOGIN_MOBILE_EXECUTION_BRIEF.md
docs/docs/development/mobile/auth/LOGIN_MOBILE_IMPLEMENTATION_BLUEPRINT.md
docs/docs/development/mobile/auth/LOGIN_MOBILE_DESIGN_REPORT.md
```

必须明确：Screen/Route、启动 Session Bootstrap、手机号 OTP/已支持 Provider 流程、真实 API operation mapping、Access/Refresh 存储边界、401/Session invalidation、logout、loading/error/retry、Query/Mutation、文件变更图与测试矩阵。

## Gate

```text
LOGIN_MOBILE_DESIGN_GATE = PASS
```

只有设计足够让 Implementation Worker 按 Blueprint 落地且没有重新发明 Identity 语义时才能 PASS。

完成后 push `main` 并 STOP；不要开始 Mobile Implementation。