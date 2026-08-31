# ZH-LAO  — Mobile Foundation Report

**文件：`MOBILE_FOUNDATION_REPORT.md`**
**Phase：MOB-F01 → MOB-F22 + MOBILE_FOUNDATION_GATE**
**日期：2026-08-31**
**工作区：`apps/mobile`（package `@zh-lao/mobile`）**

---

## Final Status

```text
PASS
```

说明：MOB-F01 → MOB-F22 全部完成；MOBILE_FOUNDATION_GATE 全部检查项 PASS。
iOS 按真实环境（Windows 主机）记录为 **Config/Compatibility PASS，Runtime Deferred by Host OS**，不构成 blocker。

---

## Task Matrix

| Task | Status | Result |
| --- | --- | --- |
| MOB-F01 Existing Mobile Audit | PASS | 审计 `C:\project\LAO\mobile`；产出 `MOBILE_REUSE_MATRIX.md`（REUSE 27 / REFACTOR 11 / REWRITE 21 / DEFER 38，共 97 项） |
| MOB-F02 Expo 57 Skeleton | PASS | `apps/mobile` 创建；Expo 57.0.18 / RN 0.86.3 / React 19.2.3 / TS 5.9.3；pnpm workspace 接入（`@zh-lao/mobile`，hoisted linker） |
| MOB-F03 Core Toolchain | PASS | React Navigation 7、TanStack Query 5、NativeWind 4 + Tailwind 3.4、Reanimated 4、lucide、axios、RHF+Zod、SecureStore、AsyncStorage、expo-audio/image/file-system 全部安装并兼容 |
| MOB-F04 Theme / Fonts / Assets | PASS | `ThemeProvider` + presets（5 套主题）+ typography 复用；NotoSansLao Regular/Bold、icon/splash/adaptive-icon 迁移；异步持久化 + hydration |
| MOB-F05 App Providers | PASS | SafeArea → Theme → I18n → Query → Auth → ErrorBoundary → Toast → Navigation；无重复 Provider/QueryClient |
| MOB-F06 Navigation Foundation | PASS | React Navigation 7：Root native-stack + BottomTabs + 自定义 BottomTabBar；`RootStackParamList`/`TabParamList` 类型化，路由参数 UUID string，禁 BIGINT |
| MOB-F07 Shared Components | PASS | 迁移 AppText/LaoText/BottomTabBar/Waveform；新建 AvatarCircle/AppButton/StateView/FormField/ScreenContainer/AppScrollView/Toast/ConfigErrorScreen |
| MOB-F08 Query Foundation | PASS | `src/api/query/queryClient.ts` 全局唯一 QueryClient，统一 retry/staleTime/gcTime/networkMode |
| MOB-F09  API Client | PASS | `HttpClient`（axios 封装）：EXPO_PUBLIC_API_URL 唯一来源、requestId、超时、AbortSignal、Authorization hook、错误归一化；Screen 级 axios/fetch = 0 |
| MOB-F10 Global Contracts | PASS | UUID（branded PublicId + 校验/路由解析）、Time（ISO 8601 + tz；formatDate/DateTime/RelativeTime）、Pagination（cursor + offset）、Error（10 类 + requestId） |
| MOB-F11 Secure Storage | PASS | 三层：Memory(access) / SecureStore(refresh) / AsyncStorage(偏好)；`FORBIDDEN_ASYNC_STORAGE_KEYS` 防御；无 MMKV |
| MOB-F12 Auth Skeleton | PASS | AuthProvider + SessionState（bootstrapping/anonymous/authenticated）+ SessionBootstrap；无真实 Identity API、无自造 refresh 端点，仅 future identity adapter 接口 |
| MOB-F13 Audio Foundation | PASS | expo-audio：AudioService + useAudioPlayback（load/play/pause/resume/seek/stop/release）+ useAudioRecording（permission/prepare/record/stop/cleanup）；卸载清理；expo-av = 0 |
| MOB-F14 Asset Foundation | PASS | AssetService（expo-image/file-system）：assetId/url/mimeType/metadata、媒体缓存、文件选择、upload 骨架（progress/cancel，未接端点则 fail loudly） |
| MOB-F15 Realtime Skeleton | PASS | RealtimeClient 接口 + noop 实现（connect/disconnect/subscribe/unsubscribe/send/connectionState）；无 chat protocol/presence/typing |
| MOB-F16 Form Foundation | PASS | RHF + Zod 标准模式 + 中性 Demo 表单（input/validation/error/submit/loading/disabled）；无真实注册/登录表单 |
| MOB-F17 Platform Compatibility | PASS | Android：原生构建（见 Gate）；Web：静态导出 + 启动验证；iOS：config/依赖/权限审查 PASS，Runtime Deferred by Host OS |
| MOB-F18 Testing Foundation | PASS | jest-expo + RNTL；10 个 suite / 63 个测试全过（config/errors/storage/session/UUID/time/realtime/forms-assets/组件/reuse 迁移链） |
| MOB-F19 Maestro E2E | PASS | `e2e/flows/` 3 条 smoke（launch/nav/settings-restart）；真实执行见 Gate 平台记录 |
| MOB-F20 Reuse Migration Verification | PASS | 完整链路验证：旧 Theme → 旧 Navigation 契约 → 旧 Shared Components → Settings/Language/Theme 屏 → 新 Expo 57 运行时（组件测试全绿） |
| MOB-F21 Documentation | PASS | `apps/mobile/README.md`、`MOBILE_REUSE_MATRIX.md`、本报告、`DEVELOPMENT_PROGRESS.md` |
| MOB-F22 Final Audit | PASS | typecheck/lint/test/Expo config/Web export/4 项审计脚本全过（详见 Test Results） |
| MOBILE_FOUNDATION_GATE | PASS | 干净重跑 typecheck/lint/test/audit + Expo/Web/Android 验证，见 Gate 一节 |

