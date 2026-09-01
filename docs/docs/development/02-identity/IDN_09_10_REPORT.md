---
status: complete
last_updated: 2026-09-02
lifecycle: historical
---

# ZH-LAO  — IDN-09 至 IDN-10 报告

```text
IDN-09 = COMPLETE
IDN-10 = COMPLETE
IDN-11 = NOT_STARTED
```

- IDN-09：实现 refresh rotation、30 日 sliding TTL、logout current/all 与安全 Session metadata 列表。Refresh 在 Foundation transaction 中锁定旧 hash，对 User 和关联 Device 状态重新校验。
- IDN-10：实现 Device 注册/更新、列表与撤销；撤销 Device 与其 active Session 同事务完成。普通更新不恢复 revoked Device；phone OTP 的 fresh-primary-auth 行为保持原有恢复路径。

```text
Old refresh invalid after rotation = PASS
Raw refresh persistence / output = 0
Session and device internal BIGINT output = 0
Full push token output = 0
Device revoke blocks refresh = PASS
Foundation TransactionManager reused = YES
Repository-owned transactions = 0
Frozen migration changes = 0
Cross-domain SQL = 0
HTTP / Facebook / BindPhone / IDN-11 = 0
```

最终锁定顺序为 Session refresh 的 session row lock；Device 撤销在同一 transaction 内先标记 Device 后撤销关联 Session。事务提交后的 refresh 会重新读取 Device 状态，因此 revoked Device 不会继续获得可用 refresh Session。
