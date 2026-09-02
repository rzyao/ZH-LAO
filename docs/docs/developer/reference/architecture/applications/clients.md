---
status: baseline
last_updated: 2026-08-31
---

# 客户端架构

ZH-LAO 当前有两类正式客户端：

1. **移动客户端**：面向最终用户；
2. **后台管理端**：面向运营与管理人员。

两端共享后端公开契约，但工程、导航、状态管理和交互模型独立。

## 总体边界

```text
移动客户端 ─────┐
               ├─ HTTPS / JSON ─► 后端 API ─► Application Service ─► PostgreSQL
后台管理端 ─────┘
```

客户端共同遵守：

- 不直接访问 PostgreSQL；
- 不感知 internal BIGINT；
- 路由、API 与跨领域对象标识使用 public/logical UUID；
- 不复制服务端业务状态机作为第二事实源；
- 权限判断以服务端为最终裁决；
- HTTP 错误统一归一化后再映射 UI；
- 服务端时间按带时区标准传输，客户端负责本地化显示。

## 移动客户端

### 技术基线

| 项目 | 当前选择 |
| --- | --- |
| 框架 | Expo SDK 57 |
| 运行时 | React Native 0.86 |
| UI | React 19.2 |
| 语言 | TypeScript |
| 导航 | React Navigation 7 |
| 服务端状态 | TanStack Query |
| HTTP | Axios，经统一 `HttpClient` 包装 |
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

当前不使用 Expo Router、Redux、Zustand 作为默认全局状态方案、SQLite/offline-first engine、MMKV、Detox 和 `expo-av`。

### 工程边界

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

Foundation 目录提供跨领域技术能力；具体业务 UI 应进入对应 feature/screen 边界，共享组件不得成为业务规则的隐形所有者。

### 根 Provider

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

全应用只有一个 QueryClient，由统一位置控制 retry、staleTime、gcTime、networkMode 与 mutation policy。

### 导航与标识

- 使用 React Navigation native-stack + bottom-tabs；
- Route Params 必须有 TypeScript 类型；
- 业务资源 ID 使用 public UUID string；
- Deep Link 输入必须校验；
- 导航只表达页面关系，不承担服务端授权。

### HTTP 与认证存储

所有请求通过统一 `HttpClient`。

Screen / Component 不应直接调用 `fetch()`、直接 import Axios、自行拼 Authorization 或硬编码开发服务器地址。

移动端敏感数据分层：

```text
Access Token  → Memory
Refresh Token → SecureStore
普通偏好      → AsyncStorage
```

### 国际化与学习方向

界面语言和用户学习方向是两个不同概念。

- UI Language：客户端显示偏好；
- Learning Direction：业务事实。

切换界面语言不得隐式修改学习方向。

### 音频、Asset 与实时能力

- 音频统一通过 `AudioService` 与 Playback/Recording Hook；
- Asset 通过统一 `AssetService`；
- 后端上传契约未定义前，客户端不得伪造上传成功；
- `RealtimeClient` 只提供 Transport Seam，不提前拥有 Chat 的 Presence、Typing、Read Receipt 等业务语义。

Android 是当前主要 Native 验证平台。iOS/Web 能力保留，但不自动等同于正式产品发布目标。

## 后台管理端

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

当前 Foundation 不引入 Next.js、Ant Design、Material UI、Redux 等替代架构。

### 工程边界

```text
apps/admin/src/
├─ app/
├─ api/
├─ auth/
├─ components/
├─ design-system/
├─ lib/
├─ navigation/
├─ pages/
└─ test/
```

### 状态所有权

```text
服务端数据 / 缓存 / 失效 → TanStack Query
URL 列表状态              → TanStack Router Search Params
短暂交互状态              → React Local State
```

没有明确必要性时不新增全局客户端状态库。

### API Client

后台通过唯一 `ApiClient` 处理：

- Base URL；
- JSON；
- Timeout / Abort；
- Authorization Hook；
- `X-Request-Id`；
- HTTP / Network Error Mapping。

组件禁止直接 `fetch()` 或自行建立 HTTP Wrapper。

### 权限

前端 Permission Guard 只用于 UI 展示和操作引导，不是安全边界。

真正授权链为：

```text
Identity Authentication
↓
Operations Operator / RBAC
↓
Owner Domain Business Rule
```

### 页面模式

后台 Foundation 提供可复用技术模式：

```text
List
Detail
Edit
Workbench
DataTable
Form
Loading / Empty / Error
Confirm Dialog / Toast
```

具体字段、状态机、操作按钮与权限 Key 由对应 Domain 的 Admin Contract 决定。

## 两类客户端的共享契约

两端应对以下技术语义保持一致：

- UUID；
- 时间；
- Pagination；
- Error Envelope；
- Request ID；
- Auth Session；
- Feature Flag / App Version 等 Platform Contract。

但共享契约不意味着共享 UI 工程或共享运行时状态。

服务端边界见 [后端架构](backend.md)，安全模型见 [安全与权限](../infrastructure/security.md)。
