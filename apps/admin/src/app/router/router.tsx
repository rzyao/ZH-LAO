import { Suspense } from 'react'
import {
  createRootRoute,
  createRoute,
  createRouter,
  defaultStringifySearch,
  lazyRouteComponent,
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
import { LaoLetterSearchSchema } from '@/features/content/structured/contracts'

/* ---------- Lazy page components (route-level code splitting) ---------- */

const OverviewPage = lazyRouteComponent(() =>
  import('@/pages/overview/overview').then((module) => ({ default: module.OverviewPage })),
)

const DesignSystemPage = lazyRouteComponent(() =>
  import('@/pages/system/design-system').then((module) => ({ default: module.DesignSystemPage })),
)

const ContentLandingPage = lazyRouteComponent(() =>
  import('@/features/content/pages/landing').then((module) => ({ default: module.ContentLandingPage })),
)
const AlphabetPage = lazyRouteComponent(() =>
  import('@/features/content/alphabet/pages/AlphabetPage').then((module) => ({ default: module.AlphabetPage })),
)
const ContentCategoryPage = lazyRouteComponent(() =>
  import('@/features/content/pages/category').then((module) => ({ default: module.ContentCategoryPage })),
)
const LaoLetterPage = lazyRouteComponent(() =>
  import('@/features/content/structured/lo-letter-page').then((module) => ({ default: module.LaoLetterPage })),
)
const ContentReviewPage = lazyRouteComponent(() =>
  import('@/features/content/pages/category').then((module) => ({ default: module.ContentReviewPage })),
)
const CourseListPage = lazyRouteComponent(() =>
  import('@/features/content/courses/pages/course-list').then((module) => ({ default: module.CourseListPage })),
)
const CourseEditorPage = lazyRouteComponent(() =>
  import('@/features/content/courses/pages/course-editor').then((module) => ({ default: module.CourseEditorPage })),
)
const CourseDetailPage = lazyRouteComponent(() =>
  import('@/features/content/courses/pages/course-detail').then((module) => ({ default: module.CourseDetailPage })),
)
const LessonDetailPage = lazyRouteComponent(() =>
  import('@/features/content/courses/pages/lesson-detail').then((module) => ({ default: module.LessonDetailPage })),
)

const PlatformLandingPage = lazyRouteComponent(() =>
  import('@/features/platform/pages/landing').then((module) => ({ default: module.PlatformLandingPage })),
)
const FeatureFlagsPage = lazyRouteComponent(() =>
  import('@/features/platform/pages/feature-flags').then((module) => ({ default: module.FeatureFlagsPage })),
)
const RuntimeConfigsPage = lazyRouteComponent(() =>
  import('@/features/platform/pages/runtime-configs').then((module) => ({ default: module.RuntimeConfigsPage })),
)
const AppVersionsPage = lazyRouteComponent(() =>
  import('@/features/platform/pages/app-versions').then((module) => ({ default: module.AppVersionsPage })),
)
const AnnouncementsPage = lazyRouteComponent(() =>
  import('@/features/platform/pages/announcements').then((module) => ({ default: module.AnnouncementsPage })),
)
const RegionsPage = lazyRouteComponent(() =>
  import('@/features/platform/pages/regions').then((module) => ({ default: module.RegionsPage })),
)
const MenusPage = lazyRouteComponent(() =>
  import('@/features/platform/pages/menus').then((module) => ({ default: module.MenusPage })),
)

const OperationsLandingPage = lazyRouteComponent(() =>
  import('@/features/operations/pages/landing').then((module) => ({ default: module.OperationsLandingPage })),
)
const OperationsOperatorsPage = lazyRouteComponent(() =>
  import('@/features/operations/pages/operators').then((module) => ({ default: module.OperatorsPage })),
)
const OperationsRolesPage = lazyRouteComponent(() =>
  import('@/features/operations/pages/roles').then((module) => ({ default: module.RolesPage })),
)
const OperationsAuditLogsPage = lazyRouteComponent(() =>
  import('@/features/operations/pages/audit-logs').then((module) => ({ default: module.AuditLogsPage })),
)

const ChangePasswordPage = lazyRouteComponent(() =>
  import('@/pages/change-password').then((module) => ({ default: module.ChangePasswordPage })),
)

/* ---------- Root ---------- */

function RootComponent() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return (
    <AppProviders>
      <ErrorBoundary resetKey={pathname}>
        <Outlet />
      </ErrorBoundary>
    </AppProviders>
  )
}

export const rootRoute = createRootRoute({ component: RootComponent })

/* ---------- App shell (authenticated back-office layout) ---------- */

const shellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'shell',
  // 懒加载只替换主内容区，侧边栏和顶部栏在页面切换时保持挂载，避免整页闪烁。
  component: () => (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </AppShell>
    </AuthGuard>
  ),
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

const contentRoute = createRoute({ getParentRoute: () => shellRoute, path: '/content', component: ContentLandingPage })
const contentLettersRoute = createRoute({ getParentRoute: () => shellRoute, path: '/content/letters', component: AlphabetPage })
const contentCategoryRoutes = [
  ['/content/zh/pinyin', 'zh_pinyin_element'],
  ['/content/zh/syllables', 'zh_syllable'],
  ['/content/zh/hanzi', 'zh_hanzi'],
  ['/content/zh/words', 'zh_word'],
  ['/content/zh/sentences', 'zh_sentence'],
  ['/content/lo/syllables', 'lo_syllable'],
  ['/content/lo/words', 'lo_word'],
  ['/content/lo/sentences', 'lo_sentence'],
] as const
const generatedContentRoutes = contentCategoryRoutes.map(([path, contentType]) =>
  createRoute({ getParentRoute: () => shellRoute, path, component: () => <ContentCategoryPage contentType={contentType} /> }),
)
function ContentLaoLettersRoute() {
  const search = LaoLetterSearchSchema.parse(useRouterState({
    select: (state) => state.location.search,
  }))
  return <LaoLetterPage search={search} />
}

const contentLaoLettersRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/content/lo/letters',
  validateSearch: zodSearch(LaoLetterSearchSchema),
  component: ContentLaoLettersRoute,
})
const contentZhReviewRoute = createRoute({ getParentRoute: () => shellRoute, path: '/content/zh/review', component: () => <ContentReviewPage language="中文" /> })
const contentLoReviewRoute = createRoute({ getParentRoute: () => shellRoute, path: '/content/lo/review', component: () => <ContentReviewPage language="老挝语" /> })
const contentCoursesRoute = createRoute({ getParentRoute: () => shellRoute, path: '/content/courses', component: CourseListPage })
const contentCourseNewRoute = createRoute({ getParentRoute: () => shellRoute, path: '/content/courses/new', component: CourseEditorPage })
const contentCourseDetailRoute = createRoute({ getParentRoute: () => shellRoute, path: '/content/courses/$courseId', component: CourseDetailPage })
const contentLessonDetailRoute = createRoute({ getParentRoute: () => shellRoute, path: '/content/lessons/$lessonId', component: LessonDetailPage })

const learningRoute = makeDomainRoute('/learning', 'learning', '学习系统', '用户学习状态（Learning Domain）')
const audioRoute = makeDomainRoute('/audio', 'audio', '音频生产', '音频生产流程（Audio Production Domain）')
const identityRoute = makeDomainRoute('/identity', 'identity', '身份认证', '用户身份（Identity Domain）')
const socialRoute = makeDomainRoute('/social', 'social', '社交关系', '社交资料与关系（Social Domain）')
const chatRoute = makeDomainRoute('/chat', 'chat', '实时聊天', '会话与消息（Chat Domain）')
const commerceRoute = makeDomainRoute('/commerce', 'commerce', '交易商城', '商品、订单、支付、钱包（Commerce Domain）')
const rewardsRoute = makeDomainRoute('/rewards', 'rewards', '奖励中心', '奖励资格与发放（Rewards Domain）')
const trustRoute = makeDomainRoute('/trust', 'trust', '信任与风控', '举报与治理（Trust & Safety Domain）')

const operationsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/operations', component: OperationsLandingPage })
const operationsOperatorsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/operations/operators', component: OperationsOperatorsPage })
const operationsRolesRoute = createRoute({ getParentRoute: () => shellRoute, path: '/operations/roles', component: OperationsRolesPage })
const operationsAuditLogsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/operations/audit-logs', component: OperationsAuditLogsPage })

const platformRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform', component: PlatformLandingPage })
const platformFeatureFlagsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform/feature-flags', component: FeatureFlagsPage })
const platformRuntimeConfigsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform/runtime-configs', component: RuntimeConfigsPage })
const platformAppVersionsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform/app-versions', component: AppVersionsPage })
const platformAnnouncementsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform/announcements', component: AnnouncementsPage })
const platformRegionsRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform/regions', component: RegionsPage })
const platformMenusRoute = createRoute({ getParentRoute: () => shellRoute, path: '/platform/menus', component: MenusPage })

const changePasswordRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/change-password',
  component: ChangePasswordPage,
})

const accountChangePasswordRoute = createRoute({
  getParentRoute: () => shellRoute,
  path: '/account/change-password',
  component: ChangePasswordPage,
})

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
    contentLettersRoute,
    contentLaoLettersRoute,
    contentZhReviewRoute,
    contentLoReviewRoute,
    contentCoursesRoute,
    contentCourseNewRoute,
    contentCourseDetailRoute,
    contentLessonDetailRoute,
    ...generatedContentRoutes,
    learningRoute,
    audioRoute,
    identityRoute,
    socialRoute,
    chatRoute,
    commerceRoute,
    rewardsRoute,
    trustRoute,
    operationsRoute,
    operationsOperatorsRoute,
    operationsRolesRoute,
    operationsAuditLogsRoute,
    platformRoute,
    platformFeatureFlagsRoute,
    platformRuntimeConfigsRoute,
    platformAppVersionsRoute,
    platformAnnouncementsRoute,
    platformRegionsRoute,
    platformMenusRoute,
    designSystemRoute,
    notFoundRoute,
  ]),
  loginRoute,
  unauthorizedRoute,
  changePasswordRoute,
  accountChangePasswordRoute,
])

const laoLetterCsvSearchKeys = ['letter_type', 'letter_class', 'content_status', 'revision_status'] as const
const laoLetterScalarDefaults = { sort: 'sort_order', order: 'asc', page: 1, page_size: 50 } as const

function stringifyAdminSearch(search: Record<string, unknown>) {
  const serialized = { ...search }
  const current = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
  const isLaoLetterSearch = laoLetterCsvSearchKeys.some((key) => Array.isArray(serialized[key]))
  for (const key of laoLetterCsvSearchKeys) {
    const value = serialized[key]
    if (Array.isArray(value)) serialized[key] = value.length > 0 ? value.join(',') : undefined
  }
  if (isLaoLetterSearch) {
    for (const [key, defaultValue] of Object.entries(laoLetterScalarDefaults)) {
      if (serialized[key] === defaultValue && !current.has(key)) serialized[key] = undefined
    }
  }
  return defaultStringifySearch(serialized)
}

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  stringifySearch: stringifyAdminSearch,
})

export { designSystemSearchSchema, routeTree }
