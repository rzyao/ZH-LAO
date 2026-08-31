# ZH-LAO V2 全量开发总计划

**建议文件名：`MASTER_DEVELOPMENT_PLAN.md`**

**状态：MASTER / FROZEN**

---

# 1. 计划目的

本计划是 ZH-LAO V2 从当前数据库基线开始，直到完整产品开发完成、全系统验证并具备正式上线条件的最高级开发计划。

后续所有：

- Application Foundation Plan
- Domain Implementation Plan
- Use Case Design
- API Design
- Backend Implementation Plan
- C 端实现计划
- B 端实现计划
- Integration Plan
- Test Plan
- Production Readiness Plan

都必须服从本计划。

任何单独 Phase 不得自行改变全局架构、Domain 边界和开发顺序。

---

# 2. 当前开发起点

当前已经完成：

```text
产品方案                     ✅
Domain 划分                  ✅
数据库设计                   ✅
PostgreSQL V2 Baseline       ✅ PASS
```

当前 PostgreSQL V2 Baseline 已具备：

```text
11 个业务 Schema
122 张业务表
2 张 Infrastructure 表
17 个 migration
Asset Infrastructure
Outbox Infrastructure
Content Revision
Identity Runtime Tables
完整数据库审计
Cross-Domain FK = 0
Logical UUID Violation = 0
Timestamp Violation = 0
Unresolved Blocker = 0
```

因此：

> 数据库 Baseline 从现在开始作为应用开发的冻结数据契约。

后续开发不再重新进行数据库主体设计。

如果实现过程中确实发现数据库必须调整：

必须通过新的增量 migration 和明确设计变更完成。

不得修改已经冻结执行的历史 migration。

---

# 3. 最终开发目标

最终要完成：

```text
Product Documentation
        ✅
Domain Architecture
        ✅
PostgreSQL Baseline
        ✅
        ↓
Application Foundation
        ↓
11 Domain Application Implementation
        ↓
Domain APIs
        ↓
C/B Client Integration
        ↓
Cross-Domain Integration
        ↓
Background Jobs / Events
        ↓
Security / Observability
        ↓
Full-System Testing
        ↓
Production Readiness
        ↓
Launch
```

最终系统必须达到：

1. 11 个 Domain 都有明确 application boundary。
2. 产品文档中的最终功能全部有实际实现。
3. API 从 Use Case 推导，而不是从数据库表生成 CRUD。
4. Repository 与 Domain ownership 一致。
5. 跨 Domain 引用使用 logical UUID。
6. 不存在非法跨 Domain physical FK。
7. 不存在一个 Domain 修改另一个 Domain canonical 数据。
8. C 端、B 端和后端使用统一稳定的 API Contract。
9. Outbox、Asset、事务、日志、错误、测试都有统一基础设施。
10. 核心业务有完整 integration / E2E 测试。
11. 项目可以在干净环境中完整部署和运行。
12. 达到 Production Readiness Gate 后才允许正式上线。

---

# 4. 总开发原则

## DEV-001 — 产品文档是功能来源

功能是否存在、用户如何使用、业务规则是什么：

优先读取最终产品文档。

不得根据当前代码中“已经有什么”决定产品应该有什么。

---

# 5. DEV-002 — Database Baseline 是数据契约

数据库字段、约束、Domain ownership：

优先使用：

```text
Frozen Physical Contracts
↓
V2 Migrations
↓
Expected Schema
↓
Final Domain Database Documentation
```

应用实现必须适配数据库契约。

---

# 6. DEV-003 — 不按数据库表设计 API

禁止：

```text
一张表
=
一个 CRUD Controller
```

正确顺序：

```text
Product Requirement
↓
Use Case
↓
Application Service
↓
API Contract
↓
Domain Logic / Repository
↓
Database
```

---

# 7. DEV-004 — 一次只推进一个正式 Phase

一个 Phase 必须：

```text
Plan
↓
Review
↓
Implement
↓
Test
↓
Audit
↓
Report
↓
Exit Gate
```

通过以后才能进入下一 Phase。

---

# 8. DEV-005 — 每个 Phase 必须先有详细分计划

禁止：

> “直接开始写代码，遇到问题再说。”

每个 Phase 在实施前必须生成：

```text
<PHASE>_IMPLEMENTATION_PLAN.md
```

Domain Phase 还必须包含：

```text
<DOMAIN>_USE_CASES.md
<DOMAIN>_API.md
```

并且必须按“19A. Admin 与 Mobile 客户端开发策略”说明该 Domain 的 Admin 新写范围、Mobile `REUSE` / `REFACTOR` / `REWRITE` 决策，以及 Domain E2E 客户端验收范围。

需要复杂状态机的 Domain：

额外产生：

```text
<DOMAIN>_WORKFLOWS.md
```

---

# 9. DEV-006 — 分计划只设计本 Phase

制定 Content Plan 时：

不得顺便详细设计 Learning。

制定 Chat Plan 时：

不得顺便重构 Social。

跨域部分只允许定义：

```text
Contract
Dependency
Event
Logical Reference
```

另一个 Domain 的内部实现由它自己的 Phase 决定。

---

# 10. DEV-007 — Canonical Owner 唯一

每一类核心事实只能有一个 Domain Owner。

```text
Identity            用户身份
Content             学习内容定义
Learning            用户学习状态
Audio Production    音频生产流程
Social              社交资料与关系
Chat                会话与消息
Commerce            商品、订单、支付、钱包
Rewards             奖励资格与发放
Trust & Safety      举报和治理
Operations          运营人员与权限
Platform            平台运行配置
```

不得复制第二份 canonical fact。

---

# 11. DEV-008 — Repository 不越界

默认：

```text
Identity Repository
→ identity.*

Content Repository
→ content.*

Learning Repository
→ learning.*
```

