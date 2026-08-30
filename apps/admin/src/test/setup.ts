import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// RTL auto-cleanup requires globals; enable explicitly without globals.
afterEach(() => {
  cleanup()
})

// jsdom lacks matchMedia (used by the theme "system" mode).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Base UI / Floating UI popups need ResizeObserver in jsdom.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).ResizeObserver = ResizeObserverMock

// TanStack Router scroll restoration calls window.scrollTo.
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
})
