---
status: complete
last_updated: 2026-09-02
lifecycle: historical
---

# ZH-LAO  — Mobile Reuse Matrix

**文件：`MOBILE_REUSE_MATRIX.md`**
**Phase：Mobile Foundation（MOB-F01）**
**参考实现：`https://github.com/rzyao/LAO/tree/main/mobile`（本地镜像 `C:\project\LAO\mobile`）**
**历史参考优先级（仅记录 Mobile Foundation 当时的基线，不构成现行 authority）：`MASTER_DEVELOPMENT_PLAN.md` → `MOBILE_TECH_STACK.md` → `MOBILE_FOUNDATION_PLAN.md` → 现有 ZH-LAO 架构 → 参考 Mobile**

> 现行流程、Gate、完成状态和动态调度分别以[开发流程控制中心](DEVELOPMENT_CONTROL_CENTER.md)、[开发进度记录表](DEVELOPMENT_PROGRESS.md)和[当前下一动作](workflow/NEXT_ACTIONS.md)为准。

---

## 1. 分类定义

| 分类 | 含义 | 处置方式 |
| --- | --- | --- |
| `REUSE` | 与最终产品一致、无旧 API / 旧 Backend Contract 强耦合、无明显架构问题 | 迁入 `apps/mobile`，仅做路径与命名适配 |
| `REFACTOR` | UI / 语义基本可保留，但包含旧 API、旧 ID、旧 auth 假设、旧 storage 或架构耦合 | 保留外观与交互，重建数据与依赖 |
| `REWRITE` | 旧结构严重阻碍 、旧契约不得作为  Authority、或技术栈已冻结替换 | 丢弃旧实现，按  规范新建 |
| `DEFER` | 属于具体 Domain 业务，Foundation 阶段不迁移 | 等待对应 Domain API 冻结后进入 `features/<domain>` |

---

## 2. Theme / Typography

| Item | Type | Decision | Notes |
| --- | --- | --- | --- |
| `src/theme/presets.ts`（`THEME_PRESETS` / `AppTheme` / `AppThemeTokens`） | Theme | `REUSE` | 5 套主题预设与 Token 结构直接复用，无 API 依赖 |
| `src/theme/typography.ts`（`FONT_FAMILIES` / `TYPOGRAPHY` / `TypographyVariant`） | Typography | `REUSE` | 老挝语 / 中文 / 数字三套字体族与排版 Token 直接复用 |
| `src/theme/colors.ts`（静态导出 `THEME_PRESETS[0].tokens`） | Theme | `REWRITE` | 静态调色板绕过当前激活主题， 一律从 ThemeContext 取 Token |
| `src/theme/ThemeContext.tsx` | Theme | `REFACTOR` | 保留 `theme/colors/themeId/setThemeId` 契约；持久化从同步 storage 改为异步 Preferences Store（AsyncStorage），补齐 hydration 状态 |
| `App.tsx` 内联 `new QueryClient(...)` | Server State | `REWRITE` | 迁移至 `src/api/query/queryClient.ts` 单例，统一 retry/staleTime/gcTime |
| `App.tsx` 全局 `ScrollView/FlatList/SectionList.defaultProps` 变更 | UI 基础设施 | `REWRITE` | 计划 §58 禁止无评估直接复制全局 mutation； 封装为显式 `<AppScrollView>` 组件 |
| `App.tsx` Splash / 字体加载流程 | Bootstrap | `REFACTOR` | 保留 `expo-splash-screen` + `expo-font`，但失败必须 fail-open 且由统一 Bootstrap 编排 |

---

## 3. Fonts / Assets

| Item | Type | Decision | Notes |
| --- | --- | --- | --- |
| `assets/fonts/NotoSansLao-Regular.ttf` | Font | `REUSE` | 二进制直接复制 |
| `assets/fonts/NotoSansLao-Bold.ttf` | Font | `REUSE` | 二进制直接复制 |
| `assets/icon.png` | Asset | `REUSE` | App icon |
| `assets/favicon.png` | Asset | `REUSE` | Web favicon |
| `assets/splash-icon.png` | Asset | `REUSE` | Splash icon |
| `assets/android-icon-foreground.png` | Asset | `REUSE` | Android adaptive icon |
| `assets/android-icon-background.png` | Asset | `REUSE` | Android adaptive icon |
| `assets/android-icon-monochrome.png` | Asset | `REUSE` | Android adaptive icon |