不得创建：

```text
LearningRepository
→ SELECT / UPDATE content.*
```

这种隐式跨域 Repository。

---

# 12. DEV-009 — 跨 Domain 写入

Domain A 不允许直接修改 Domain B canonical table。

正确方式：

```text
Application Contract

或

Outbox Event → Consumer
```

---

# 13. DEV-010 — 跨 Domain Read

默认优先：

```text
Owner Application Service
Read Contract
Read Adapter
Read Model
```

如确实需要跨 Domain DB 查询：

必须在 Phase Plan 中明确记录为：

`EXPLICIT CROSS-DOMAIN READ`

并解释原因。

---

# 14. DEV-011 — 跨 Domain ID

永远使用：

```text
stable logical UUID
```

禁止跨 Domain 使用：

```text
internal BIGINT PK
```

---

# 15. DEV-012 — 事务边界

普通业务事务：

> 尽可能限制在单个 Domain。

跨 Domain 的最终一致性优先：

```text
Local Transaction
+
Outbox
+
Consumer
+
Idempotency
```

而不是巨型跨域 transaction。

---

# 16. DEV-013 — Outbox

可靠跨域事件：

```text
Domain canonical write
+
system_outbox_events
```

必须在同一事务完成。

---

# 17. DEV-014 — Asset

任何：

- 图片
- 音频
- moderation evidence file
- 上传文件

物理文件 canonical metadata 归：

```text
infrastructure.assets
```

Domain 保存：

```text
asset_id
```

及自己的业务事实。

---

# 18. DEV-015 — 不过早设计全部 API

API 采用：

> Domain-by-Domain Design。

不要在 Foundation 阶段一次设计完整项目数百个 endpoint。

每个 Domain 开始时：

```text
Use Cases
↓
API
↓
Implementation
```

---

# 19. DEV-016 — 不过早实现客户端

某个业务能力的后端 contract 尚未稳定：

不开始对应大规模 C/B 客户端实现。

推荐：

```text
Use Case Frozen
↓
API Frozen
↓
Backend Functional
↓
API Integration Test
↓
Client Implementation
```

---

# 19A. Admin 与 Mobile 客户端开发策略

**状态：FROZEN / 全局规则**

本章节属于 ZH-LAO V2 的全局客户端规则。后续任何 Phase、Domain Implementation Plan、Admin Implementation Plan、Mobile Integration Plan 均不得擅自改变本章节确定的客户端策略、技术栈或 UI 基线。

## 19A.1 总体策略

```text
Backend        → V2 全新实现
Database       → PostgreSQL V2 全新实现
Admin          → Greenfield Rewrite / 全新重写
Mobile         → UI/UX 优先复用；V2 数据与业务接入层重建
```

不得因为 Backend 和 Database 全新设计而机械地重写已经可复用的 Mobile UI/UX；也不得因为 Mobile 页面可以复用而继续沿用旧的数据、认证或业务接入架构。

## 19A.2 Admin 最终策略与技术栈

Admin 必须围绕 V2 Domain 架构、Operations / RBAC、Content、Audio Production、Trust & Safety、Commerce、Rewards 与 Platform 能力全新实现。旧 Admin 的信息架构不得反向约束 V2。

Admin 是内部桌面优先 SPA，默认架构为：

```text
Admin Browser SPA
        ↓
V2 HTTP / Realtime API
        ↓
Application Service
        ↓
Domain
        ↓
PostgreSQL V2
```

当前不采用 Next.js 作为 Admin 主框架；不得为 Admin 当前不需要的 SSR / SEO 能力增加额外复杂度。

Admin 技术栈固定为：

```text
React 19 + TypeScript
Vite 8
TanStack Router
TanStack Query
TanStack Table
shadcn/ui + Base UI + Tailwind CSS v4
React Hook Form + Zod
Lucide
Vitest + Testing Library + Playwright
```

TanStack Router 统一承担 Route、Path Params、Search Params、筛选、分页与 Tab URL State。重要列表状态必须可通过 URL 恢复、分享与浏览器前进/后退；例如：

```text
/content/words?status=published&page=2
/audio/tasks?status=pending&producer=<id>
/trust/cases?priority=high
/commerce/orders?status=paid
```

TanStack Query 统一承担服务端 Query、Mutation、Cache、Retry 与 Invalidation。不得用临时本地状态替代可缓存的服务端状态；仅短暂、纯 UI 的交互状态保留在 React local state，确有跨页面需求时才引入专门的 local UI state store。

## 19A.3 Mobile 复用与 V2 重建边界

Mobile 按页面和功能逐项标注并执行 `REUSE`、`REFACTOR` 或 `REWRITE`：

- `REUSE`：保留视觉 UI/UX 与无 V2 耦合的展示组件；
- `REFACTOR`：保留页面结构或交互，替换 V2 数据接入与业务编排；
- `REWRITE`：旧设计无法满足 V2 Use Case、权限、状态或体验要求时重写。

无论上述分类如何，以下能力必须按 V2 重建，不得直接沿用旧实现：

```text
API Client
DTO / Types
Auth / Session
Domain Hooks
Server State / Cache
Error Handling
Pagination
Asset / Upload
Realtime Chat
Feature Flags
```

Mobile 对 V2 的 API、错误格式、UUID、日期时间、分页、认证、权限与 Feature Flag 解释必须与 Admin 一致。

## 19A.4 Admin UI 风格与信息架构

UI 风格固定为 **Rhea-inspired Compact Admin**：简洁、现代、专业、高信息密度、弱装饰、强层级、桌面优先、工作流优先。

具体规则：

