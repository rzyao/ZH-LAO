---
status: complete
phase: 2
task: IDN-03
task_name: Repository Layer
completed_at: 2026-08-30
---

# ZH-LAO  — IDN-03 Repository Layer Report

## 结果

```text
IDN-03 = COMPLETE
IDENTITY_DESIGN_GATE = PASS
IDENTITY_IMPLEMENTATION = IN_PROGRESS
IDN-04 = NOT_STARTED
```

## Repository Contracts 与实现

`application/ports` 定义了不依赖 PostgreSQL、SQL、`pg` 或 Fastify 的 7 个契约；`infrastructure/repositories.ts` 提供对应 PostgreSQL 实现：

- UserRepository：6 个数据访问原语。
- AuthIdentityRepository：5 个数据访问原语。
- BasicProfileRepository：3 个数据访问原语，更新字段为白名单。
- LearningProfileRepository：2 个数据访问原语；没有学习方向更新。
- OtpChallengeRepository：10 个数据访问与锁原语。
- DeviceRepository：8 个数据访问原语。
- SessionRepository：12 个数据访问原语。

所有返回值均为明确的 Repository record，未向 Application 返回 `pg` row。PostgreSQL `BIGINT` 一律映射为 branded `bigint`，没有 `Number(bigint)`；`timestamptz` 映射为 `Date`；`birth_date` 映射为稳定的日历日期字符串，避免时区漂移；数据库 `NULL` 保持为 `null`。

## 事务、错误和锁

`createIdentityRepositories(executor)` 接受 Foundation 的 `DatabaseExecutor`，可直接在 `TransactionManager.run(async executor => ...)` 内创建事务作用域仓储。

```text
Identity-owned DB Pool = 0
Identity-owned TransactionManager = 0
Foundation DatabaseExecutor reused = YES
```

基础设施将唯一冲突、外键一致性冲突和意外数据库错误映射为不泄漏 SQLSTATE/约束名的最小 `AppError` 分类；查询未找到统一返回 `null`。

- User 行锁：`SELECT ... FOR UPDATE`。
- OTP pending 行锁：`SELECT ... FOR UPDATE`。
- OTP 请求锁：确定性的 phone + purpose 双整数 key，使用 `pg_advisory_xact_lock`，不自行开事务。
- Refresh Session 行锁：`SELECT ... FOR UPDATE`。

## 边界与敏感数据

```text
Application business logic in repository = 0
Cross-domain SQL = 0
Public repository export = 0
Raw OTP persisted by repository = 0
Raw Refresh Token persisted by repository = 0
RefreshTokenHash only = PASS
Identity business routes = 0
```

OTP 验证/限流、电话或 Facebook 认证、JWT、refresh rotation、Device/Session 生命周期服务及 HTTP 路由均未提前实现。

## 真实 PostgreSQL 验证

新鲜  migration 数据库的集成测试覆盖七类仓储的主要创建、读取、更新、nullable 映射、唯一冲突、事务回滚与 executor 隔离；并发测试证明同一 User 行、同一 refresh hash 行、同 phone + purpose advisory lock 会等待，而不同号码不会错误串行化。

```text
Typecheck = PASS
Lint + Architecture Audit = PASS
Build = PASS
Unit Tests = PASS (22/22)
Integration Tests = PASS (13/13，含 Foundation 10/10)
Repository Integration Tests = PASS (3/3)
Concurrency Tests = PASS (User / Session / OTP advisory)
Rollback + Executor Isolation = PASS
Frozen migration changes = 0
```

## Blockers 与延后事项

```text
Blockers = 0
```

IDN-04 及后续任务保留 OTP 技术服务、哈希/比较、认证、token 服务、refresh rotation 与业务 use case。
