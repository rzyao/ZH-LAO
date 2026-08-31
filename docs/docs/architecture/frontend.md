---
status: baseline
last_updated: 2026-08-31
---

# 客户端架构

ZH-LAO 当前有两类正式客户端：

1. **移动客户端**：面向最终用户；
2. **后台管理端**：面向运营与管理人员。

两端共享后端公开契约，但工程、导航、状态管理和交互模型分别独立。

## 总体边界

```text
移动客户端 ─────┐
               ├─ HTTPS / JSON ─► 后端 API ─► Application Service ─► PostgreSQL
后台管理端 ─────┘
```

客户端必须遵守：

- 不直接访问 PostgreSQL；
- 不感知内部 BIGINT 主键；
- 路由、API 和跨领域实体标识使用公开 UUID；
- 不复制后端业务状态机作为第二事实源；
- 权限判断以服务端为最终裁决；
- HTTP 错误先归一化，再映射到 UI；
- 服务端时间按带时区的标准时间契约传输，客户端负责本地化显示。

---

## 一、移动客户端

### 技术基线

| 项目 | 当前选择 |
| --- | --- |
| 框架 | Expo SDK 57 |
| 运行时 | React Native 0.86 |
| UI | React 19.2 |
| 语言 | TypeScript |
| 导航 | React Navigation 7 |
| 服务端状态 | TanStack Query |
| HTTP | Axios，经统一 `V2HttpClient` 包装 |
| 表单 | React Hook Form + Zod |
| 样式 | NativeWind 4 + Tailwind CSS 3.4 |
| 动画 | Reanimated 4 |
| 安全存储 | Expo SecureStore |
| 普通偏好 | AsyncStorage |
| 音频 | `expo-audio` |
| 图片 | `expo-image` |
| 文件 | `expo-file-system` |
| 测试 | Jest + React Native Testing Library |
| E2E | Maestro |

当前明确不使用 Expo Router、Redux、Zustand 作为默认全局状态方案、SQLite/offline-first engine、MMKV、Detox 和 `expo-av`。

### 工程结构

```text
apps/mobile/
├─ App.tsx
├─ src/
│  ├─ bootstrap/
│  ├─ config/
│  ├─ providers/
│  ├─ navigation/
│  ├─ api/
│  ├─ auth/
│  ├─ storage/
│  ├─ audio/
│  ├─ assets/
│  ├─ realtime/
│  ├─ forms/
│  ├─ theme/
│  ├─ i18n/
│  ├─ components/
│  ├─ screens/
│  └─ features/
├─ __tests__/
└─ e2e/
```

Foundation 层提供跨领域技术能力；具体 Identity、Content、Learning、Social、Chat 等业务 UI 应放在各自 feature / screen 边界内，不把领域业务规则塞进共享组件。

### Provider 树

当前应用根依赖关系：

```text
SafeAreaProvider
└─ ThemeProvider
   └─ I18nProvider
      └─ QueryClientProvider
         └─ AuthProvider
            └─ ErrorBoundary
               └─ ToastHost
                  └─ NavigationContainer
```

全应用只允许一个 QueryClient，由统一位置负责 retry、staleTime、gcTime、networkMode 和 mutation policy。

### 导航

使用 React Navigation 的 native-stack + bottom-tabs。

规则：

- route params 必须有 TypeScript 类型；
- 业务资源 ID 使用 public UUID string；
- deep link 输入必须校验，不接受数据库内部 ID；
- 导航只表达客户端页面关系，不承担服务端授权。

### HTTP 与 API

所有网络请求必须经过统一 `V2HttpClient`。

Screens / Components 不应直接：

```text
import axios
fetch(...)
自行拼 Authorization
硬编码开发服务器 IP
```

统一 HTTP Client 负责：

- base URL；
- request ID；
- timeout；
- JSON；
- 认证 hook；
- 网络错误与 HTTP 错误归一化。

移动端统一错误模型至少区分：

```text
network
 timeout
unauthorized
forbidden
not_found
validation
conflict
rate_limit
server
unknown
```

### 认证与本地存储

移动端采用分层存储：

```text
Access Token  → 内存
Refresh Token → SecureStore
普通偏好      → AsyncStorage
```

敏感 token 不写普通 AsyncStorage，也不进入日志。

客户端认证状态可以表达 bootstrapping / anonymous / authenticated，但 Identity 服务端仍然是认证事实的唯一拥有者。

### 国际化