- Sidebar 必须按 Domain 分组，使用 V2 Domain 名称和职责组织导航；不得按旧 Admin 页面历史或零散功能堆叠。
- 页面模式统一为 `List`、`Detail`、`Edit`、`Workbench`。普通资源使用 List / Detail / Edit；审核、生产、处理队列等复杂流程使用 Workbench。
- 列表页使用 TanStack Table 的统一 DataTable 基线：稳定列定义、服务端分页/排序/筛选、URL 同步、列可见性与 loading / empty / error 状态一致；不得每个 Domain 自行实现不兼容的列表范式。
- 颜色以中性基础色与有限语义色为主。颜色仅表达层级、操作重点与业务状态；不得以大面积渐变、装饰色或卡片堆叠替代信息层级。所有状态颜色必须同时有文本或图标标签，不得只依赖颜色。
- Dark Mode 必须从 Foundation 起由 Tailwind CSS v4 token / CSS variables 支持；同一语义 token 在 Light/Dark 模式下保持一致含义，组件不得硬编码破坏主题的颜色。
- 表单统一采用 React Hook Form + Zod；读写权限、禁用原因、验证错误、提交中与服务端错误必须在统一交互模型中呈现。
- Admin 和 Mobile 均以 V2 统一的错误模型、权限模型、资产模型、分页模型、实时事件模型及 Feature Flag 为唯一来源；禁止各 Domain 在客户端自行解释 contract。

## 19A.5 Domain Phase 客户端完成定义

每个 Domain Phase 的客户端工作不得延后至最后统一补做。对应 Backend contract 冻结、Backend Functional 与 API Integration Test 通过后，必须在该 Domain Phase 内同步完成：

```text
Backend
↓
Admin（新写）
↓
Mobile（REUSE / REFACTOR / REWRITE）
↓
Domain E2E
```

Domain Exit Gate 的客户端部分必须验证该 Domain 的授权、错误、分页、资产/上传、实时能力与 Feature Flag（适用时），并通过相应的 Admin、Mobile 与跨端 Domain E2E。PHASE 14 仅负责跨 Domain 客户端一致性、遗留集成与完整收口，不得成为推迟单个 Domain 客户端交付的理由。

---

# 20. DEV-017 — 不允许自动进入下一 Phase

任何负责实施的 AI：

完成当前 Phase 后必须停止。

只提交：

```text
Implementation Report
Test Results
Exit Gate
Remaining Issues
```

等待下一条明确指令。

---

# 21. 开发层次

整体分成五个 Layer。

```text
Layer A
Application Foundation

Layer B
Domain Implementation

Layer C
Cross-Domain Integration

Layer D
Full Product Validation

Layer E
Production Readiness
```

---

# 22. 全量开发 Phase

正式 Phase 固定如下：

```text
PHASE 0   PostgreSQL V2 Baseline             ✅ COMPLETE

PHASE 1   Application Foundation

PHASE 2   Identity Domain

PHASE 3   Platform Domain

PHASE 4   Operations Domain

PHASE 5   Content Domain

PHASE 6   Learning Domain

PHASE 7   Audio Production Domain

PHASE 8   Social Domain

PHASE 9   Chat Domain

PHASE 10  Commerce Domain

PHASE 11  Rewards Domain

PHASE 12  Trust & Safety Domain

PHASE 13  Cross-Domain Integration

PHASE 14  Complete Client Integration

PHASE 15  Full-System Validation

PHASE 16  Production Readiness

PHASE 17  Launch
```

---

# 23. 为什么采用这个顺序

核心依赖：

```text
Identity
 ├── Learning
 ├── Social
 ├── Chat
 ├── Commerce
 └── Trust
```

内容链路：

```text
Content
 ├── Learning
 └── Audio Production
```

管理链路：

```text
Identity
↓
Operations
↓
Content / Audio Administration
```

社交链路：

```text
Identity
↓
Social
↓
Chat
↓
Commerce
```

治理链路：

```text
Identity
Social
Chat
Commerce
   ↓
Trust & Safety
```

因此 Domain 实施顺序必须尽量使依赖方在被依赖方之后开发。

---

# 24. PHASE 0 — PostgreSQL Baseline

状态：

```text
COMPLETE
PASS
```

后续仅维护。

所有新增数据库变更继续要求：

```text
Fresh DB Migration PASS
Illegal Cross-Domain FK = 0
No PK Table = 0
Logical UUID Violation = 0
Timestamp Violation = 0
Expected Schema PASS
```

---

# 25. PHASE 1 — Application Foundation

这是当前唯一下一阶段。

本 Phase：

**不实现具体业务 Domain 功能。**

---

# 26. Foundation 必须解决

至少包括：

```text
Project Application Structure
Configuration
Environment
PostgreSQL Connection Pool
Transaction Infrastructure
Repository Conventions
UUID
Outbox Writer / Publisher Foundation
Asset Infrastructure Access
Logging
Error Handling
API Foundation
Authentication Infrastructure Skeleton
Background Job Foundation
Testing Infrastructure
Integration Test DB
Migration Integration
Health / Readiness
```

---

# 27. Foundation 不应该做

禁止：

```text
注册功能
登录业务逻辑
课程 CRUD
学习进度
TTS 业务
Social
Chat
Payment
Reward
Moderation
```

这些属于之后 Domain Phase。

---

# 28. Foundation Exit Gate

至少：

```text
Application boots
V2 PostgreSQL connection PASS
Connection pool PASS
Transaction integration test PASS
Repository test pattern PASS
UUID contract PASS
Outbox integration test PASS
Asset infrastructure access PASS
Unified error handling PASS
Logging baseline PASS
Test DB automation PASS
Fresh DB test PASS
Health/readiness PASS
```

达到后：

```text
FOUNDATION_GATE = PASS
```

才允许进入 Identity。

---

# 29. PHASE 2 — Identity Domain

先制定：

```text
IDENTITY_IMPLEMENTATION_PLAN.md
IDENTITY_USE_CASES.md
IDENTITY_API.md
```

