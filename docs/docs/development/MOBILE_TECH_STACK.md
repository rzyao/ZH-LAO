---
status: frozen
last_updated: 2026-09-02
---

# ZH-LAO  — Mobile Technology Stack

**文件：`MOBILE_TECH_STACK.md`**  
**适用范围：ZH-LAO  Mobile Application**
**状态：FROZEN**  
**现行约束：** 流程、Gate 与工件职责以[开发流程控制中心](DEVELOPMENT_CONTROL_CENTER.md)为准；完成状态与证据以[开发进度记录表](DEVELOPMENT_PROGRESS.md)为准；动态调度以[当前下一动作](workflow/NEXT_ACTIONS.md)为准。

---

# 1. 目的

本文档冻结 ZH-LAO  Mobile 的基础技术选型与工程原则。

本文件只定义：

- Mobile 技术栈；
- 客户端基础架构；
- 状态管理原则；
- Navigation；
- API Client；
- Auth Storage；
- Audio；
- Asset；
- Realtime；
- Offline；
- Testing；
- Web Target；
- 现有 UI/UX 复用规则。

本文档不定义：

- Identity 具体 API；
- Content 具体 API；
- Learning 具体 API；
- Social / Chat / Commerce 等 Domain API；
- Domain Use Case；
- Domain 页面最终业务行为。

具体业务功能必须跟随对应 Domain Phase 实现。

---

# 2. 核心原则

ZH-LAO  Mobile 不进行无意义的全量 UI 重写。

总体原则：

> **保留成熟 UI/UX，升级技术基础，重建  数据与业务接入层。**

现有 Mobile 已经具备较成熟的：

- 页面；
- Navigation；
- Theme；
- Typography；
- NativeWind 样式；
- 学习 UI；
- Audio UI；
- Profile；
- Social；
- Chat UI；
- Bottom Navigation；
- 通用组件。

因此  Mobile 不采用：

> 全部推倒重新设计。

也不采用：

> 原目录整体复制后直接修改 API。

而采用：

```text
New Mobile Foundation
        ↓
Reuse UI / Theme / Assets
        ↓
Refactor reusable Screens
        ↓
Rebuild  Data Layer
        ↓
Connect Domain APIs incrementally
```

---

# 3. Framework

正式采用：

```text
Expo SDK 57
React Native 0.86
React 19.2
TypeScript
```

## 3.1 决策

继续使用 Expo / React Native。

禁止因  重构而切换：

```text
Flutter
Native Android
Native iOS
Ionic
Capacitor
```

除非未来发生正式的 Mobile Architecture Revision。

---

# 4. Expo 策略

 Mobile 创建新的 Expo SDK 57 Application Foundation。

不从旧工程直接执行：

```text
upgrade all dependencies
```

然后逐个修复错误。

推荐方式：

```text
Expo SDK 57 clean foundation
↓
基础工具链验证
↓
Theme / Assets
↓
Components
↓
Navigation
↓
Screens
↓
 Data Integration
```

---

# 5. Navigation

正式采用：

# React Navigation 7

保留：

```text
@react-navigation/native
@react-navigation/native-stack
@react-navigation/bottom-tabs
```

---

# 6. 不迁移 Expo Router

 当前不采用 Expo Router。

原因：

现有 Mobile 已经具有成熟的：

```text
NavigationContainer
Native Stack
Bottom Tabs
Screen Navigation
```

并且大量页面已经依赖当前 Navigation Structure。

将 React Navigation 改成 Expo Router：

不会产生足够业务价值，却会增加：

- Route migration；
- Screen migration；
- Params migration；
- Auth navigation migration；
- Deep link migration；
- Regression risk。

因此：

```text
React Navigation 7 = KEEP
Expo Router = NOT_SELECTED
```

---

# 7. Styling

正式采用：

```text
NativeWind 4
Tailwind CSS 3.4
```

继续保留现有 Styling System。

---

# 8. 不升级 Tailwind CSS 4

Admin 使用 Tailwind CSS v4 不代表 Mobile 必须同步。

Mobile 与 Admin 是两个不同应用。

 Mobile 当前：

```text
NativeWind 4
+
Tailwind CSS 3.4
```

已经是一套成熟稳定组合。

禁止仅为了“统一版本”强制改为 Tailwind CSS 4。

---

# 9. UI Component Strategy

Mobile 不引入大型通用 UI Framework。

