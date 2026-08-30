# ZH-LAO V2 — Mobile Foundation Plan

**文件名：`MOBILE_FOUNDATION_PLAN.md`**  
**Phase：Mobile Foundation**  
**状态：PLANNING**  
**上级计划：`MASTER_DEVELOPMENT_PLAN.md`**  
**技术依据：`MOBILE_TECH_STACK.md`**

---

# 1. 目标

本阶段用于建立 ZH-LAO V2 Mobile 的统一应用基础。

目标不是重新设计和重写现有 Mobile UI。

目标是：

> **建立新的 Expo SDK 57 V2 Mobile Foundation，在保留成熟 UI/UX、Theme、Navigation 和通用组件的同时，重建 V2 API、Auth、Storage、Audio、Asset、Realtime Skeleton 和 Testing Infrastructure。**

本阶段完成后，后续 Identity、Content、Learning、Social、Chat、Commerce 等 Domain 可以直接基于统一 Mobile Foundation 接入，而无需再次重建客户端底层基础。

---

# 2. 当前前提

已经确定：

```text
PostgreSQL V2 Baseline        PASS
Application Foundation       PASS
Admin Foundation             PASS
Mobile Tech Stack            FROZEN
```

当前 Backend Domain 主线仍独立推进。

Mobile Foundation 可以与尚未完成的业务 Domain 并行。

但本阶段不得猜测尚未冻结的 Domain API。

---

# 3. Foundation 总原则

Mobile Foundation 必须遵循：

```text
Reuse Product UI
Rebuild V2 Infrastructure
Avoid Premature Business Integration
```

即：

```text
现有 UI / UX
→ 优先保留

现有 Theme / Typography
→ 优先保留

现有 React Navigation
→ 优先保留

现有 Screens
→ REUSE / REFACTOR / REWRITE 分类

API
→ 重建

Auth
→ 重建

Sensitive Storage
→ 重建

Audio
→ 重建

Asset
→ 新建 V2 Foundation

Realtime
→ 只建 Skeleton

Testing
→ 重建
```

---

# 4. 冻结技术栈

必须采用：

```text
Expo SDK 57
React Native 0.86
React 19.2
TypeScript

React Navigation 7

TanStack Query 5

NativeWind 4
Tailwind CSS 3.4

React Hook Form
Zod

Axios

Expo SecureStore
AsyncStorage

expo-audio
expo-image
expo-file-system

Reanimated 4
Lucide React Native

React Native Testing Library
Maestro
```

未经 Mobile Technology Revision 不得更换核心路线。

---

# 5. Scope

本阶段允许完成：

```text
New Expo 57 Application Skeleton
Workspace Integration

Theme Migration
Typography Migration
Assets Migration
Fonts Migration

Navigation Foundation
Existing Navigation Migration

Shared UI Component Migration

TanStack Query Foundation
V2 HTTP Client Foundation
Error Foundation

UUID Contract
Time Contract
Pagination Contract

Auth State Skeleton
Secure Token Storage
Session Bootstrap Skeleton

Audio Foundation
Recording Foundation

Asset Foundation
File/Image Foundation

Realtime Skeleton

Environment Config
Logging

Form Foundation
Validation Foundation

Testing Foundation
Maestro Smoke

REUSE / REFACTOR / REWRITE Audit

Mobile Foundation Report
Development Progress Update
```

---

# 6. Strict Non-Scope

本阶段禁止实现真实 Domain 业务功能。

禁止接入真实：

```text
Identity Login API
OTP API
Refresh API
Session Management API

Content API
Learning Progress API

Social API
Chat API

Commerce API
Rewards API

Trust API
```

即使现有 Mobile 中已经有这些 API：

也不得直接作为 V2 接口继续使用。

---

# 7. 不复制整个旧 Mobile 作为新项目基底

禁止：

```text
copy mobile/
↓
upgrade dependencies
↓
fix errors
↓
keep old API
```

正确做法：

```text
New Expo 57 Skeleton
↓
Foundation Ready
↓
Migrate reusable assets/theme/components
↓
Migrate navigation
↓
Migrate screens incrementally
↓
Reconnect Domain APIs later
```

---

# 8. 推荐目录

建议：

