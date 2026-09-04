> ⚠ 回填工件（BACKFILLED ARTIFACT）
> 于 2026-09-04 从 `apps/backend` 逆向整理。
> 这**不是**该功能最初的产品意图，而是依据代码检查得出的描述。
> 请将其视为说明文档，而非规格或权威事实源。

# 后端基础设施与已实现领域模块

## 1. 功能摘要

`apps/backend` 是一个以 PostgreSQL 为数据存储、采用 TypeScript 和 Fastify 构建的模块化单体服务。它组合了健康检查、请求与错误处理、认证，以及 Identity、Operations、Content、Platform 的 HTTP 模块。模块名称、路由注册和测试表明，该服务提供身份与会话管理、后台运营、平台配置及部分内容管理能力。

## 2. 目标用户

- 通过手机 OTP 或 Facebook 登录，并管理自身身份资料的终端用户。
- 管理操作员、权限、平台配置和菜单的后台运营人员。
- 管理老挝语字符草稿和修订版本的内容运营人员。
- 未知——请补充正式生产用户画像、灰度对象和支持的客户端范围。

## 3. 主要用户故事

- 用户可以申请手机 OTP，通过手机 OTP 或 Facebook 凭据认证，刷新或撤销会话，并读取或更新自己的资料。
- 已认证的管理员可以登录、修改管理员密码，并使用受保护的 Operations 和 Platform 管理端点。
- 平台运营人员可以按权限管理功能开关、运行时配置、应用版本、公告、地区和导航菜单。
- 内容运营人员可以创建、修订、提交审核、审核和发布老挝语字符内容；客户端可以读取已发布的字母表。公开与管理端路由均已挂载到运行中的服务。
- 可通过命令行 Operations bootstrap 建立默认后台管理配置。

## 4. 范围

### 范围内（已观察到）

- Fastify 服务与启动过程、PostgreSQL 访问、事务、迁移兼容性、日志、健康端点、错误信封、请求上下文、JWT 认证和 Outbox Worker 支持。
- Identity、Operations、Platform、Content 模块代码及相关测试。
- 缓存、媒体、对象存储、翻译、TTS、OTP 和 Facebook 校验等能力的内存、模拟、控制台或不可用适配器。

### 范围外

- 未知——请补充。本回填不会推断路线图范围、客户端开放策略或商业行为。

## 5. 非功能现实（观察结果，不是约束）

- Fastify 分配请求 ID，使用响应信封和集中错误处理，并提供 `/health/live`、`/health/ready`。
- PostgreSQL 经由仓储和事务管理器访问；代码中存在 Outbox 发布 Worker。
- Identity/Operations 代码中存在 JWT 访问令牌、OTP 限制、登录限流和权限检查。
- 包提供类型检查、静态检查、单元类测试，以及单独执行的 PostgreSQL 集成测试。扫描中未发现覆盖率阈值、外部链路追踪后端或生产监控配置。

## 6. 待确认问题

- NEEDS-CLARIFICATION：`apps/backend` 应视为一个功能，还是应按已实现领域拆分为多个后续回填功能？
- NEEDS-CLARIFICATION：除字母管理外，Content 的其他能力何时进入实施与 API 挂载范围？
- NEEDS-CLARIFICATION：不可用或模拟的 Provider 适配器中，哪些是生产占位，哪些是有意的部署模式？
- NEEDS-CLARIFICATION：哪些路由属于公共契约，哪些仍需按 ADR-023 发布或完成一致性对齐？
- NEEDS-CLARIFICATION：生产环境需要哪些可观测性、告警、发布和事件响应控制？
