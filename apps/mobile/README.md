# ZH-LAO V2 Mobile (apps/mobile)

Expo SDK 57 / React Native 0.86 / React 19.2 / TypeScript mobile client for the
ZH-LAO learning & social platform. This is the **Mobile Foundation**: the
infrastructure layer that Domain phases (Identity, Content, Learning, Social,
Chat, Commerce, ...) build on. No real business API is integrated in this
phase.

## Tech Stack (frozen)

| Area | Choice | Version (installed) |
| --- | --- | --- |
| Framework | Expo SDK | 57.0.18 |
| Runtime | React Native | 0.86.3 |
| UI library | React | 19.2.3 |
| Language | TypeScript | 5.9.3 |
| Navigation | React Navigation 7 (native-stack + bottom-tabs) | 7.3.18 / 7.18.10 / 7.18.18 |
| Server state | TanStack Query | 5.102.8 |
| Styling | NativeWind 4 + Tailwind CSS 3.4 | 4.2.6 / 3.4.19 |
| Animation | Reanimated 4 | 4.5.1 |
| Icons | lucide-react-native | 1.37.0 |
| HTTP | axios (wrapped by V2HttpClient) | 1.20.0 |
| Forms | React Hook Form + Zod | 7.87.0 / 4.5.4 |
| Secure storage | expo-secure-store | 57.0.2 |
| Preferences | @react-native-async-storage/async-storage | 2.2.0 |
| Audio | expo-audio | 57.0.4 |
| Image | expo-image | 57.0.3 |
| File system | expo-file-system | 57.0.6 |
| Testing | jest-expo + React Native Testing Library | 57.0.5 / 14.0.1 |
| E2E | Maestro | CLI (JVM) |

Forbidden in this app: Expo Router, expo-av, Redux, Zustand (default), Detox,
SQLite / offline-first engines, MMKV, Tailwind CSS 4.

## Commands

```bash
# install (pnpm workspace; hoisted linker for NativeWind/Metro)
pnpm install

# dev servers
pnpm start          # Expo dev server (Metro) on :8090
pnpm android        # start + launch Android
pnpm ios            # start + launch iOS (macOS host only)
pnpm web            # start + launch web

# static export
pnpm export:web     # -> dist-web
pnpm export:android # -> dist-android

# validation
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint (flat config, jest globals for __tests__)
pnpm test           # jest (unit + component, RNTL)
pnpm test:coverage
pnpm expo:config    # expo config --type public
pnpm expo:doctor    # expo-doctor

# audits (MOB-F22)
pnpm audit:architecture
pnpm audit:dependencies
pnpm audit:security
pnpm audit:scope
pnpm audit          # all four
pnpm verify         # typecheck + lint + test + audit

# e2e (Android emulator / device required)
pnpm e2e            # maestro test e2e/flows
```

## Directory

```
apps/mobile/
  App.tsx                    # entry: providers + navigation + splash
  index.ts                   # registerRootComponent
  global.css                 # Tailwind entry (NativeWind)
  app.json                   # Expo config (package com.zhlao.app)
  src/
    bootstrap/               # useAppBootstrap (fonts + config + splash)
    config/                  # env.ts: EXPO_PUBLIC_* parsing + validation
    providers/               # ErrorBoundary, AppProviders tree
    navigation/              # RootNavigator, TabNavigator, typed routes, linking
    api/
      client/                # V2HttpClient (axios wrapper) + types
      errors/                # AppError model + HTTP -> error mapping
      contracts/             # UUID / Time / Pagination contracts
      query/                 # single QueryClient
    auth/
      context/               # AuthProvider
      session/               # SessionState, bootstrap, future Identity adapter
      storage/               # TokenStore (access=memory, refresh=SecureStore)
    storage/                 # memory / SecureStore / AsyncStorage layering
    audio/                   # AudioService, playback & recording hooks (expo-audio)
    assets/                  # AssetService over expo-image / expo-file-system
    realtime/                # RealtimeClient interface + noop client
    forms/                   # RHF + Zod standard pattern (neutral demo schema)
    theme/                   # ThemeProvider, presets (legacy palettes), typography
    i18n/                    # zh/lo locales, I18nProvider
    components/
      common/                # AppText, LaoText, AppButton, AvatarCircle, BottomTabBar, Waveform, StateView, FormField, ScreenContainer, AppScrollView
      feedback/              # Toast, ConfigErrorScreen
    screens/                 # Home, Lab, ResourceDetail, NotFound, settings/*
    features/foundation/     # neutral labs (audio/form/asset/realtime demos)
    utils/                   # logger, requestId
  e2e/flows/                 # Maestro smoke flows
  scripts/                   # audit scripts (check-architecture / -dependencies / -security / -scope)
  __tests__/                 # jest unit + component tests
  assets/fonts/              # NotoSansLao Regular/Bold
```