---

# 30. Identity Use Case 范围

至少审核：

```text
Register
Login
Logout
Request OTP
Verify OTP
Refresh Session
Revoke Session
Device Registration
Device Revocation
Password / Credential Management
Identity State
Account Status
```

具体以最终 Identity 产品文档为准。

---

# 31. Identity 实施顺序

```text
Use Cases
↓
API Contract
↓
Domain/Application Model
↓
Repository
↓
Authentication Services
↓
Sessions / OTP / Devices
↓
HTTP/API
↓
Client Integration
↓
Integration Tests
↓
Security Tests
```

---

# 32. Identity Exit Gate

必须确保核心身份链路可完整运行。

例如：

```text
Register
→ Verification
→ Login
→ Session
→ Refresh
→ Logout
```

以及：

```text
Revoke Session
Device Management
Invalid Credential Handling
Expired OTP
Expired Session
```

---

# 33. PHASE 3 — Platform Domain

先设计：

```text
PLATFORM_IMPLEMENTATION_PLAN.md
PLATFORM_USE_CASES.md
PLATFORM_API.md
```

范围：

```text
Feature Flags
Feature Flag Overrides
Runtime Config
App Versions
Announcements
Regions
```

Platform 优先较早实现，因为之后可以支持：

```text
Feature Rollout
Runtime Switch
Version Control
Region Behavior
```

---

# 34. PHASE 4 — Operations Domain

设计：

```text
OPERATIONS_IMPLEMENTATION_PLAN.md
OPERATIONS_USE_CASES.md
OPERATIONS_API.md
```

范围：

```text
Operators
Roles
Operator Roles
Permissions
Audit Logs
B-side Authorization
```

Operations 完成以后：

Content / Audio 等 B 端功能使用统一 Operator / RBAC。

---

# 35. PHASE 5 — Content Domain

这是学习产品第一个核心业务 Domain。

必须先完成：

```text
CONTENT_IMPLEMENTATION_PLAN.md
CONTENT_USE_CASES.md
CONTENT_API.md
```

---

# 36. Content 核心范围

```text
Curriculum
Course
Unit
Lesson
Vocabulary
Dictionary / Lexical
Words
Phrases
Sentences
Grammar
Exercises
Questions
Answers
Content Relations
Revision
Publishing
```

最终以 Content 产品文档和 32 张实际 V2 表为准。

---

# 37. Content API 分类

不得全部混在一起。

至少区分：

```text
Public/C-side Read APIs
B-side Management APIs
Internal Contracts
```

例如 C 端：

```text
课程目录
Lesson Content
Dictionary Lookup
Content Detail
```

B 端：

```text
Create
Edit
Revision
Publish
Archive
Content Relationship Management
```

---

# 38. Content Exit Gate

至少保证：

```text
Create content
Edit content
Revision
Publish
Read published content
Hierarchy navigation
Logical UUID references
B-side RBAC
```

完整可运行。

---

# 39. PHASE 6 — Learning Domain

依赖：

```text
Identity
Content
```

必须先设计：

```text
LEARNING_IMPLEMENTATION_PLAN.md
LEARNING_USE_CASES.md
LEARNING_API.md
```

---

# 40. Learning 核心范围

```text
Enrollment
Learning Progress
Lesson Progress
Attempts
Answers
Mastery
Review
Spaced Repetition
Learning Sessions
Learning Statistics
```

严格保持：

> Learning = 用户学得怎么样。

---

# 41. Learning 禁止重新拥有

```text
Course Definition
Lesson Definition
Word Definition
TTS Jobs
Audio Production
```

---

# 42. Learning Exit Gate

核心 Golden Flow：

```text
User
→ Select Content
→ Start Lesson
→ Submit Answer
→ Record Attempt
→ Update Progress
→ Update Mastery
→ Schedule Review
→ Complete Lesson
```

必须端到端通过。

---

# 43. PHASE 7 — Audio Production Domain

依赖：

```text
Content
Operations
Asset Infrastructure
```

先产生：

```text
AUDIO_IMPLEMENTATION_PLAN.md
AUDIO_USE_CASES.md
AUDIO_API.md
AUDIO_WORKFLOWS.md
```

---

# 44. Audio 核心流程

```text
Audio Slot
↓
Task
↓
Production Attempt
↓
Asset
↓
Audio Asset Version
↓
Review
↓
Publish
```

以及：

```text
Batch
Preset
Task Event
Retry
Failure
```

---

# 45. Audio C/B 边界

Audio Production 主要属于：

```text
B-side / Internal Workflow
```

C 端通常只需要：

```text
resolve published audio
play asset
```

不要把生产 API 暴露给 C 端。

---

# 46. Audio Exit Gate

必须通过：

```text
Content entity
→ Audio Slot
→ Task
→ Production
→ Asset
→ Review
→ Publish
→ Client consumption
```

完整链路。

---

# 47. PHASE 8 — Social Domain

先设计：

```text
SOCIAL_IMPLEMENTATION_PLAN.md
SOCIAL_USE_CASES.md
SOCIAL_API.md
```

范围以最终 19 表方案为准。

包括：

```text
Profile
Photos
Prompts
Discovery
Relationships
Follow
Block
Posts
Comments
Likes
Feed Facts
```

举报入口最终写 Trust，不拥有 `social_reports`。

---

# 48. Social Exit Gate

至少验证：

```text
Create profile
Edit profile
Discover user
Relationship operations
Block
Post
Comment
Like
Feed/query
```

以及 Block 对其他 Social 能力的影响。

---

# 49. PHASE 9 — Chat Domain

依赖：

```text
Identity
Social
Asset Infrastructure
```

先设计：