不默认采用：

```text
React Native Paper
NativeBase
Tamagui
UI Kitten
```

现有 Mobile 自研组件继续作为主要 UI Component Foundation。

例如：

```text
AppText
LaoText
BottomTabBar
AvatarCircle
Waveform
Toast
UserCard
```

应优先：

```text
REUSE
```

或：

```text
REFACTOR
```

而不是 Rewrite。

---

# 10. Theme

现有：

```text
ThemeContext
colors
presets
typography
```

作为  Theme Foundation 的主要复用来源。

Theme 应继续独立于 Domain Business Logic。

---

# 11. Server State

正式采用：

# TanStack Query 5

所有来自 Backend 的 Server State 原则上由 TanStack Query 管理。

包括：

```text
Identity
Content
Learning
Profile
Social
Chat
Commerce
Rewards
```

---

# 12. Server State 禁止事项

禁止：

```text
API
↓
复制 Server Data 到 Global Store
↓
页面从 Global Store 读取
```

除非存在明确业务理由。

例如：

```text
Course
Lesson
User Profile
Conversation
Messages
Wallet
Orders
```

不应默认放入 Zustand 或其他客户端 Store。

---

# 13. Client State

默认使用：

```text
useState
useReducer
React Context
```

---

# 14. Zustand

当前：

```text
Zustand = NOT_INCLUDED_BY_DEFAULT
```

Mobile Foundation 不主动引入 Zustand。

只有未来出现真实需求时才允许加入，例如：

```text
Global Audio Player UI
Cross-screen Recording Session
Complex Onboarding State
Cross-screen Draft
```

新增 Zustand 必须有明确 Use Case。

---

# 15. State Ownership

统一规则：

```text
Server State
→ TanStack Query

Navigation State
→ React Navigation

Theme
→ Theme Context

Auth Session State
→ Auth Layer

Form State
→ React Hook Form

Simple Local UI State
→ useState / useReducer

Cross-screen Client State
→ Zustand only if proven necessary
```

---

# 16. Forms

正式采用：

```text
React Hook Form
```

用于：

```text
Authentication
Profile
Settings
Social forms
Report forms
Commerce forms
```

---

# 17. Validation

正式采用：

```text
Zod
```

客户端 Validation 主要用于：

- UX；
- immediate feedback；
- basic structure validation。

Backend 仍然是最终业务规则权威。

---

# 18. Networking

HTTP Transport 继续采用：

```text
Axios
```

但：

> **现有 API Client 不作为  Contract Authority。**

必须为  重建统一 API Client。

---

# 19.  API Client

必须统一处理：

```text
Base URL
JSON
Authorization
Timeout
Abort
Request ID
Error Mapping
Refresh
UUID
ISO Time
Pagination
```

---

# 20. API Client Architecture

推荐：

```text
Screen
↓
Feature Hook
↓
TanStack Query
↓
Domain API Adapter
↓
 HTTP Client
↓
ZH-LAO Backend
```

---

# 21. 禁止 Screen Direct Fetch

禁止：

```text
Screen
↓
fetch()
```

也禁止：

```text
Screen
↓
axios.get()
```

所有请求必须经过统一  Client / Domain API Layer。

---

# 22. API Error Contract

Mobile 应与  Backend Contract 对齐。

客户端统一转换为标准 Error Model。

至少应支持：

```text
Network Error
Unauthorized
Forbidden
Not Found
Validation
Conflict
Rate Limit
Server Error
Timeout
Unknown Error
```

禁止把 Backend Stack Trace 直接显示给用户。

---

# 23. Auth Storage

 必须修改现有 Token Storage 策略。

正式规则：

```text
Access Token
→ Memory

Refresh Token
→ Expo SecureStore

Non-sensitive Preferences
→ AsyncStorage
```

---

# 24. 禁止敏感 Token 存入 AsyncStorage

禁止把：

```text
Refresh Token
Long-lived Credential
Secret
```

保存到普通 AsyncStorage。

---

# 25. AsyncStorage

继续保留。

适用于：

```text
Theme
Language
Onboarding
Non-sensitive Preferences
Local UI Settings
```

---

# 26. MMKV

 当前不要求保留 MMKV。

如果实际代码没有真实依赖：

应从 Dependency 中删除。

原则：

> 不同时维护多套没有必要的客户端 Storage。

---

