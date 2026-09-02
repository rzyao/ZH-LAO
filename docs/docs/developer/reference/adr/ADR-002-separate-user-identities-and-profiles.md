---
status: frozen
date: 2026-08-30
---

# ADR-002：拆分 User、登录身份和资料

## 决策

`identity.users` 仅作为 User Root；登录方式进入 `auth_identities`，基础资料进入 `basic_profiles`，固定学习方向进入 `learning_profiles`。社交资料、位置、会员、认证和学习进度归各自领域。

## 原因与后果

避免 users 发展成包含 phone、Facebook ID、照片、位置、VIP 和社交字段的万能表。一个 User 可绑定多个 Provider；不同资格和资料可独立演进。
