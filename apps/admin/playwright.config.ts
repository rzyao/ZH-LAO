import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.ADMIN_E2E_PORT ?? 15173)
const serverCommand = process.env.ADMIN_E2E_PREVIEW === 'true'
  ? `pnpm exec vite preview --port ${port} --strictPort`
  : `pnpm exec vite --port ${port} --strictPort`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: serverCommand,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