```text
apps/mobile/
├── src/
│   ├── app/
│   │   ├── bootstrap/
│   │   ├── config/
│   │   └── providers/
│   │
│   ├── navigation/
│   │
│   ├── api/
│   │   ├── client/
│   │   ├── errors/
│   │   └── contracts/
│   │
│   ├── auth/
│   │   ├── context/
│   │   ├── session/
│   │   └── storage/
│   │
│   ├── storage/
│   │
│   ├── audio/
│   │
│   ├── assets/
│   │
│   ├── realtime/
│   │
│   ├── features/
│   │
│   ├── components/
│   │
│   ├── screens/
│   │
│   ├── theme/
│   │
│   ├── hooks/
│   │
│   ├── i18n/
│   │
│   └── utils/
│
├── assets/
├── tests/
├── e2e/
├── app.json
├── package.json
├── tsconfig.json
├── babel.config.js
└── README.md
```

可以根据 Monorepo 实际结构微调。

但职责边界必须保持。

---

# 9. REUSE / REFACTOR / REWRITE Matrix

Foundation 必须建立正式迁移分类表。

每个现有 Screen / Component 至少标记：

```text
REUSE
REFACTOR
REWRITE
DEFER
```

---

# 10. REUSE 定义

满足以下条件：

```text
UI 与最终产品一致
无旧 API 强耦合
无旧 Backend Contract 强耦合
无明显架构问题
```

则：

```text
REUSE
```

主要适用于：

```text
Fonts
Assets
Pure Layout
Typography
Theme Tokens
Pure UI Components
Animations
```

---

# 11. REFACTOR 定义

页面 UI 基本可保留，但包含：

```text
old API
old IDs
old business hooks
old auth assumptions
old storage
```

则：

```text
REFACTOR
```

通常大部分 Screen 属于这一类。

---

# 12. REWRITE 定义

只有以下情况才允许 Rewrite：

```text
UI 已不符合最终产品
旧结构严重阻碍 V2
业务模型已经根本变化
组件无法合理拆解
```

禁止因为“新项目”就自动 Rewrite。

---

# 13. Expo 57 Skeleton

新建：

```text
Expo SDK 57
React Native 0.86
React 19.2
TypeScript
```

Application。

必须验证：

```text
Android boot
iOS configuration valid
Web boot
TypeScript PASS
```

---

# 14. Workspace Integration

Mobile 必须作为：

```text
apps/mobile
```

或仓库既定等价结构中的独立 pnpm package。

必须与现有 Monorepo：

```text
package manager
lint
TypeScript
scripts
CI
```

兼容。

---

# 15. Navigation Foundation

继续使用：

```text
React Navigation 7
```

建立：

```text
NavigationContainer
Root Stack
Bottom Tabs
Navigation Types
Route Params
Not Found / invalid navigation fallback
```

---

# 16. Navigation Migration

现有 Navigation 应作为迁移基础。

优先保留：

```text
RootNavigator
TabNavigator
Bottom Navigation UX
Screen transition UX
```

但必须重新审计：

```text
Route Params
Public UUID
Auth Flow
Deep Links
Domain Ownership
```

---

# 17. Navigation 禁止事项

不得：

```text
迁 Expo Router
同时存在两套 Router
使用 internal BIGINT 作为 route param contract
```

---

# 18. Theme Migration

迁移并整理：

```text
ThemeContext
colors
presets
typography
```

必须保证：

```text
Lao font
Chinese font fallback
Typography hierarchy
Theme persistence
```

正常。

---

# 19. NativeWind Foundation

配置：

```text
NativeWind 4
Tailwind CSS 3.4
```

验证：

```text
className
responsive utility where applicable
dark/theme integration if used
```

不得在本阶段升级 Tailwind 4。

---

# 20. Shared Components Migration

优先审计现有：

```text
AppText
LaoText
BottomTabBar
AvatarCircle
Toast
Waveform
UserCard
```

等组件。

迁入 Foundation 时：

只能保留无具体 Domain Business Semantics 的通用组件。

---

# 21. Business Component Rule

如果组件明显属于：

```text
Learning
Social
Chat
Commerce
```

则应放入对应未来：

```text
features/<domain>
```

或暂时 DEFER。

不要全部塞进：

```text
components/common
```

---

# 22. TanStack Query Foundation

建立唯一：

```text
QueryClient
```

和：

```text
QueryClientProvider
```

统一定义：

```text
retry policy
stale time
gc time
network behavior
mutation defaults
error policy
```

---

# 23. Query Client 禁止事项

禁止：