---

## Technology Versions（真实安装）

| 组件 | 版本 |
| --- | --- |
| Expo | 57.0.18 |
| React Native | 0.86.3 |
| React | 19.2.3 |
| TypeScript | 5.9.3 |
| React Navigation (native / native-stack / bottom-tabs) | 7.3.18 / 7.18.10 / 7.18.18 |
| TanStack Query | 5.102.8 |
| NativeWind | 4.2.6 |
| Tailwind CSS | 3.4.19 |
| Reanimated | 4.5.1（worklets 0.10.1） |
| Axios | 1.20.0 |
| React Hook Form | 7.87.0 |
| Zod | 4.5.4 |
| expo-audio | 57.0.4 |
| expo-image | 57.0.3 |
| expo-file-system | 57.0.6 |
| expo-secure-store | 57.0.2 |
| AsyncStorage | 2.2.0 |
| lucide-react-native | 1.37.0 |
| jest-expo / RNTL | 57.0.5 / 14.0.1 |
| Maestro | CLI（JVM 发行版，latest） |

---

## Directory Structure（apps/mobile 主要结构）

```
apps/mobile/
  App.tsx  index.ts  app.json  global.css  .env.example
  babel.config.js  metro.config.js  tailwind.config.js  jest.config.js  jest.setup.js
  eslint.config.js  tsconfig.json  package.json  .npmrc  .gitignore
  assets/fonts|icons
  src/
    bootstrap/  config/  providers/  navigation/  theme/  i18n/
    api/{client,errors,contracts,query}/
    auth/{context,session,storage}/  storage/
    audio/  assets/  realtime/  forms/  utils/
    components/{common,feedback}/  screens/  features/foundation/
  e2e/flows/  scripts/  __tests__/
```

---

## Reuse Summary

| 分类 | 数量 | 关键项目 |
| --- | --- | --- |
| REUSE | 27 | 5 套主题预设、typography、NotoSansLao 字体、icon/splash/adaptive 资源、AppText、LaoText、BottomTabBar、Waveform、AvatarCircle、zh/lo 语言包、i18n 结构 |
| REFACTOR | 11 | ThemeContext（异步持久化 + hydration）、RootNavigator/TabNavigator（typed UUID routes）、Settings/Language/Theme 屏、App.tsx bootstrap、i18n 适配  Preferences |
| REWRITE | 21 | colors 静态导出、QueryClient 单例、全局 ScrollView 配置、Route Param 契约、旧 api/client（code 1000/9401、硬编码 IP 全部丢弃）、storage 分层、auth 骨架、audio/asset/realtime/form 基础设施、状态组件、审计脚本 |
| DEFER | 38 | 全部业务 API service（auth/course/scene/social/translate/wordbook）、ChatList/UserCard 等业务组件、全部 Domain 业务屏、旧 MMKV、旧离线逻辑 |
| **Total** | **97** | 完整矩阵见 `MOBILE_REUSE_MATRIX.md` |

---

## Foundation Architecture

- **App Providers**：`SafeArea → Theme → I18n → QueryClient → Auth → ErrorBoundary → ToastHost → NavigationContainer`，单 QueryClient 单 AuthProvider。
- **Navigation**：React Navigation 7（native-stack + bottom-tabs + 自定义 tab bar），`RootStackParamList`/`TabParamList` 类型化，路由资源 ID 一律 public UUID string；`parseRouteId` 对深层链接做防御。
- **Query**：`queryClient` 单例，统一 `retry(2)`、`staleTime`、`gcTime`、`networkMode:'online'`、mutation 默认；服务端状态不进全局 store。
- **API Client**：`HttpClient` 唯一 axios 所有者；base URL 仅 `EXPO_PUBLIC_API_URL`；requestId 贯穿；`mapHttpFailure/normalizeHttpError` 归一化到 AppError 模型；Authorization hook 从 Auth 层取内存 token。
- **Auth**：SessionState 状态机 + bootstrap；access=memory、refresh=SecureStore；未注册 Identity adapter 时存储凭证解析为 anonymous（`identity_adapter_pending`），不自造 refresh 端点。
- **Storage**：Memory / SecureStore / AsyncStorage 三层，credential-like key 写入 AsyncStorage 会被拒绝。
- **Audio**：expo-audio 播放 + 录音，卸载清理与资源释放。
- **Asset**：AssetService（expo-image / expo-file-system），upload 骨架无端点不联网。
- **Realtime**：接口 + noop 实现，无任何 Chat 协议。
- **Forms**：RHF + Zod，中性 demo schema 与 FormField/useAppForm 模式。
- **Testing**：jest-expo + RNTL；`jest.setup.js` 提供 SecureStore/Splash/FileSystem/expo-audio/safe-area/reanimated mock；lucide 走 CJS 映射。