# 27. Audio

正式使用：

# expo-audio

---

# 28. expo-av

现有：

```text
expo-av
```

不得直接迁入 。

 应完成：

```text
expo-av
→ expo-audio
```

迁移。

---

# 29. Audio Service

Foundation 应建立统一：

```text
AudioService
```

或等价 abstraction。

至少允许未来支持：

```text
play
pause
resume
stop
seek
preload
release
record
```

具体接口以实际实现为准。

---

# 30. Screen 不直接依赖底层 Audio API

禁止：

```text
LessonScreen
→ expo-audio directly

WordScreen
→ another audio implementation

RolePlay
→ third audio implementation
```

统一：

```text
Screen
↓
Audio Hook / Service
↓
expo-audio
```

---

# 31. Audio 是核心基础能力

ZH-LAO 是语言学习产品。

因此 Audio 不作为普通辅助工具处理。

未来至少会服务：

```text
Word Pronunciation
Sentence Audio
Lesson Audio
Dialogue
Shadowing
Role Play
Recording Practice
```

---

# 32. Asset

 Mobile 应建立统一 Asset Layer。

推荐基础：

```text
expo-image
expo-file-system
```

---

# 33. Asset Contract

所有业务 Domain 使用：

```text
Asset UUID
```

引用 Infrastructure Asset。

Mobile 不感知数据库内部 Asset PK。

---

# 34. Asset Flow

未来推荐：

```text
Select File
↓
Upload Asset
↓
Receive asset_id UUID
↓
Submit Business Command
```

例如：

```text
Upload Avatar
↓
asset_id
↓
Update Social Profile
```

具体 API 由 Domain Contract 冻结。

---

# 35. Realtime

Mobile Foundation 只定义：

```text
Realtime Abstraction
```

底层优先：

```text
WebSocket
```

---

# 36. Chat Protocol

Foundation 阶段不实现真实 Chat Protocol。

以下内容等待 Chat Domain：

```text
Message Protocol
Conversation Subscription
Delivery
Reconnect Semantics
Authentication
Presence
```

---

# 37. Realtime Foundation

未来接口可支持：

```text
connect
disconnect
subscribe
unsubscribe
send
reconnect
connectionState
```

但不得提前猜 Chat Domain Contract。

---

# 38. Offline Strategy

正式采用：

# ONLINE_FIRST

而不是：

```text
OFFLINE_FIRST
```

---

# 39.  第一阶段不建立完整 Offline Database

当前不引入：

```text
SQLite Application Database
Offline Learning Event Queue
Offline-first Domain Repository
Conflict Resolution Engine
Local-first Sync
```

---

# 40. SQLite

当前：

```text
expo-sqlite = NOT_REQUIRED
```

只有未来出现真实产品需求时再引入。

例如：

```text
Download Full Courses
Offline Dictionary
Offline Learning
Large Offline Content Packs
```

需要单独设计：

```text
Offline Learning Phase
```

---

# 41. Query Cache

第一阶段允许使用 TanStack Query Cache 改善网络体验。

但 Query Cache：

不等于完整 Offline System。

---

# 42. Media Cache

媒体缓存允许早于完整 Offline Learning 实现。

例如：

```text
Audio URL
↓
Download / Cache
↓
Local File
↓
Playback
```

可以在 Content / Learning / Audio 相关阶段实现。

---

# 43. Testing

Mobile Testing 正式采用：

```text
Unit Tests
Component Tests
React Native Testing Library
Maestro E2E
```

---

# 44. E2E

正式采用：

# Maestro

当前不采用：

```text
Detox
```

---

# 45. Maestro 使用范围

重点覆盖 Golden Flow。

例如：

```text
App Startup
Authentication
Learning
Audio
Social
Chat
Commerce
```

不追求所有 UI 都写 E2E。

---

# 46. Unit / Component Test

重点测试：

```text
Hooks
API Client
Auth
Error Mapping
Storage
Forms
Important Components
Domain UI State
```

---

# 47. Platforms

正式定义：

```text
Android
→ PRIMARY

iOS
→ PRIMARY

Web
→ DEVELOPMENT_CONVENIENCE
```

---

# 48. Android

Android 是正式产品平台。

必须进行真实 Native 验证。

---

# 49. iOS

iOS 是正式产品平台。

最终必须通过：

```text
iOS Simulator
```

以及正式发布前的真机验证。