---

## 4. Navigation

| Item | Type | Decision | Notes |
| --- | --- | --- | --- |
| `src/navigation/RootNavigator.tsx` | Navigation | `REFACTOR` | 保留 `NavigationContainer` + Native Stack 结构与 `slide_from_right` 转场；移除全部业务 Screen 导入，改为 typed route 与 UUID 参数 |
| `src/navigation/TabNavigator.tsx` | Navigation | `REFACTOR` | 保留自定义 `BottomTabBar` 与底部 UX；Foundation 阶段只保留中性 Tab，业务 Tab 等 Domain 阶段接入 |
| Route Param 契约 | Contract | `REWRITE` | 旧实现未定义类型化 Param； 强制 `RootStackParamList` / `TabParamList`，业务 ID 一律 `string` UUID，禁止 BIGINT |

---

## 5. Shared Components（Foundation 级通用组件）

| Item | Type | Decision | Notes |
| --- | --- | --- | --- |
| `src/components/AppText.tsx` | Component | `REUSE` | 通用文本：Typography Token + 主题色语义映射 + Lao/Num 字体分支 |
| `src/components/LaoText.tsx` | Component | `REUSE` | 老挝语排版组件与 `normalizeLaoText`（组合符号 ◌ 占位修复）直接复用 |
| `src/components/BottomTabBar.tsx` | Component | `REUSE` | 底部导航视觉与 Lao/中文标签切换逻辑保留 |
| `src/components/AvatarCircle.tsx` | Component | `REUSE` | 圆形头像渲染（预设色块 / URL）保留，无 API 依赖 |
| `src/components/Toast.tsx`（`ToastHost` + `toast` API） | Component | `REUSE` | 全局轻提示与 external store 模式保留 |
| `src/components/Waveform.tsx` | Component | `REFACTOR` | 视觉保留；旧实现 import 静态 `colors` 而非 `useTheme()`，必须改为主题驱动 |
| Error / Empty / Loading 状态组件 | Component | `REWRITE` | 旧 Mobile 无统一状态组件， 新建（`StateView` / `ErrorState` / `EmptyState`） |

---

## 6. Business Components（明确带业务语义）

| Item | Type | Decision | Notes |
| --- | --- | --- | --- |
| `src/components/ChatList.tsx` | Component | `DEFER` | Chat Domain → 未来 `features/chat`；禁止进入 `components/common` |
| `src/components/UserCard.tsx` | Component | `DEFER` | Social Domain → 未来 `features/social` |
| `src/components/DecomposeModal.tsx` | Component | `DEFER` | Content / Learning Domain（汉字/词汇拆解） |
| `src/components/DeactivateModal.tsx` | Component | `DEFER` | Identity Domain（账号注销） |
| `src/utils/avatar.ts`（`preset:N` avatar 契约） | Util | `DEFER` | 旧 avatar 契约属 Identity/Social；Foundation 只保留通用渲染，不继承 `preset:` 语义 |

---

## 7. Screens

Foundation 只迁移低业务耦合的代表性页面用于验证复用链路（计划 §76）。

