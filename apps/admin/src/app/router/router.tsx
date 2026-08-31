import * as React from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useRouterState,
} from '@tanstack/react-router'
import { z } from 'zod'
import { zodSearch } from '@/lib/search-validator'
import { AppProviders } from '@/app/providers/AppProviders'
import { ErrorBoundary } from '@/components/feedback/error-boundary'
import { AppShell } from '@/components/navigation/app-shell'
import { PageLoading } from '@/components/feedback/loading'
import { DomainPlaceholder } from '@/pages/domain-placeholder'
import { NotFoundPage } from '@/pages/not-found'
import { LoginPage } from '@/pages/login'
import { UnauthorizedPage } from '@/pages/unauthorized'
import { AuthGuard } from '@/auth/guards/AuthGuard'

/* ---------- Lazy page components (route-level code splitting) ---------- */

const OverviewPage = React.lazy(() =>
  import('@/pages/overview/overview').then((module) => ({ default: module.OverviewPage })),
)

const DesignSystemPage = React.lazy(() =>
  import('@/pages/system/design-system').then((module) => ({ default: module.DesignSystemPage })),
)

const PlatformLandingPage = React.lazy(() =>
  import('@/features/platform/pages/landing').then((module) => ({ default: module.PlatformLandingPage })),
)
const FeatureFlagsPage = React.lazy(() =>
  import('@/features/platform/pages/feature-flags').then((module) => ({ default: module.FeatureFlagsPage })),
)
const RuntimeConfigsPage = React.lazy(() =>
  import('@/features/platform/pages/runtime-configs').then((module) => ({ default: module.RuntimeConfigsPage })),
)
const AppVersionsPage = React.lazy(() =>
  import('@/features/platform/pages/app-versions').then((module) => ({ default: module.AppVersionsPage })),
)
const AnnouncementsPage = React.lazy(() =>
  import('@/features/platform/pages/announcements').then((module) => ({ default: module.AnnouncementsPage })),
)
const RegionsPage = React.lazy(() =>
  import('@/features/platform/pages/regions').then((module) => ({ default: module.RegionsPage })),
)

/* ---------- Root ---------- */

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return (
    <AppProviders>
      <ErrorBoundary resetKey={pathname}>
        <React.Suspense fallback={<PageLoading />}>
          <Outlet />
        </React.Suspense>
      </ErrorBoundary>
    </AppProviders>
  )
}

export const rootRoute = createRootRoute({ component: RootComponent })

/* ---------- App shell (authenticated back-office layout) ---------- */

const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'shell',
  component: () => <AuthGuard><AppShell><Outlet /></AppShell></AuthGuard>,
})

/* ---------- Routes inside the shell ---------- */

const indexRoute = createRoute({ getParentRoute: () => shellRoute, path: '/', component: OverviewPage })

function makeDomainRoute(path: string, domain: string, title: string, description: string) {
  return createRoute({
    getParentRoute: () => shellRoute,
    path,
    component: () => <DomainPlaceholder domain={domain} title={title} description={description} />,
  })
}

const contentRoute = makeDomainRoute('/content', 'content', 'Content', '学习内容定义（Content Domain）')
const learningRoute = makeDomainRoute('/learning', 'learning', 'Learning', '用户学习状态（Learning Domain）')
const audioRoute = makeDomainRoute('/audio', 'audio', 'Audio Production', '音频生产流程（Audio Production Domain）')
const identityRoute = makeDomainRoute('/identity', 'identity', 'Identity', '用户身份（Identity Domain）')
const socialRoute = makeDomainRoute('/social', 'social', 'Social', '社交资料与关系（Social Domain）')
const chatRoute = makeDomainRoute('/chat', 'chat', 'Chat', '会话与消息（Chat Domain）')
const commerceRoute = makeDomainRoute('/commerce', 'commerce', 'Commerce', '商品、订单、支付、钱包（Commerce Domain）')
const rewardsRoute = makeDomainRoute('/rewards', 'rewards', 'Rewards', '奖励资格与发放（Rewards Domain）')
const trustRoute = makeDomainRoute('/trust', 'trust', 'Trust & Safety', '举报与治理（Trust & Safety Domain）')
const operationsRoute = makeDomainRoute('/operations', 'operations', 'Operations', '运营人员与权限（Operations Domain）')

const platformRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform', component: PlatformLandingPage })
const platformFeatureFlagsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform/feature-flags', component: FeatureFlagsPage })
const platformRuntimeConfigsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform/runtime-configs', component: RuntimeConfigsPage })
const platformAppVersionsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform/app-versions', component: AppVersionsPage })
const platformAnnouncementsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform/announcements', component: AnnouncementsPage })
const platformRegionsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform/regions', component: RegionsPage })

const designSystemSearchSchema = z.object({ section: z.string().default('overview') })

function DesignSystemRouteComponent() {
  const search = useRouterState({ select: (state): Record<string, unknown> => state.location.search as Record<string, unknown> })
  const section = typeof search.section === 'string' ? search.section : 'overview'
  return <DesignSystemPage section={section} />
}

const designSystemRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/system/design-system',
  validateSearch: zodSearch(designSystemSearchSchema),
  component: DesignSystemRouteComponent,
})

/* ---------- Standalone routes ---------- */

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage })
const unauthorizedRoute = createRoute({ getParentRoute: () => rootRoute, path: '/unauthorized', component: UnauthorizedPage })

/* ---------- Catch-all (renders inside the app shell) ---------- */

const notFoundRoute = createRoute({ getParentRoute: () => shellRoute, path: '$', component: NotFoundPage })

/* ---------- Tree + router ---------- */

const routeTree = rootRoute.addChildren([
  shellRoute.addChildren([
    indexRoute,
    contentRoute,
    learningRoute,
    audioRoute,
    identityRoute,
    socialRoute,
    chatRoute,
    commerceRoute,
    rewardsRoute,
    trustRoute,
    operationsRoute,
    platformRoute,
    platformFeatureFlagsRoute,
    platformRuntimeConfigsRoute,
    platformAppVersionsRoute,
    platformAnnouncementsRoute,
    platformRegionsRoute,
    designSystemRoute,
    notFoundRoute,
  ]),
  loginRoute,
  unauthorizedRoute,
])

export const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true })

export { designSystemSearchSchema, routeTree }