```text
多个 QueryClient
Screen 内创建 QueryClient
Server Data 默认复制到 Context
```

---

# 24. API Client Foundation

Axios 继续作为 Transport。

建立新的：

```text
V2HttpClient
```

或等价结构。

统一处理：

```text
base URL
JSON
timeout
abort
auth injection
request ID
error mapping
response parsing
```

---

# 25. API Contract Foundation

不得继承旧：

```text
code === 1000
code === 9401
旧 response envelope
```

作为 V2 固定 Contract。

必须依据 V2 Backend Foundation 的真实 API Error Contract。

---

# 26. API Client 禁止事项

禁止：

```text
Screen axios.get()
Screen fetch()
各 Feature 自建 Axios Instance
多个 Refresh 实现
```

---

# 27. Error Foundation

建立统一 Mobile Error Model。

至少：

```text
NetworkError
TimeoutError
UnauthorizedError
ForbiddenError
NotFoundError
ValidationError
ConflictError
RateLimitError
ServerError
UnknownError
```

---

# 28. Request ID

Backend 返回：

```text
requestId / traceId
```

时：

客户端 Error Model 必须保留。

方便：

```text
Toast
Error Screen
Support
Debugging
```

使用。

---

# 29. UUID Contract

所有 Public / Logical ID：

```text
string UUID
```

禁止 Mobile V2 Contract 使用：

```text
BIGINT
database PK
sequence ID
```

---

# 30. Time Contract

统一：

```text
ISO 8601 with timezone
```

建立：

```text
formatDate
formatDateTime
formatRelativeTime
```

基础工具。

---

# 31. Pagination Contract

Foundation 必须支持：

```text
Cursor Pagination
Offset/Page Pagination
```

不预设所有 Domain 都使用一种 Pagination。

---

# 32. Auth Foundation

本阶段只建立：

```text
AuthProvider
AuthState
SessionState
SessionBootstrap
Authenticated / Anonymous state
```

不得接真实 Identity API。

---

# 33. Token Storage

正式实现：

```text
Access Token
→ Memory

Refresh Token
→ Expo SecureStore

Preferences
→ AsyncStorage
```

---

# 34. Token Security

必须确保：

```text
Refresh Token in AsyncStorage = 0
Access Token persistent plaintext = 0
Token log = 0
Authorization log = 0
```

---

# 35. Session Bootstrap Skeleton

应用启动时建立基础流程：

```text
App Start
↓
Read Secure Credential
↓
Determine session bootstrap state
↓
Wait for future Identity adapter
↓
Render correct app state
```

但当前不调用虚构 Refresh API。

---

# 36. AsyncStorage

继续用于：

```text
Theme
Learning Language Preference
Onboarding
Non-sensitive Settings
```

---

# 37. MMKV Audit

检查旧 Mobile 中：

```text
react-native-mmkv
```

是否存在真实使用。

如果无真实用途：

V2 不引入。

---

# 38. Audio Foundation

使用：

```text
expo-audio
```

建立统一：

```text
Audio Service
Audio Playback Hook
Recording Service / Hook
```

---

# 39. expo-av 禁止进入 V2

必须确认：

```text
expo-av dependency = 0
expo-av import = 0
```

---

# 40. Playback Foundation

至少提供基础：

```text
load
play
pause
resume
seek
stop
release
```

---

# 41. Recording Foundation

至少支持未来：

```text
permission
prepare
record
stop
cleanup
```

Foundation 只验证录音基础能力。

不得实现具体 Learning Use Case。

---

# 42. Audio Error Handling

至少覆盖：

```text
permission denied
load failure
playback failure
recording failure
interrupted audio
cleanup
```

---

# 43. Audio Lifecycle

必须考虑：

```text
Screen unmount
App background
App foreground
Audio resource release
```

避免长期资源泄漏。

---

# 44. Asset Foundation

建立统一：

```text
AssetService
```

或等价层。

基础采用：

```text
expo-image
expo-file-system
```

---

# 45. Asset Contract

Foundation 只定义：

```text
assetId
url
mimeType
optional metadata
```

等技术结构。

不猜具体 Domain Asset API。

---

# 46. Upload Skeleton

允许建立：

```text
File selection adapter
Upload request abstraction
Progress type
Cancellation
```

但不得调用不存在的真实 V2 Upload Endpoint。

---

# 47. Media Cache

Foundation 可设计缓存接口。

但：

```text
Full media offline download
```