| Item | Type | Decision | Notes |
| --- | --- | --- | --- |
| `screens/settings/ThemeScreen.tsx` | Screen | `REUSE` | 代表性页面：纯 Theme UI + `setThemeId`，零 API 依赖 |
| `screens/settings/LanguageSettingScreen.tsx` | Screen | `REFACTOR` | 代表性页面：UI 保留，语言偏好改由  Preferences Store 承载（不再借用 `user_profile`） |
| `screens/settings/LanguageSelectScreen.tsx` | Screen | `REFACTOR` | 同上 |
| `screens/settings/SettingsScreen.tsx` | Screen | `REFACTOR` | 只迁入「主题 / 语言 / 关于」等本地偏好分组；旧 `authApi.getProfile` 与交友开关属 Identity / Social，Foundation 不接入 |
| `screens/auth/AuthScreen.tsx` | Screen | `DEFER` | Identity Domain（Login/OTP/Register），等 Identity API 冻结 |
| `screens/profile/ProfileScreen.tsx` | Screen | `DEFER` | Identity Domain |
| `screens/profile/EditProfileScreen.tsx` | Screen | `DEFER` | Identity Domain |
| `screens/profile/AccountSecurityScreen.tsx` | Screen | `DEFER` | Identity Domain（Session / Password） |
| `screens/course/CourseMapScreen.tsx` | Screen | `DEFER` | Content Domain |
| `screens/course/CourseLessonsScreen.tsx` | Screen | `DEFER` | Content Domain |
| `screens/lesson/LessonScreen.tsx` | Screen | `DEFER` | Content / Learning Domain |
| `screens/practice/PracticeScreen.tsx` | Screen | `DEFER` | Learning Domain |
| `screens/learn-lao/LaoLearnScreen.tsx` | Screen | `DEFER` | Learning Domain |
| `screens/review/ReviewScreen.tsx` | Screen | `DEFER` | Learning Domain |
| `screens/wordbook/WordbooksScreen.tsx` | Screen | `DEFER` | Learning Domain |
| `screens/wordbook/WordbookItemsScreen.tsx` | Screen | `DEFER` | Learning Domain |
| `screens/wordbook/WordDetailScreen.tsx` | Screen | `DEFER` | Learning Domain |
| `screens/dailywords/DailyWordsScreen.tsx` | Screen | `DEFER` | Content Domain |
| `screens/dialogue/SceneListScreen.tsx` | Screen | `DEFER` | Content Domain |
| `screens/dialogue/DialogueScreen.tsx` | Screen | `DEFER` | Content / Learning Domain |
| `screens/shadow/ShadowScreen.tsx` | Screen | `DEFER` | Learning Domain |
| `screens/roleplay/RolePlayScreen.tsx` | Screen | `DEFER` | Learning Domain |
| `screens/phrasebook/PhraseBookScreen.tsx` | Screen | `DEFER` | Content Domain |
| `screens/translate/TranslateScreen.tsx` | Screen | `DEFER` | Content Domain（翻译 Use Case 未冻结） |
| `screens/social/DiscoverScreen.tsx` | Screen | `DEFER` | Social Domain |
| `screens/social/ChatsScreen.tsx` | Screen | `DEFER` | Chat Domain |
| `screens/social/ChatScreen.tsx` | Screen | `DEFER` | Chat Domain（含 Realtime Protocol，Foundation 禁止猜测） |
| `screens/social/SocialProfileScreen.tsx` | Screen | `DEFER` | Social Domain |

---

## 8. API / HTTP

| Item | Type | Decision | Notes |
| --- | --- | --- | --- |
| `src/api/client.ts`（Axios 实例 + 信封解包 + 401 刷新） | Infrastructure | `REWRITE` | 旧 `code === 1000` / `code === 9401` / `/api/app/auth/refresh` 与硬编码 `192.168.50.210:3030` 不得进入 ；由 `HttpClient` 取代 |
| `src/api/services/auth.ts` | API | `DEFER` | 仅作为 UI 集成参考；Identity API 冻结后重建 adapter |
| `src/api/services/course.ts` | API | `DEFER` | Content API 冻结后重建 |
| `src/api/services/scene.ts` | API | `DEFER` | Content API 冻结后重建 |
| `src/api/services/social.ts` | API | `DEFER` | Social / Chat API 冻结后重建 |
| `src/api/services/translate.ts` | API | `DEFER` | Translate Use Case 冻结后重建 |
| `src/api/services/wordbook.ts` | API | `DEFER` | Learning API 冻结后重建 |
| `src/api/audio.ts`（`ContentAudio` slot 契约） | Contract | `DEFER` | 属 Content Domain 音频契约，Foundation 不继承 |

---

## 9. Auth / Storage

| Item | Type | Decision | Notes |
| --- | --- | --- | --- |
| `src/utils/storage.ts`（内存镜像 + AsyncStorage + `APP_TOKEN` / `APP_REFRESH_TOKEN`） | Infrastructure | `REWRITE` | Refresh Token 存 AsyncStorage 违反  安全规则；由 Memory / SecureStore / AsyncStorage 三层取代 |
| `src/utils/storage.ts` → `useAuthToken()` | Auth | `REWRITE` | 由 `AuthProvider` / `useAuth()` 取代，Foundation 阶段不接真实 Identity API |
| `src/hooks/useLanguageProfile.ts` | Client State | `REFACTOR` | UI 与语言推导逻辑保留；底层从 `user_profile` 改为  Preferences Store（AsyncStorage） |

---

## 10. Audio

