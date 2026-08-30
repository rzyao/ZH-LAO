import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from './ThemeProvider'
import { useTheme } from './use-theme'
import { resolveTheme, storeTheme, readStoredTheme } from './theme-utils'

function Harness() {
  const { mode, resolvedTheme, setMode, toggle } = useTheme()
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setMode('dark')}>dark</button>
      <button onClick={() => setMode('light')}>light</button>
      <button onClick={toggle}>toggle</button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('resolves system to light when matchMedia says light', () => {
    expect(resolveTheme('system')).toBe('light')
  })

  it('round-trips theme storage', () => {
    storeTheme('dark')
    expect(readStoredTheme()).toBe('dark')
    storeTheme('system')
    expect(readStoredTheme()).toBe('system')
  })

  it('switches to dark mode, persists it and applies the document class', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider defaultMode="light">
        <Harness />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
    await user.click(screen.getByRole('button', { name: 'dark' }))
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(window.localStorage.getItem('zh-lao-admin-theme')).toBe('dark')
  })

  it('keeps light mode after toggling back', async () => {
    const user = userEvent.setup()
    render(
      <ThemeProvider defaultMode="dark">
        <Harness />
      </ThemeProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'light' }))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
  })
})
