import * as React from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Sheet, SheetContent } from '@/components/ui/sheet'

/**
 * Desktop-first application shell:
 *   ┌──────────┬──────────────────────────────┐
 *   │ Sidebar  │ Header / Breadcrumb         │
 *   │          ├──────────────────────────────┤
 *   │          │ Main content (scrolls)      │
 *   └──────────┴──────────────────────────────┘
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = React.useState(false)
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <a href="#main-content" className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4">
          跳至主要内容
        </a>
        <Header onOpenNavigation={() => setMobileNavigationOpen(true)} />
        <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 overflow-auto" data-testid="main-content">
          {children}
        </main>
      </div>
      <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
        <SheetContent side="left" className="w-60 max-w-none p-0 md:hidden">
          <Sidebar mobile />
        </SheetContent>
      </Sheet>
    </div>
  )
}