| Item | Type | Decision | Notes |
| --- | --- | --- | --- |
| `src/hooks/useAudioPlayer.ts` | Audio | `REWRITE` | `expo-av` → `expo-audio`；由 `AudioService` + `useAudioPlayback` 取代，统一生命周期与资源释放 |
| `src/hooks/useAudioRecorder.ts` | Audio | `REWRITE` | `expo-av` → `expo-audio`；由 `useAudioRecording` 取代（permission / prepare / record / stop / cleanup） |
| `expo-av` config plugin（`microphonePermission`） | Dependency | `REWRITE` | 替换为 `expo-audio` 配置与权限说明 |

---

## 11. Asset / Realtime / Forms / Testing

| Item | Type | Decision | Notes |
| --- | --- | --- | --- |
| 统一 Asset 层（`expo-image` + `expo-file-system`） | Infrastructure | `REWRITE` | 旧 Mobile 无统一 Asset 抽象（散落 `Image` + `getAssetUrl`）， 新建 `AssetService` |
| Realtime 基础设施 | Infrastructure | `REWRITE` | 旧 Mobile 只有轮询，无 Realtime； 新建 `RealtimeClient` Skeleton（不实现 Chat Protocol） |
| Form 基础设施（React Hook Form + Zod） | Infrastructure | `REWRITE` | 旧 Mobile 无统一 Form 层， 新建 |
| Testing 基础设施（Jest + RNTL + Maestro） | Infrastructure | `REWRITE` | 旧 Mobile 零测试， 新建 |

---

## 12. i18n

| Item | Type | Decision | Notes |
| --- | --- | --- | --- |
| `src/i18n/index.ts`（`useI18n` / `fmt`） | i18n | `REUSE` | 国际化能力保留，Foundation 不重写业务文案体系 |
| `src/i18n/locales/zh.ts` | i18n | `REUSE` | 直接迁入 |
| `src/i18n/locales/lo.ts` | i18n | `REUSE` | 直接迁入 |

---

## 13. Dependencies

| Item | Type | Decision | Notes |
| --- | --- | --- | --- |
| `expo-av` | Dependency | `REWRITE` | 由 `expo-audio` 取代； 依赖与 import 计数必须为 0 |
| `react-native-mmkv` | Dependency | `REWRITE` | 审计确认零引用， 不安装（计划 §37） |
| `expo ~54` / `react-native 0.81` / `react 19.1` | Dependency | `REWRITE` | 升级为 Expo SDK 57 / RN 0.86 / React 19.2 |
| `nativewind ^4.2` + `tailwindcss ^3.4` | Dependency | `REUSE` | 冻结组合，禁止升到 Tailwind 4 |
| `react-native-reanimated ~4.1` | Dependency | `REUSE` | 随 SDK 57 对齐到 4.5.x |
| `lucide-react-native` | Dependency | `REUSE` | 图标库保留 |
| `@tanstack/react-query ^5` | Dependency | `REUSE` | Server State 方案保留，客户端配置重写 |
| `@react-navigation/*` v7 | Dependency | `REUSE` | React Navigation 7 保留，禁止 Expo Router |
| `axios` | Dependency | `REUSE` | Transport 保留，Client 重写 |
| react-native-testing-library / jest / maestro | Dependency | `REWRITE` | 旧 Mobile 无测试依赖， 新建 |

---

## 14. 汇总

| Decision | Count |
| --- | --- |
| `REUSE` | 26 |
| `REFACTOR` | 9 |
| `REWRITE` | 20 |
| `DEFER` | 37 |
| **Total** | **92** |

关键结论：

1. **UI 资产（Theme / Typography / Fonts / Assets / 通用组件 / i18n）以 `REUSE` 为主** —— 符合「保留成熟产品体验」的核心原则。
2. **基础设施（API Client / Auth Storage / Audio / Asset / Realtime / Form / Testing）全部 `REWRITE`** —— 彻底切断旧数据层、认证层与 `expo-av` 依赖。
3. **业务页面与业务组件（28 Screen 中 24 个 + 4 个业务组件 + 7 个 API Service）全部 `DEFER`** —— Foundation 不猜测未冻结的 Domain Contract。
4. **代表性迁移链路**：`presets.ts`（Theme）→ `RootNavigator/TabNavigator`（Navigation）→ `AppText/LaoText/BottomTabBar`（Shared Component）→ `ThemeScreen / LanguageSettingScreen`（Representative Screen）→ Expo 57 Runtime。