```text
CHAT_IMPLEMENTATION_PLAN.md
CHAT_USE_CASES.md
CHAT_API.md
CHAT_WORKFLOWS.md
```

---

# 50. Chat 最终模型

固定最终 7 表。

范围：

```text
Conversation
Direct Conversation
Members
User State
Message
Text
Image
```

不得重新加入已否决模型。

---

# 51. Chat 实时能力

本 Phase 必须明确：

```text
HTTP API
Realtime Transport
Connection Lifecycle
Message Delivery
Reconnect
Pagination
Ordering
Idempotent Send
```

具体 WebSocket / SSE 等技术在 Chat 分计划裁决。

---

# 52. Chat Exit Gate

至少：

```text
Create/get conversation
Send text
Send image
Receive message
Reconnect
History pagination
Member state
Blocked relationship handling
```

通过。

---

# 53. PHASE 10 — Commerce Domain

先设计：

```text
COMMERCE_IMPLEMENTATION_PLAN.md
COMMERCE_USE_CASES.md
COMMERCE_API.md
COMMERCE_WORKFLOWS.md
```

范围按照最终 16 表。

---

# 54. Commerce 开发原则

财务事实必须高度严格。

重点：

```text
Products
Prices
Coin Packs
Gifts
Orders
Fulfillment
Payments
Payment Events
Wallet
Wallet Ledger
Adjustments
Reversals
Refund
Recovery
```

---

# 55. Commerce 幂等

必须明确：

```text
Create Order
Payment Callback
Payment Event
Wallet Credit
Gift Send
Refund
```

各自的 idempotency strategy。

---

# 56. Commerce Exit Gate

不能只验证 API 200。

必须核验：

```text
Order total
Payment status
Wallet balance
Ledger sum
Refund
Reversal
Idempotency
Failure recovery
```

---

# 57. PHASE 11 — Rewards Domain

先设计：

```text
REWARDS_IMPLEMENTATION_PLAN.md
REWARDS_USE_CASES.md
REWARDS_API.md
```

核心：

```text
Programs
Rules
Events
Grants
Deliveries
```

---

# 58. Rewards 事件驱动

重点检查：

```text
source_domain
source_event_id
dedupe
grant uniqueness
delivery idempotency
```

Rewards 不直接成为钱包 canonical owner。

---

# 59. PHASE 12 — Trust & Safety Domain

依赖：

```text
Identity
Social
Chat
Commerce
Asset Infrastructure
Operations
```

因此在后期实现。

先设计：

```text
TRUST_IMPLEMENTATION_PLAN.md
TRUST_USE_CASES.md
TRUST_API.md
TRUST_WORKFLOWS.md
```

---

# 60. Trust 核心流程

```text
Report
↓
Moderation Case
↓
Evidence
↓
Decision
↓
Enforcement
↓
Appeal
```

`trust.reports` 是唯一 canonical report fact。

---

# 61. PHASE 13 — Cross-Domain Integration

所有 Domain 自身功能通过 Gate 后：

才开始全局集成。

这一步不是重新开发 Domain。

而是验证 Contract。

---

# 62. 必须验证的关键依赖

```text
Identity → Learning
Identity → Social
Identity → Chat

Content → Learning
Content → Audio

Operations → Content
Operations → Audio
Operations → Trust

Social → Chat

Chat → Commerce

Commerce → Rewards

Social → Trust
Chat → Trust
Commerce → Trust
```

---

# 63. Cross-Domain Audit

检查：

```text
Logical UUID
Canonical Ownership
Unauthorized Writes
Cross-Domain Read
Events
Outbox
Consumer Idempotency
Retry
Failure Handling
```

最终要求：

```text
Illegal Cross-Domain FK = 0
Cross-Domain Internal BIGINT = 0
Unauthorized Canonical Writes = 0
Unknown Integration Contract = 0
```

---

# 64. PHASE 14 — Complete Client Integration

每个 Domain 的 Admin 与 Mobile 客户端交付及 Domain E2E 必须已经在各自 Domain Phase 内完成。本 Phase 只做跨 Domain 客户端一致性、遗留集成与完整收口，不得替代任何 Domain Phase 的客户端交付。

覆盖：

```text
C-side
B-side
Authentication
Navigation
API Client
Global State
Loading
Error
Permission
Asset
Realtime
Feature Flags
```

---

# 65. C/B 一致性

必须确保：

```text
API contract
error format
pagination
UUID format
date/time format
auth
permissions
```

客户端不存在各 Domain 各自解释一套。

---

# 66. PHASE 15 — Full-System Validation

此阶段停止新增普通产品功能。

只做：

```text
Regression
Integration
E2E
Security
Performance
Data Integrity
Bug Fix
```

---

# 67. Golden Flows

至少冻结以下全系统 Golden Flow。

### Learning Flow

```text
Register
→ Login
→ Select Course
→ Start Lesson
→ Play Audio
→ Submit Answer
→ Progress
→ Review
```

### Social Flow

```text
Register
→ Profile
→ Discovery
→ Relationship
→ Chat
```

### Commerce Flow

```text
Product
→ Order
→ Payment
→ Wallet
→ Gift
→ Reward
```

### Moderation Flow

```text
Report
→ Case
→ Evidence
→ Decision
→ Enforcement
→ Appeal
```

### Operations Flow

```text
Operator Login
→ Permission
→ Content/Audio/Trust Operation
→ Audit Log
```

---

# 68. Security Validation

至少检查：

```text
Authentication
Authorization
Session
OTP
IDOR
Input Validation
Rate Limit
Upload
Asset Access
Payment Callback
Replay
Sensitive Logging
SQL Injection
Privilege Escalation
```

---

# 69. Performance Validation

重点检查真实产品关键路径：

```text
Course list
Lesson load
Learning submission
Audio resolve
Social discovery
Feed
Chat history
Message sending
Wallet
Admin content listing
```

