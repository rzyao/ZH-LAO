import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(root, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/components/data-table/data-table.test.tsx',
      'src/features/content/structured/contracts.test.ts',
      'src/features/content/structured/lo-letter-*.test.{ts,tsx}',
    ],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: [
        'src/features/content/structured/contracts.ts',
        'src/features/content/structured/lo-letter-selection.ts',
        'src/features/content/structured/lo-letter-column-preferences.ts',
        'src/features/content/structured/lo-letter-{batch-actions,batch-bar,batch-task-panel,columns,table}.tsx',
        'src/components/data-table/{data-table,data-table-pagination,data-table-view-options}.tsx',
      ],
      reporter: ['text', 'json-summary'],
      thresholds: {
        'src/features/content/structured/{contracts,lo-letter-selection}.ts': { lines: 90, statements: 90 },
        'src/features/content/structured/lo-letter-column-preferences.ts': { lines: 70, statements: 70 },
        'src/features/content/structured/lo-letter-{batch-actions,batch-bar,batch-task-panel,columns,table}.tsx': { lines: 70, statements: 70 },
        'src/components/data-table/{data-table,data-table-pagination,data-table-view-options}.tsx': { lines: 70, statements: 70 },
      },
    },
  },
})