---

# 50. Web Target

继续保留：

```text
expo start --web
```

但 Web 不作为 Mobile 产品 Feature Parity 目标。

---

# 51. Web 用途

主要用于：

```text
Quick Development Preview
Basic UI Review
AI-assisted Development
Simple Component Testing
Layout Inspection
```

---

# 52. Web 不作为 Native Blocker

因为以下能力在 Web 与 Native 上存在天然差异：

```text
Recording
Microphone
Secure Storage
Files
Push
Native Permissions
App Lifecycle
```

所以涉及 Native-only 能力时：

Web 不要求 100% Feature Parity。

---

# 53. Primary Validation

真实产品验收优先：

```text
Android
iOS
```

而不是 Web。

---

# 54. Existing Mobile Reuse Strategy

 对现有 Mobile 文件进行：

```text
REUSE
REFACTOR
REWRITE
```

三级分类。

---

# 55. REUSE

优先直接复用：

```text
Assets
Fonts
Theme
Typography
Icons
Pure UI Components
Layout
Animation
Visual Patterns
```

---

# 56. REFACTOR

优先保留 UI，但重新连接  数据：

```text
Course Screens
Lesson Screens
Profile Screens
Settings
Wordbook
Review
Dialogue
Shadow
Role Play
Social UI
Chat UI
```

---

# 57. REWRITE

原则上重建：

```text
API Client
Auth
Token Storage
Domain API Services
Server Contracts
Audio Infrastructure
Asset Infrastructure
Realtime Infrastructure
Testing Foundation
```

---

# 58. Navigation Reuse

React Navigation 架构优先复用。

但必须重新审计：

```text
Auth Guard
Route Params
UUID Params
Deep Links
Domain Route Ownership
```

---

# 59. Existing API Service Files

现有：

```text
auth
course
scene
social
translate
wordbook
```

只作为：

> Product / UI Integration Reference

不作为  API Authority。

 Domain API 必须按照：

```text
Product Requirement
↓
Use Case
↓
API Contract
```

重新实现。

---

# 60. No Database-shaped Mobile API

Mobile 不得根据数据库表结构设计页面 API。

禁止：

```text
Database Table
↓
REST CRUD
↓
Mobile Screen
```

正确：

```text
Product Flow
↓
Use Case
↓
API Contract
↓
Mobile Feature
```

---

# 61. UUID Rule

跨 Domain / Public ID：

Mobile 一律视为：

```text
UUID string
```

禁止客户端依赖：

```text
BIGINT
Internal Database ID
Sequence ID
```

---

# 62. Time Rule

Backend 时间统一使用：

```text
ISO 8601
with timezone
```

Mobile 应建立统一时间解析与格式化工具。

禁止各 Screen 随意处理服务器时间。

---

# 63. Pagination

Mobile Foundation 必须支持：

```text
Cursor Pagination
Offset/Page Pagination
```

但具体 Domain 使用哪种方式由 API Contract 决定。

Feed / Chat / Large List 优先支持 Cursor。

---

# 64. Package Manager

继续使用：

```text
pnpm
```

并与 ZH-LAO Monorepo Workspace 规范保持一致。

---

# 65. Dependency Principle

新增 Mobile Dependency 必须满足：

```text
Real Requirement
Maintained
Expo/RN Compatible
No Existing Equivalent
```

禁止为了未来可能需求预装大量 Library。

---

# 66. 禁止事项

 Mobile 禁止：

1. 为了  改成 Flutter。
2. 为了新项目将现有 UI 全部重写。
3. 强制迁 Expo Router。
4. 强制把 Mobile Tailwind 升到 v4。
5. Server State 全部塞进 Zustand。
6. Refresh Token 存 AsyncStorage。
7. 继续新增 expo-av 代码。
8. Foundation 阶段建立完整 Offline-first Engine。
9. Foundation 阶段猜测 Chat Realtime Protocol。
10. Screen 直接调用 fetch/axios。
11. Screen 直接操作底层 Audio API。
12. Client 使用 Backend internal BIGINT。
13. 根据数据库表自动设计 Mobile CRUD。
14. 为 Web Feature Parity 阻塞 Native Development。
15. 提前实现尚未冻结 API 的 Domain 页面数据逻辑。

---

# 67.  Mobile Foundation 推荐结构

建议：

