---
status: complete
phase: 2
task: IDN-02
task_name: Core Types
completed_at: 2026-08-30
lifecycle: historical
---

# ZH-LAO  — IDN-02 Core Types Report

## 结果

```text
IDN-02 = COMPLETE
IDENTITY_DESIGN_GATE = PASS
IDENTITY_IMPLEMENTATION = IN_PROGRESS
IDN-03 = NOT_STARTED
```

## 实现的 Core Types

- `UserPublicId`、`InstallationId` 与 `AvatarMediaId` UUID 语义边界。
- `UserInternalId`、`AuthIdentityInternalId`、`OtpChallengeInternalId`、`DeviceInternalId`、`SessionInternalId` 的 Identity 内部 BIGINT 边界。
- `IdentityAccountStatus`：`active`、`disabled`、`closed`。
- `IdentityAuthProvider`：`phone`、`facebook`。
- `E164PhoneNumber` 与纯规范化函数 `normalizePhoneNumber`。
- `LearningLanguage` 与仅 `lo → zh`、`zh → lo` 有效的 `LearningDirection`。
- `IdentityGender`：`male`、`female`、`other`、`unspecified`。
- `OtpPurpose`、`OtpChallengeStatus`、`SessionStatus`、`DevicePlatform`。
- `RawOtpCode`、`OtpCodeHash`、`RawAccessToken`、`RawRefreshToken`、`RefreshTokenHash` 的品牌类型边界。

## Public / Internal Boundary

`modules/identity/public` 只导出 `UserPublicId`、其 UUID parser/guard，以及 `IdentityAccountStatus`、其 schema/parser。内部 BIGINT ID、安装 ID、OTP/Token raw 值与 hash 均不从 public 边界导出。

## 运行时校验与号码规范化

所有冻结枚举和学习方向均由 Zod runtime schema 校验。电话号码使用 `libphonenumber-js` 的国际号码解析能力：输入不访问数据库、不发送 OTP、不做认证，仅转换为 canonical E.164。

```text
Laos = PASS
China = PASS
Invalid input = PASS
```

## Frozen DB Compatibility

类型严格对应 `0100_identity.sql` 与 `1220_identity_auth_runtime.sql` 的 UUID/BIGINT、CHECK 与 provider/status 值域。

```text
Core type mismatch = 0
Frozen migration changes = 0
```

## 提前实现检查

```text
Repository interfaces = 0
Repository implementations = 0
SQL queries = 0

OTP business implementation = 0
Authentication implementation = 0
Session service implementation = 0
Device service implementation = 0
Token service implementation = 0
Identity business routes = 0
```

## 依赖变更

新增 `libphonenumber-js@1.13.12`，用于成熟的国际 E.164 解析与规范化；没有新增其他运行时基础设施。

## 验证

完成后执行 Typecheck、Lint、Architecture Audit、Build、全部 Unit Tests、PostgreSQL Integration Tests、数据库测试、fresh baseline validation 和文档构建。结果见本轮最终验证输出。

## Blockers

```text
Blockers = 0
```

## 延后事项

Repository、SQL row mapping、OTP 生成/哈希/比较、认证、JWT/Refresh Token 服务、Session/Device 服务及所有 Identity HTTP 路由均留给后续已规划 IDN 任务。