分析：

```text
N+1
slow SQL
missing index
large payload
pagination
pool exhaustion
long transaction
outbox backlog
```

---

# 70. PHASE 16 — Production Readiness

这一阶段不继续开发普通业务需求。

目标：

> 判断系统是否已经具备上线条件。

---

# 71. Production Readiness 范围

至少：

```text
Production Config
Secrets
Database
Migration Process
Backup
Restore Test
Object Storage
Monitoring
Logging
Alerting
Health Check
Readiness Check
Rate Limits
Security Headers
CORS
Deployment
Rollback
Operational Runbook
```

---

# 72. Backup / Restore

必须实际验证：

```text
Backup
↓
Restore
↓
Application boots
↓
Critical data valid
```

只写“有备份”不算通过。

---

# 73. Deployment

必须能够：

```text
clean environment
↓
configure
↓
run migrations
↓
deploy application
↓
health check
↓
smoke test
```

步骤可重复。

---

# 74. PHASE 17 — Launch

只有全部 Gate 为 PASS：

才允许 Launch。

Launch 前生成：

```text
LAUNCH_PLAN.md
```

至少包含：

```text
deployment order
migration order
smoke tests
monitoring window
failure criteria
rollback procedure
responsible checklist
```

---

# 75. 每个 Phase 的统一执行流程

以后所有阶段都严格执行：

```text
STEP 1
读取 MASTER_DEVELOPMENT_PLAN

STEP 2
读取当前 Phase 权威产品/Domain/DB 文档

STEP 3
只审查当前 Phase 相关项目现状

STEP 4
生成详细 Implementation Plan

STEP 5
审核计划与范围

STEP 6
冻结 Use Cases

STEP 7
冻结 API / Contract

STEP 8
拆 Implementation Tasks

STEP 9
实施

STEP 10
Unit / Integration Tests

STEP 11
相关 Regression

STEP 12
Architecture / DB Audit

STEP 13
生成 Implementation Report

STEP 14
执行 Exit Gate

STEP 15
停止
```

不得自动执行 STEP 1 of next Phase。

---

# 76. Domain 分计划必须包含

所有 Domain Implementation Plan 至少包含：

```text
1. Scope
2. Non-Scope
3. Authority Sources
4. Current Project State
5. Product Requirements
6. Use Cases
7. Target Tables
8. Domain Model
9. Application Services
10. Repository Design
11. API Contract
12. C-side Requirements
13. B-side Requirements
14. Admin 新写范围与页面模式
15. Mobile REUSE / REFACTOR / REWRITE 决策
16. Domain E2E（Admin / Mobile / 跨端）
17. Cross-Domain Dependencies
18. Events
19. Transaction Boundaries
20. UUID Contracts
21. Asset Usage
22. Error Model
23. Permission Model
24. Logging
25. Test Plan
26. File Change Scope
27. Implementation Tasks
28. Risks
29. Rollback / Revert Strategy
30. Exit Gate
31. Forbidden Changes
```

---

# 77. 分计划任务粒度

Implementation Task 应尽量可以独立完成和测试。

推荐：

```text
T01 Repository
T02 Domain/Application Service
T03 API DTO
T04 API Endpoint
T05 Authorization
T06 Events
T07 Integration Test
T08 Client
...
```

不要写：

```text
T01 完成整个 Identity
```

这种无法控制的大任务。

---

# 78. API 文档统一要求

每个 endpoint 至少明确：

```text
Purpose
Method
Path
Authentication
Authorization
Path Params
Query
Request Body
Response
Error Codes
Idempotency
Pagination
Rate Limiting（如适用）
Use Case
```

---

# 79. API 命名规则

API 以资源和业务行为为中心。

禁止机械使用：

```text
/createSomething
/updateSomething
/deleteSomething
```

如果 REST 表达清楚：

优先标准 HTTP semantic。

复杂业务 action 才使用明确 action endpoint。

---

# 80. API Version

正式开发开始前：

Foundation Phase 必须明确 API version strategy。

例如：

```text
/api/v1
```

不要 Domain 各自决定版本方式。

---

# 81. Error Contract

Foundation 必须冻结统一 Error Contract。

所有 Domain 共享：

```text
error code
human message
details
request/trace id
```

Domain 可以拥有 Domain Error Code。

但 API envelope 统一。

---

# 82. Pagination Contract

Foundation 必须冻结：

```text
cursor
或
offset/page
```

的全局策略。

需要大数据流的：

```text
Chat
Feed
Ledger
Audit
```

优先评估 cursor pagination。

不得每个 Domain 一套完全不同的 pagination 格式。

---

# 83. Time Contract

API 时间：

统一 ISO 8601 + timezone。

数据库继续：

```text
TIMESTAMPTZ
```

客户端不得依赖服务器本地时区。

---

# 84. UUID Contract

所有 logical/public ID：

API 对外统一字符串形式 UUID。

客户端不应感知内部 BIGINT PK。

---

# 85. Test Pyramid

项目测试分层：

```text
Unit Tests

Repository Integration Tests

Domain Integration Tests

API Contract Tests

Cross-Domain Integration Tests

E2E Golden Flows
```

---

# 86. Repository 测试

Repository Tests 必须连接真实 PostgreSQL 测试库。

不要使用：

```text
SQLite
in-memory DB
```

模拟 PostgreSQL 行为。

---

# 87. Database Regression

任何 Phase 产生新 migration：

都必须重新执行：

```text
Fresh DB build
expected-schema
catalog audit
cross-domain FK
PK
UUID
timestamp
smoke constraints
```

---

# 88. 外部服务

涉及：

```text
TTS
Payment
Object Storage
Email/SMS
Push
```

必须提供：

```text
Adapter Interface
Production Adapter
Test/Fake Adapter
Timeout
Retry
Error Mapping
```