不属于本阶段。

---

# 48. Realtime Skeleton

建立：

```text
RealtimeClient interface
```

只定义：

```text
connect
disconnect
subscribe
unsubscribe
send
connectionState
```

等基础能力。

---

# 49. Realtime Non-Scope

本阶段禁止：

```text
Chat message protocol
Presence
Typing
Delivery
Read receipt
Conversation subscription semantics
```

这些等待 Chat Domain。

---

# 50. Forms Foundation

新增：

```text
React Hook Form
Zod
```

建立最基础 Mobile Form Pattern。

---

# 51. Form Foundation 验证

使用中性 Demo Form 验证：

```text
input
validation
submit
error
disabled
loading
```

不得创建真实注册或业务表单。

---

# 52. Environment Config

建立统一：

```text
EXPO_PUBLIC_API_URL
APP_ENV
```

等基础配置。

禁止在 Mobile env 中放：

```text
server secret
private key
database credential
```

---

# 53. Config Validation

应用启动时：

应对必要 Config 做最小校验。

错误配置应：

```text
fail clearly
```

而不是默默 fallback 到某个开发机 IP。

---

# 54. 删除硬编码开发机 IP

V2 禁止保留类似：

```text
192.168.x.x
```

作为默认 Production/Native API 地址。

开发地址必须通过：

```text
Environment Config
```

控制。

---

# 55. Logging Foundation

建立轻量 Logger。

至少区分：

```text
development
production
```

禁止记录：

```text
password
OTP
token
authorization
secret
payment data
```

---

# 56. Toast / User Feedback

现有 Toast 可优先复用。

但错误展示必须分层：

```text
Recoverable small feedback
→ Toast

Form error
→ Form

Page load error
→ Error State

Fatal boot error
→ App Error Screen
```

---

# 57. App Bootstrap

建立统一：

```text
AppProviders
```

推荐包含：

```text
SafeAreaProvider
ThemeProvider
QueryClientProvider
AuthProvider
Navigation
Global Toast
Error Boundary
```

---

# 58. Global Scroll Mutation

应审计旧 App 对：

```text
ScrollView.defaultProps
FlatList.defaultProps
SectionList.defaultProps
```

的全局 mutation。

V2 不应无评估直接复制。

如确有需要：

应封装为统一组件或明确兼容策略。

---

# 59. Splash / Font Bootstrap

继续支持：

```text
Expo Splash
Noto Sans Lao
```

确保：

```text
font load
font failure fallback
splash release
```

不会导致应用卡死。

---

# 60. i18n

现有：

```text
src/i18n
```

应进入复用审计。

Foundation 只保留国际化能力。

不重写业务文案体系。

---

# 61. Platform Strategy

正式：

```text
Android = PRIMARY
iOS = PRIMARY
Web = DEVELOPMENT_CONVENIENCE
```

---

# 62. Android Foundation Validation

必须至少完成：

```text
Android app boots
Navigation works
Theme works
Audio playback works
Recording permission flow works
SecureStore works
```

---

# 63. iOS Foundation Validation

如果当前环境可以构建：

至少验证配置和启动。

如果当前开发环境无法直接运行 iOS：

必须完成：

```text
Expo config validation
iOS native capability review
No obvious iOS incompatible dependency
```

并在 Report 中记录真实限制。

---

# 64. Web Foundation Validation

必须保证：

```text
web boot
basic navigation
theme
generic UI
```

可用。

但 Native-only 功能可以降级。

---

# 65. Native-only Capability Handling

例如：

```text
SecureStore
Recording
Native files
```

在 Web 上应：

```text
graceful fallback
```

或明确：

```text
unsupported
```

不得导致整个 App crash。

---

# 66. Testing Foundation

建立：

```text
Unit Test
Component Test
React Native Testing Library
Maestro
```

---

# 67. Unit Tests

至少覆盖：

```text
API Error Mapping
Config
UUID helpers
Time helpers
Storage abstraction
Auth state
Audio state
Asset helpers
```

---

# 68. Component Tests

至少覆盖：

```text
Theme
AppText / LaoText
Toast
Generic Form
Navigation shell
Error state
```

---

# 69. Maestro Foundation

建立：

```text
e2e/
```

并提供基础 Smoke Flow。

---

# 70. Maestro Smoke

至少验证：

```text
Launch App
Main UI visible
Bottom Navigation works
Open placeholder / reused neutral screen
Theme behavior
App restart
```