## Architecture

### Provider tree

```
SafeAreaProvider
└─ ThemeProvider (persists theme_id via preferences)
   └─ I18nProvider (interface + learning language, persisted)
      └─ QueryClientProvider (single QueryClient)
         └─ AuthProvider (SessionState; tokenStore seam)
            └─ ErrorBoundary
               └─ ToastHost
                  └─ NavigationContainer -> RootNavigator
```

There is exactly **one** QueryClient (`src/api/query/queryClient.ts`) with a
unified retry / staleTime / gcTime / networkMode / mutation policy.

### Navigation

- React Navigation 7 only. Root native-stack + BottomTabs (custom
  `BottomTabBar` reusing the legacy UI).
- Route params are typed (`src/navigation/types.ts`) and any resource id
  carried by a route is a **public UUID string** — database BIGINT ids are
  never part of the navigation contract (`parseRouteId` guards deep links).

### API client

- `V2HttpClient` (axios-based) is the only transport owner. Screens never
  import axios or call fetch.
- Base URL comes from `EXPO_PUBLIC_API_URL` **only** — there is no hardcoded
  developer IP fallback. Missing config surfaces a blocking config screen on
  native; web falls back to the page origin.
- Every request gets a `requestId`; errors are normalised into the
  `AppError` model (`network/timeout/unauthorized/forbidden/not_found/
  validation/conflict/rate_limit/server/unknown`), with backend
  stack traces never surfaced to users.

### Auth & storage layering

```
Access token  -> memory          (never persisted, never logged)
Refresh token -> Expo SecureStore (Keychain / KeyStore)
Preferences   -> AsyncStorage    (non-sensitive only)
```

`AuthProvider` models `bootstrapping / anonymous / authenticated` with a
`SessionBootstrap`. The Foundation **does not call or invent** any Identity /
refresh endpoint — a `future identity adapter` interface is registered by the
Identity phase later. Until then a stored credential resolves to `anonymous`
with `reason: identity_adapter_pending`.

### Audio / Asset / Realtime / Forms

- `expo-audio` only (expo-av = 0): `AudioService` + `useAudioPlayback`
  (load/play/pause/resume/seek/stop/release) + `useAudioRecording`
  (permission/prepare/record/stop/cleanup) with screen-unmount cleanup.
- `AssetService` over expo-image / expo-file-system: asset refs, mime
  guessing, media cache, file picking and an **upload skeleton** that fails
  loudly until a real V2 upload contract exists.
- `RealtimeClient` interface only (connect/disconnect/subscribe/unsubscribe/
  send/connectionState). No chat protocol, presence, typing, read receipts —
  those belong to the Chat phase.
- Forms: React Hook Form + Zod with a neutral demo schema, `FormField`,
  `useAppForm`, and a standard input/validation/error/submit/loading/disabled
  pattern. No real login/register form.

## Testing & platform strategy

- Jest (jest-expo preset) + React Native Testing Library. Unit tests cover
  config, error mapping, storage layering, session bootstrap, UUID, time,
  realtime skeleton, forms/assets. Component tests cover theme, AppText/
  LaoText, StateView, AppButton, and the MOB-F20 reuse chain (Settings/
  Language/Theme screens on the new runtime).
- Android: validated via native build + (when an emulator/device is
  available) real boot with Maestro smoke flows.
- Web: validated via static export; native-only capabilities degrade
  gracefully (SecureStore reports unsupported instead of crashing).
- iOS: config/dependency/permission review only — runtime validation is
  deferred on a Windows host.

## Environment

Copy `.env.example` to `.env` and set at least `EXPO_PUBLIC_API_URL` (no
trailing slash). Expo inlines `EXPO_PUBLIC_*` at bundle time, so the keys are
read statically in `src/config/env.ts`.