Domain Logic 不直接散落调用 SDK。

---

# 89. 后台任务

所有：

```text
Outbox Publisher
Audio Worker
Retry Worker
Cleanup
Scheduled Job
```

必须统一使用 Foundation 中确定的 Job Infrastructure。

不得每个 Domain 自己搭一套 worker framework。

---

# 90. 日志

禁止日志包含：

```text
password
OTP
raw session token
payment secret
authorization header
private credentials
```

核心操作日志至少包含：

```text
request id
domain
operation
entity logical id
result
error code
duration
```

按实际必要程度输出。

---

# 91. Observability

关键异步链路必须可以追踪：

```text
request
↓
domain operation
↓
outbox event
↓
consumer
↓
result
```

---

# 92. Git 开发规则

推荐每 Phase 使用：

```text
feature/v2-foundation
feature/v2-identity
feature/v2-platform
...
```

一个 Phase 内按任务提交。

不要一整个 Phase 只做一个巨型 commit。

---

# 93. 文档同步规则

代码完成不等于 Phase 完成。

如果实现最终 contract 与计划发生合法调整：

同步更新：

```text
Implementation Plan
Use Cases
API Documentation
Architecture Documentation
Implementation Report
```

不得出现代码已经变了但设计文档仍停在旧状态。

---

# 94. 实施报告

每个 Phase 完成后必须生成：

```text
<PHASE>_IMPLEMENTATION_REPORT.md
```

Domain 至少记录：

```text
Scope completed
Use Cases completed
APIs implemented
Tables used
Cross-domain contracts
Events
Client work
Admin / Mobile client strategy and Domain E2E result
Changed files
Tests
Database audit
Known limitations
Deferred work
Exit Gate
```

---

# 94A. Executable Spec Layer

新增或实质变更的 Domain/跨域契约必须遵守 [SPEC_SYSTEM](SPEC_SYSTEM.md)。现有 Design Package 仍是人类可读的完整语义来源；Executable Spec Layer 提供 Requirement ID、machine-readable contract reference、acceptance scenario、state machine 与 Requirement→implementation/test/gate evidence 的可验证追溯。

执行顺序补充为：

```text
Design：冻结 mandatory Requirement IDs、canonical spec、scenario/state machine
→ Design Gate：spec:check PASS（只证明设计结构）
→ Execution Brief：列 Required IDs、tests、machine checks
→ Implementation：更新 derived evidence
→ Domain Gate：独立执行 checks + traceability evidence + existing Gate conditions
```

不得将 checker 的结构成功、AI 文字结论或手工 `PASS` 字段当作 Implementation/Domain Gate PASS。未采用本层的历史 Domain 保持 `coverage = NOT_CLAIMED`，直到其正式 revision 接入。

---

# 95. Exit Gate 状态

统一只能使用：

```text
PASS

PASS_WITH_BLOCKERS

FAIL
```

如果下一 Phase 依赖当前 Phase：

只有：

```text
PASS
```

才允许继续。

---

# 96. Blocker 定义

真正 Blocker：

```text
Frozen spec conflict
Unknown canonical owner
Critical security problem
Cannot maintain data integrity
Undefined required cross-domain contract
Architecture prevents correct implementation
```

普通 Bug：

不是 specification blocker。

应该修复，不应该无限暂停规划。

---

# 97. Bug 处理

当前 Phase 发现与当前范围相关 Bug：

直接处理。

发现其他 Domain Bug：

记录：

```text
OUT_OF_SCOPE_FINDING
```

除非它阻塞当前 Phase，否则不要越界修复。

---

# 98. 技术债务

临时实现必须标记：

```text
TECH_DEBT
reason
owner phase
removal condition
```

不得用一句“以后优化”结束。

---

# 99. 禁止事项

整个开发周期禁止：

1. 重新进行无目标全仓架构重构。
2. 把数据库表直接映射成全部 CRUD API。
3. 一次同时开发多个未规划 Domain。
4. Domain Repository 直接修改其他 Domain。
5. 引用其他 Domain internal BIGINT。
6. 新建跨 Domain physical FK。
7. 修改已执行 PostgreSQL baseline migration。
8. 绕过 Application Service 从 Controller 直接写数据库。
9. 在业务 Domain 重复保存 Asset canonical metadata。
10. 将所有跨域业务塞进一个“Common Service”。
11. 提前设计全部项目 API。
12. 后端未稳定就大规模重做客户端。
13. 为未来可能功能提前增加大量抽象。
14. 因“架构更漂亮”增加当前产品不需要的微服务。
15. Phase 完成后 AI 自动进入下一阶段。

---

# 100. 文档目录建议

建议建立：