如 Foundation 阶段存在 Auth Placeholder：

可以验证 Anonymous State。

不得依赖尚未完成的真实 Login API。

---

# 71. Design / UI Regression

迁移现有 UI 时：

必须重点确认：

```text
Lao typography
Chinese typography
Spacing
Bottom tabs
Screen transitions
Theme
Core learning screen layout
```

不因升级 SDK 出现明显视觉退化。

---

# 72. Dependency Audit

Foundation 完成后必须检查：

```text
expo-av = 0
duplicate navigation = 0
duplicate server-state lib = 0
unused MMKV = 0 if unused
duplicate HTTP clients = 0
unnecessary UI frameworks = 0
```

---

# 73. Architecture Audit

必须确认：

```text
Screen direct axios = 0
Screen direct fetch = 0
Refresh token AsyncStorage = 0
Internal BIGINT contract = 0
Chat protocol guessed = 0
Offline sync engine = 0
```

---

# 74. REUSE Audit Report

必须生成正式 Matrix。

建议：

```text
MOBILE_REUSE_MATRIX.md
```

至少包含：

| Item | Type | Decision | Notes |
|---|---|---|---|
| Theme | Foundation | REUSE | ... |
| RootNavigator | Navigation | REFACTOR | ... |
| LessonScreen | Screen | REFACTOR | ... |
| API Client | Infrastructure | REWRITE | ... |
| Auth Storage | Infrastructure | REWRITE | ... |
| expo-av | Dependency | REWRITE | Replace with expo-audio |

---

# 75. Mobile Foundation Tasks

正式拆为：

---

## MOB-F01 — Existing Mobile Audit

读取现有 Mobile：

```text
package.json
app.json
navigation
theme
components
screens
api
storage
audio
```

生成：

```text
REUSE / REFACTOR / REWRITE
```

清单。

禁止陷入全仓库无边界审计。

---

## MOB-F02 — Expo 57 Skeleton

创建：

```text
apps/mobile
```

新的 Expo 57 Application。

完成 workspace integration。

---

## MOB-F03 — Core Toolchain

配置：

```text
TypeScript
pnpm
Expo
React Native
NativeWind
Tailwind
Reanimated
Lucide
```

---

## MOB-F04 — Theme / Fonts / Assets

迁移：

```text
Theme
Typography
Noto Sans Lao
Icons
Static Assets
```

---

## MOB-F05 — App Providers

建立：

```text
SafeArea
Theme
Query
Auth
Error Boundary
Toast
```

Provider tree。

---

## MOB-F06 — Navigation

迁移并整理：

```text
Root Stack
Bottom Tabs
Route Types
```

不接业务 API。

---

## MOB-F07 — Shared Components

迁移 Foundation 级通用组件。

完成基础视觉验证。

---

## MOB-F08 — Query Foundation

建立唯一 QueryClient。

完成 query defaults。

---

## MOB-F09 — V2 API Client

建立新的 Axios-based V2 client。

完成：

```text
timeout
abort
request ID
error mapping
auth hook
```

---

## MOB-F10 — Global Contracts

冻结：

```text
UUID
Time
Pagination
Error
```

Mobile Contract。

---

## MOB-F11 — Secure Storage

建立：

```text
SecureStore
AsyncStorage
Memory token
```

分层。

---

## MOB-F12 — Auth Skeleton

建立：

```text
Auth State
Session Bootstrap
Anonymous State
Authenticated State
```

不接真实 Identity API。

---

## MOB-F13 — Audio Foundation

完成：

```text
expo-audio
Playback
Recording
Permissions
Lifecycle
```

基础。

---

## MOB-F14 — Asset Foundation

完成：

```text
expo-image
expo-file-system
Asset abstraction
Upload skeleton
```

---

## MOB-F15 — Realtime Skeleton

建立：

```text
RealtimeClient
```

接口。

不实现 Chat Protocol。

---

## MOB-F16 — Form Foundation

建立：

```text
React Hook Form
Zod
```

标准 pattern。

---

## MOB-F17 — Platform Compatibility

验证：

```text
Android
Web
iOS config
```

以及 native/web fallback。

---

## MOB-F18 — Testing Foundation

建立：

```text
Unit
Component
React Native Testing Library
```

---

## MOB-F19 — Maestro

建立 Maestro Smoke。

真实运行支持的平台测试。

---