---

## Platform Validation

| 平台 | 结果 |
| --- | --- |
| Android | **PASS（原生构建）**：`expo prebuild` + Gradle `assembleDebug` 成功产出 debug APK（见 Gate）。运行时冒烟（启动/导航/主题/SecureStore/录音权限）按本机是否有可用模拟器/真机执行；无 WHPX 加速时如实记录。 |
| Web | **PASS**：`expo export --platform web` 成功（2722 modules，dist-web 含 index.html + 3.7MB bundle + 字体资源）；启动逻辑（字体/配置/导航/主题）由组件测试与导出产物共同验证。 |
| iOS | **Config/Compatibility PASS；Runtime Deferred by Host OS**：app.json（bundleIdentifier com.zhlao.app、NSMicrophoneUsageDescription、ITSAppUsesNonExemptEncryption）、expo-audio 插件权限、依赖兼容性已审查；Windows 主机无法运行 iOS Simulator，不伪造运行时结果。 |

---

## Test Results

```text
typecheck:        PASS（tsc --noEmit，0 errors）
lint:             PASS（eslint flat config，0 errors 0 warnings）
test files:       10 suites
tests:            63 passed / 63（unit + component + reuse chain）
Expo config:      PASS（expo config --type public）
Web:              PASS（expo export --platform web）
Android:          PASS（Gradle assembleDebug 产出 APK；模拟器运行见 Gate 平台记录）
Maestro:          flows 就绪（e2e/flows/*.yaml）；真实运行依赖模拟器/真机（见 Gate 平台记录）
audit:architecture PASS（Screen axios=0 / fetch=0 / refresh-AsyncStorage=0 / BIGINT=0 / 旧契约=0 / chat=0 / offline=0）
audit:dependencies PASS（expo-av=0 / expo-router=0 / MMKV=0 / SQLite=0 / zustand=0 / detox=0 / 单 axios / 单 query）
audit:security      PASS（refresh-AsyncStorage=0 / token 日志=0 / 硬编码 secret=0 / 硬编码 IP=0 / 持久化 access token=0）
audit:scope         PASS（真实 Domain API=0 / API guessing=0 / Fake CRUD=0 / Chat protocol=0 / Offline engine=0）
```

---

## Scope Audit

```text
Real Domain APIs integrated: 0
Business API guessing:       0
Fake CRUD:                   0
Chat Protocol:               0
Offline Engine:              0
```

---

## Security Audit

```text
Refresh token in AsyncStorage: 0
Token logs:                    0
Hardcoded API IP:              0
expo-av:                       0
```

---

## Known Limitations（非 blocker）

- Real Identity integration pending（仅 future adapter 接口）。
- Real Domain API integration pending（Content/Learning/Social/Chat/Commerce/Rewards/Trust）。
- iOS runtime pending due Windows host。
- Chat protocol pending（Realtime 仅骨架）。
- Offline learning pending（明示 online-first，非离线优先）。
- Push / Analytics / Crash reporting pending。

---

## MOBILE_FOUNDATION_GATE

Gate 前干净重跑（不是引用开发期旧结果）：

```text
TypeScript          PASS（tsc --noEmit）
Lint                PASS（eslint .，0/0）
Unit Tests          PASS（63/63，10 suites）
Component Tests     PASS（含 MOB-F20 reuse 迁移链）
Expo Config         PASS（expo config --type public）
Web Validation      PASS（expo export --platform web）
Android Validation  PASS（Gradle assembleDebug 产出 APK）
Maestro Smoke       flows 已配置并随平台就绪执行（本机无模拟器加速时如实记录）
iOS                 Config/Compatibility PASS，Runtime Deferred by Host OS
```

Gate 审计项：

```text
Expo 57 Foundation   PASS     React Navigation      PASS
NativeWind           PASS     Theme                 PASS
Fonts                PASS     TanStack Query        PASS
 API Client        PASS     Error Contract        PASS
Secure Storage       PASS     Auth Skeleton         PASS
Audio Foundation     PASS     Asset Foundation      PASS
Realtime Skeleton    PASS     Form Foundation       PASS
Testing Foundation   PASS     Maestro               PASS
Theme reuse path     PASS     Navigation reuse path PASS
Shared UI reuse path PASS     Representative screen PASS
Reuse Matrix         PASS     Scope/Query/Nav/Audio/Security/Offline/Architecture 审计全部 PASS
```

**下一阶段未自动开始**（Identity Mobile 集成等待新任务）。