```text
docs/development/

MASTER_DEVELOPMENT_PLAN.md

00-database/
    DATABASE_BASELINE_REFERENCE.md

01-foundation/
    APPLICATION_FOUNDATION_PLAN.md
    APPLICATION_FOUNDATION_REPORT.md

02-identity/
    IDENTITY_IMPLEMENTATION_PLAN.md
    IDENTITY_USE_CASES.md
    IDENTITY_API.md
    IDENTITY_IMPLEMENTATION_REPORT.md

03-platform/
    PLATFORM_IMPLEMENTATION_PLAN.md
    PLATFORM_USE_CASES.md
    PLATFORM_API.md
    PLATFORM_IMPLEMENTATION_REPORT.md

04-operations/
    OPERATIONS_IMPLEMENTATION_PLAN.md
    OPERATIONS_USE_CASES.md
    OPERATIONS_API.md
    OPERATIONS_IMPLEMENTATION_REPORT.md

05-content/
    CONTENT_IMPLEMENTATION_PLAN.md
    CONTENT_USE_CASES.md
    CONTENT_API.md
    CONTENT_IMPLEMENTATION_REPORT.md

06-learning/
    LEARNING_IMPLEMENTATION_PLAN.md
    LEARNING_USE_CASES.md
    LEARNING_API.md
    LEARNING_IMPLEMENTATION_REPORT.md

07-audio/
    AUDIO_IMPLEMENTATION_PLAN.md
    AUDIO_USE_CASES.md
    AUDIO_API.md
    AUDIO_WORKFLOWS.md
    AUDIO_IMPLEMENTATION_REPORT.md

08-social/
    SOCIAL_IMPLEMENTATION_PLAN.md
    SOCIAL_USE_CASES.md
    SOCIAL_API.md
    SOCIAL_IMPLEMENTATION_REPORT.md

09-chat/
    CHAT_IMPLEMENTATION_PLAN.md
    CHAT_USE_CASES.md
    CHAT_API.md
    CHAT_WORKFLOWS.md
    CHAT_IMPLEMENTATION_REPORT.md

10-commerce/
    COMMERCE_IMPLEMENTATION_PLAN.md
    COMMERCE_USE_CASES.md
    COMMERCE_API.md
    COMMERCE_WORKFLOWS.md
    COMMERCE_IMPLEMENTATION_REPORT.md

11-rewards/
    REWARDS_IMPLEMENTATION_PLAN.md
    REWARDS_USE_CASES.md
    REWARDS_API.md
    REWARDS_IMPLEMENTATION_REPORT.md

12-trust/
    TRUST_IMPLEMENTATION_PLAN.md
    TRUST_USE_CASES.md
    TRUST_API.md
    TRUST_WORKFLOWS.md
    TRUST_IMPLEMENTATION_REPORT.md

13-integration/
    CROSS_DOMAIN_INTEGRATION_PLAN.md
    CROSS_DOMAIN_INTEGRATION_REPORT.md

14-client/
    CLIENT_INTEGRATION_PLAN.md
    CLIENT_INTEGRATION_REPORT.md

15-validation/
    FULL_SYSTEM_VALIDATION_PLAN.md
    FULL_SYSTEM_VALIDATION_REPORT.md

16-production/
    PRODUCTION_READINESS_PLAN.md
    PRODUCTION_READINESS_REPORT.md

17-launch/
    LAUNCH_PLAN.md
    LAUNCH_REPORT.md
```

---

# 101. 总进度表

| Phase | 当前状态 | 进入条件 | Exit Gate |
|---|---|---|---|
| PostgreSQL Baseline | COMPLETE | — | PASS |
| Application Foundation | NEXT | DB Baseline PASS | Foundation PASS |
| Identity | NOT_STARTED | Foundation PASS | Identity PASS |
| Platform | NOT_STARTED | Foundation PASS | Platform PASS |
| Operations | NOT_STARTED | Identity + Platform基础能力可用 | Operations PASS |
| Content | NOT_STARTED | Operations PASS | Content PASS |
| Learning | NOT_STARTED | Identity + Content PASS | Learning PASS |
| Audio | NOT_STARTED | Content + Operations PASS | Audio PASS |
| Social | NOT_STARTED | Identity PASS | Social PASS |
| Chat | NOT_STARTED | Identity + Social PASS | Chat PASS |
| Commerce | NOT_STARTED | Identity + Chat所需契约 PASS | Commerce PASS |
| Rewards | NOT_STARTED | Commerce Event Contract PASS | Rewards PASS |
| Trust | NOT_STARTED | Identity + Social + Chat + Commerce契约 PASS | Trust PASS |
| Cross-Domain Integration | NOT_STARTED | 11 Domain PASS | Integration PASS |
| Client Integration | NOT_STARTED | Required APIs PASS | Client PASS |
| Full-System Validation | NOT_STARTED | Product Feature Complete | Validation PASS |
| Production Readiness | NOT_STARTED | Validation PASS | Production PASS |
| Launch | NOT_STARTED | All Gates PASS | LAUNCHED |

---

# 102. 当前下一步

现在唯一应该开始的是：

# `PHASE 1 — Application Foundation`

第一步不是直接实施。

先制定：

```text
APPLICATION_FOUNDATION_PLAN.md
```

该计划必须基于真实 ZH-LAO 仓库现状，专项调查：

```text
现有项目目录
后端框架
数据库连接
PostgreSQL client
事务
Repository / DAO
UUID
Configuration
Environment
API framework
Middleware
Authentication foundation
Outbox
Asset
Background jobs
Logging
Errors
Testing
Integration DB
Migration tooling
Health checks
```

然后明确：

```text
现状
目标
保留什么
新增什么
替换什么
具体文件范围
Task 顺序
测试
风险
Exit Gate
```

---

# 103. Phase 1 完成以后

只有：

```text
APPLICATION_FOUNDATION = PASS
```

才能进入：

```text
PHASE 2 — Identity
```

Identity 仍然先制定详细分计划。

不是直接开发。

---

# 104. Master Plan 变更规则

本计划确认以后视为：

`FROZEN MASTER DEVELOPMENT PLAN`

普通 Phase 可以调整自己的实现细节。

但以下内容不得由单个 Phase 偷偷修改：

```text
Domain Boundary
Canonical Ownership
Database Authority
Cross-Domain UUID Rule
Cross-Domain FK Rule
Phase Gate System
总体开发顺序
API-from-Use-Case Principle
```

需要修改时必须产生：

```text
MASTER PLAN REVISION
```

说明：

```text
修改内容
原因
影响 Phase
兼容性
新规则
```

---

# 105. 整个开发过程的一句话原则

> **产品定义需求，Domain 定义边界，数据库定义数据契约，Use Case 定义应用行为，API 只是入口；先计划、后实现，一次一域，完成即测，通过 Gate 才进入下一阶段，直到整个产品达到上线标准。**