## MOB-F20 — Reuse Migration Verification

确认：

```text
Theme
Navigation
Shared Components
Representative Screen
```

至少一条迁移链完整可运行。

不得连接业务 API。

---

## MOB-F21 — Documentation

创建/更新：

```text
apps/mobile/README.md
MOBILE_REUSE_MATRIX.md
MOBILE_FOUNDATION_REPORT.md
DEVELOPMENT_PROGRESS.md
```

---

## MOB-F22 — Final Audit

执行：

```text
typecheck
lint
unit/component tests
Expo validation
Android/Web build or boot validation
Maestro
dependency audit
architecture audit
security audit
```

---

# 76. Representative Screen Rule

Foundation 可以迁入少量代表性 Screen 用于验证：

```text
Theme
Navigation
Typography
Layout
```

但必须满足：

```text
No Real Domain API
No Fake Canonical CRUD
No Old Backend Contract
```

建议优先选择：

```text
Settings
Theme
Language Selection
```

这类低业务耦合页面。

---

# 77. 禁止用 Fake Business Data 伪装完成

禁止为了展示：

```text
课程列表
用户资料
聊天
订单
```

而创建大型 Mock Domain 数据。

Foundation Demo 只能使用：

```text
neutral demo
local static example
```

用于技术验证。

---

# 78. Security Audit

必须检查：

```text
Refresh token in AsyncStorage = 0
Sensitive log = 0
Hardcoded production secret = 0
Hardcoded developer IP = 0
Authorization log = 0
```

---

# 79. Audio Audit

必须确认：

```text
expo-av import = 0
expo-av dependency = 0
multiple audio engine = 0
```

---

# 80. Navigation Audit

必须确认：

```text
React Navigation only
Expo Router = 0
route params typed
logical UUID compatible
```

---

# 81. Query Audit

必须确认：

```text
One QueryClient
No duplicated server store
No global Zustand by default
```

---

# 82. Offline Audit

必须确认：

```text
SQLite = 0
Offline Sync Engine = 0
Conflict Resolution = 0
```

除非本计划发生正式 Revision。

---

# 83. Foundation Exit Gate

只有以下全部满足：

```text
MOB-F01
...
MOB-F22
```

完成后才进入：

```text
MOBILE_FOUNDATION_GATE
```

---

# 84. MOBILE_FOUNDATION_GATE — Build

必须达到：

```text
TypeScript          PASS
Lint                PASS
Unit Tests          PASS
Component Tests     PASS
Expo Config         PASS
Android Validation  PASS
Web Validation      PASS
Maestro Smoke       PASS
```

iOS 根据当前开发环境：

```text
Runtime PASS
```

或：

```text
Config/Compatibility PASS
```

必须如实记录。

---

# 85. MOBILE_FOUNDATION_GATE — Architecture

必须：

```text
Expo 57 Foundation          PASS
React Navigation            PASS
NativeWind                  PASS
Theme                       PASS
Fonts                       PASS

TanStack Query              PASS
V2 API Client               PASS
Error Contract              PASS

Secure Storage              PASS
Auth Skeleton               PASS

Audio Foundation            PASS
Asset Foundation            PASS
Realtime Skeleton           PASS

Form Foundation             PASS
Testing Foundation          PASS
Maestro                     PASS
```

---

# 86. MOBILE_FOUNDATION_GATE — Reuse

必须：

```text
Existing Theme reusable         PASS
Existing Navigation reusable    PASS
Shared UI migration pattern     PASS
Screen classification complete  PASS
```

---

# 87. MOBILE_FOUNDATION_GATE — Scope

必须：

```text
Real Domain API integration = 0
Business API guessing       = 0
Fake business CRUD          = 0
Chat protocol implementation = 0
Offline-first engine        = 0
```

---

# 88. MOBILE_FOUNDATION_GATE — Security

必须：

```text
Refresh token AsyncStorage = 0
Sensitive credential logs  = 0
Hardcoded developer API IP = 0
expo-av                     = 0
```

---

# 89. Gate 状态

最终只能：

```text
PASS
PASS_WITH_BLOCKERS
FAIL
```

只有：

```text
PASS
```

才允许标记：

```text
Mobile Foundation = COMPLETE
```

---

# 90. 完成报告

最终生成：

```text
MOBILE_FOUNDATION_REPORT.md
```

必须包含：

