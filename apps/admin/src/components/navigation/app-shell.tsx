import * as React from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'

/**
 * Desktop-first application shell:
 *   ┌──────────┬──────────────────────────────┐
 *   │ Sidebar  │ Header / Breadcrumb         │
 *   │          ├──────────────────────────────┤
 *   │          │ Main content (scrolls)      │
 *   └──────────┴──────────────────────────────┘
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1 overflow-auto" data-testid="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