移动端从 Foundation 开始支持中文和老挝语界面。

国际化状态与“用户学习方向”是不同概念：界面语言属于客户端显示偏好，学习方向属于 Identity / Learning 相关业务事实，不能因为 UI 切换语言而隐式修改学习方向。

### 音频、Asset 与实时能力

- 音频统一走 `AudioService` 和 playback / recording hooks；
- Asset 通过 `AssetService` 抽象图片和文件能力；
- 上传在后端正式上传契约存在前不得伪造成功流程；
- `RealtimeClient` 当前只定义 transport seam，不提前定义 Chat presence、typing、read receipt 等业务协议。

实时业务事实必须由所属 Domain 定义，transport 只负责传输。

### 平台策略

Android 是当前主要 native 验证平台。

Expo 工程同时保留 iOS / Web 能力，但：

- iOS runtime 验证受开发主机条件限制时可以延后；
- Web 主要作为兼容与静态导出验证，不自动等同于正式 Web 产品；
- native-only 能力必须在不支持的平台安全降级，而不是直接崩溃。

---

## 二、后台管理端

### 技术基线

| 项目 | 当前选择 |
| --- | --- |
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 路由 | TanStack Router |
| 服务端状态 | TanStack Query |
| 表格 | TanStack Table v8 |
| 表单 | React Hook Form + Zod |
| 样式 | Tailwind CSS v4 |
| Headless UI | Base UI / shadcn 组件模式 |
| 测试 | Vitest + Testing Library |
| E2E | Playwright |

当前 Foundation 冻结不引入 Next.js、Ant Design、Material UI、Redux 等替代架构。

### 工程结构

```text
apps/admin/src/
├─ app/
│  ├─ config/
│  ├─ providers/
│  └─ router/
├─ api/
│  ├─ client/
│  ├─ contracts/
│  ├─ errors/
│  └─ query/
├─ auth/
├─ components/
├─ design-system/
├─ lib/
├─ navigation/
└─ pages/
```

后台页面围绕领域导航组织，但后台本身不成为新的业务事实拥有者。

### 状态归属

```text
服务端数据 / cache / invalidation
→ TanStack Query

列表分页、查询、筛选、排序等可分享状态
→ TanStack Router Search Params

短暂交互状态
→ React local state
```

当前不引入全局 UI store。

### API Client

后台只使用统一 `ApiClient`。

由它负责：

- API base URL；
- timeout / AbortSignal；
- Authorization hook；
- `X-Request-Id`；
- JSON 处理；
- 网络失败和 HTTP error mapping。

页面组件禁止直接调用 `fetch()` 或自行拼接认证 header。

### 后台权限

后台客户端可以根据服务端返回的权限信息控制导航、按钮和页面可见性，但这些都只是 UX 层保护。

最终授权由：

```text
Identity Authentication
+
Operations Operator / RBAC
+
Owner Domain business rule
```

在后端执行。

客户端 PermissionGuard 不得被视为安全边界。

### 设计系统

后台采用高信息密度、桌面优先、工作流优先的设计系统，并支持 Light / Dark / System。

通用组件可以跨领域复用，但具体业务表单、状态、字段含义仍由对应 Domain contract 决定。

---

## 三、两类客户端共同契约

| 契约 | 规则 |
| --- | --- |
| 对象编号 | 使用 public/logical UUID，不使用 internal BIGINT |
| 时间 | ISO 8601 / 带时区语义 |
| 错误 | 消费稳定错误码，不展示服务器 stack |
| 服务端数据 | 由 Query 层管理缓存与失效 |
| 认证 | Token 获取和刷新走统一 auth/client 边界 |
| 权限 | UI 可隐藏，但后端必须再次裁决 |
| 跨领域调用 | 只消费后端 API，不模拟后端领域依赖 |
| 敏感信息 | 不写普通日志和非安全存储 |

## 四、尚未冻结的客户端能力

以下属于后续 Domain / Integration 设计，不由客户端 Foundation 提前决定：

- Chat WebSocket 实际协议；
- Push Provider 与通知策略；
- 离线学习 / offline-first 数据同步；
- 大规模本地数据库；
- Social / Chat / Commerce 的具体导航和业务页面；
- 正式上传 API 与断点续传策略。

相关产品能力进入对应 Domain 生命周期后再设计。

参见 [总体架构](overview.md)、[后端架构](backend.md)、[基础设施与集成](infrastructure.md)、[安全与权限架构](security.md)。