```text
Final Status
Task Matrix
Technology Versions
Directory Structure
Reuse Matrix Summary
Foundation Architecture
Navigation
Query
API Client
Auth Storage
Audio
Asset
Realtime
Testing
Platform Validation
Security Audit
Dependency Audit
Scope Audit
Known Limitations
Changed Files
Gate Result
```

---

# 91. Known Limitations 不等于 Blocker

以下内容可以合理 Deferred：

```text
Real Identity API
Real Content API
Real Chat Realtime
Push Notifications
SQLite Offline Learning
Media Download Packs
Crash Reporting Provider
Analytics Provider
```

这些不影响 Mobile Foundation PASS。

---

# 92. Foundation 完成后的下一步

Mobile Foundation 完成后：

不得自动开始全部 Mobile 页面业务接入。

正确模式：

```text
Domain Backend
↓
Domain API Frozen
↓
Backend Integration PASS
↓
Domain Mobile Integration
↓
Domain Mobile E2E
```

---

# 93. Identity 示例

Identity 完成后：

```text
Identity Use Cases PASS
↓
Identity API PASS
↓
Identity Backend PASS
↓
Mobile Auth Adapter
↓
Login / OTP / Refresh
↓
Identity Mobile E2E
```

---

# 94. Content 示例

Content 完成后：

```text
Content API PASS
↓
Course Screen REFACTOR
↓
Lesson Data Integration
↓
Asset Integration
↓
Content Mobile E2E
```

---

# 95. Chat 示例

Chat Phase 才允许：

```text
Realtime Protocol
Conversation Subscription
Messages
Reconnect
Chat Screen Integration
```

Foundation 不提前实现。

---

# 96. 禁止事项

本阶段禁止：

1. 全量复制旧 Mobile 当新项目基底。
2. 全量重写现有 UI。
3. 切换 Flutter。
4. 切换 Expo Router。
5. 升级 Mobile 到 Tailwind 4。
6. 默认引入 Zustand。
7. Refresh Token 存 AsyncStorage。
8. 保留 expo-av。
9. Screen 直接 axios/fetch。
10. Screen 直接操作底层 Audio Engine。
11. 引入完整 SQLite Offline System。
12. 猜测 Chat Protocol。
13. 使用旧 Backend API 作为 V2 Contract。
14. 使用 internal BIGINT。
15. 为 Foundation 创建假的 Domain CRUD。
16. 自动开始下一 Domain。

---

# 97. 最终定义

`MOBILE FOUNDATION` 完成的含义不是：

> Mobile 所有业务已经完成。

而是：

> **ZH-LAO V2 已经拥有一个稳定、现代、可测试的 Expo 57 Mobile Application Foundation；现有成熟 UI/UX 已经具备清晰的复用路径，底层 V2 API、Auth、Storage、Audio、Asset、Realtime 和 Testing 基础已经准备完毕，后续每个 Domain 可以按 API Contract 独立接入。**

---

# 98. 正式执行顺序

```text
MOB-F01 Existing Mobile Audit
↓
MOB-F02 Expo 57 Skeleton
↓
MOB-F03 Core Toolchain
↓
MOB-F04 Theme / Fonts / Assets
↓
MOB-F05 App Providers
↓
MOB-F06 Navigation
↓
MOB-F07 Shared Components
↓
MOB-F08 Query Foundation
↓
MOB-F09 V2 API Client
↓
MOB-F10 Global Contracts
↓
MOB-F11 Secure Storage
↓
MOB-F12 Auth Skeleton
↓
MOB-F13 Audio Foundation
↓
MOB-F14 Asset Foundation
↓
MOB-F15 Realtime Skeleton
↓
MOB-F16 Form Foundation
↓
MOB-F17 Platform Compatibility
↓
MOB-F18 Testing Foundation
↓
MOB-F19 Maestro
↓
MOB-F20 Reuse Migration Verification
↓
MOB-F21 Documentation
↓
MOB-F22 Final Audit
↓
MOBILE_FOUNDATION_GATE
```

---

# 99. 执行纪律

每项任务必须：

```text
Implement
↓
Test
↓
Self-review
↓
Fix
↓
Retest
↓
Continue
```

普通技术问题不得作为停止理由。

---

# 100. 一句话执行原则

> **Mobile Foundation 的目标不是重写一个新 App，而是把成熟的现有产品体验安全地搬到新的 V2 客户端基础上，并彻底切断对旧数据层、认证层和基础设施的依赖。**