```text
apps/mobile/
├── src/
│   ├── app/
│   │   ├── providers/
│   │   ├── config/
│   │   └── bootstrap/
│   │
│   ├── navigation/
│   │
│   ├── api/
│   │   ├── client/
│   │   ├── errors/
│   │   └── contracts/
│   │
│   ├── auth/
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
│   ├── utils/
│   │
│   └── i18n/
│
├── assets/
├── e2e/
└── tests/
```

实际目录可以根据仓库规范微调。

---

# 68. Domain Feature Structure

后续建议逐步使用：

```text
features/
├── identity/
├── content/
├── learning/
├── social/
├── chat/
├── commerce/
└── ...
```

但：

不得在 Mobile Foundation 阶段提前实现业务。

---

# 69. Mobile Development Order

Mobile 不作为独立的大业务开发阶段。

正确顺序：

```text
Mobile Foundation
↓
等待对应 Domain API
↓
Domain Mobile Integration
↓
Domain E2E
```

例如：

```text
Identity Backend
↓
Identity API PASS
↓
Identity Mobile Integration
↓
Identity Mobile E2E
```

---

# 70. Foundation 可以提前完成

在 Identity Backend 尚未全部完成时：

允许提前完成：

```text
Expo 57 Application Skeleton
Navigation Foundation
Theme
UI Component Reuse
TanStack Query
 HTTP Client Infrastructure
Error Infrastructure
Secure Storage
Audio Foundation
Asset Foundation
Testing Foundation
Maestro Foundation
```

但不连接尚未冻结的真实 Domain API。

---

# 71. Final Frozen Stack

ZH-LAO  Mobile 最终基础技术栈：

```text
Framework
├── Expo SDK 57
├── React Native 0.86
├── React 19.2
└── TypeScript

Navigation
└── React Navigation 7

UI
├── NativeWind 4
├── Tailwind CSS 3.4
├── Reanimated 4
├── Lucide React Native
└── Existing Custom UI Components

Server State
└── TanStack Query 5

Client State
├── React State
├── React Context
└── Zustand only if proven necessary

Forms
├── React Hook Form
└── Zod

Networking
└── Axios
    └── New  API Client

Storage
├── Memory
├── Expo SecureStore
└── AsyncStorage

Audio
└── expo-audio

Asset
├── expo-image
└── expo-file-system

Realtime
└── WebSocket Abstraction

Offline
├── Online-first
├── Query Cache
├── Media Cache allowed later
└── SQLite not included initially

Testing
├── Unit
├── React Native Testing Library
└── Maestro

Platforms
├── Android PRIMARY
├── iOS PRIMARY
└── Web DEVELOPMENT_CONVENIENCE

Package Manager
└── pnpm
```

---

# 72. Technology Status

以下技术正式：

```text
FROZEN
```

- Expo / React Native；
- React Navigation；
- TanStack Query；
- NativeWind；
- Tailwind CSS 3.4；
- React Hook Form；
- Zod；
- Axios Transport；
- Expo SecureStore；
- AsyncStorage；
- expo-audio；
- Maestro；
- Online-first；
- Android/iOS Primary；
- Web Development Convenience。

---

# 73. Deferred Decisions

以下内容不在 Foundation 阶段提前冻结：

```text
SQLite Offline Learning Architecture
Full Media Download System
Chat Protocol
Push Notification Provider
Analytics Provider
Crash Reporting Provider
Zustand
```

这些必须出现真实需求后再决定。

---

# 74. 后续 Mobile Foundation 输入

下一步制定：

```text
MOBILE_FOUNDATION_PLAN.md
```

时，本文档作为最高级 Mobile 技术选型依据之一。

Mobile Foundation Plan 应围绕：

```text
New Expo 57 Skeleton
Existing UI Reuse Audit
Theme / Asset Migration
Navigation Migration
TanStack Query Foundation
 API Client Foundation
Auth Storage Foundation
Audio Foundation
Asset Foundation
Realtime Skeleton
Testing Foundation
Maestro Smoke
REUSE / REFACTOR / REWRITE Matrix
```

进行设计。

---

# 75. 最终原则

ZH-LAO  Mobile 的目标不是：

> 为了技术升级重新写一个看起来一样的 App。

而是：

> **保留已经成熟的产品体验和 UI 资产，同时把底层 API、认证、状态、音频、资产和领域接入升级为符合 ZH-LAO  架构的新客户端。**
