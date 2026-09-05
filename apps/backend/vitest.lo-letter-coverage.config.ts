import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 20_000,
    hookTimeout: 120_000,
    include: [
      'test/modules/content/lo-letter-*.{unit,integration,contract}.test.ts',
      'test/integration/operations-content-batch-audit.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: [
        'src/modules/content/domain/lo-letter-{admin-query,batch-task}.ts',
        'src/modules/content/application/use-cases/{manage-lo-letter-batch-tasks,manage-lo-letter-selection,process-lo-letter-batch,query-lo-letter-admin-list}.ts',
        'src/modules/content/infrastructure/postgres-lo-letter-{admin,batch}-repository.ts',
        'src/modules/content/http/lo-letter-batch-routes.ts',
      ],
      reporter: ['text', 'json-summary'],
      thresholds: {
        'src/modules/content/domain/lo-letter-admin-query.ts': { lines: 90, statements: 90 },
        'src/modules/content/domain/lo-letter-batch-task.ts': { lines: 95, statements: 95 },
        'src/modules/content/application/use-cases/*.ts': { lines: 80, statements: 80 },
        'src/modules/content/infrastructure/postgres-lo-letter-*-repository.ts': { lines: 80, statements: 80 },
        'src/modules/content/http/lo-letter-batch-routes.ts': { lines: 80, statements: 80 },
      },
    },
  },
});
