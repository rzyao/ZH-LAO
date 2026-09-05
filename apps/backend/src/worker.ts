import { buildWorker } from './bootstrap/build-worker.js';
import { installShutdown } from './bootstrap/shutdown.js';
import { configSummary, loadConfig } from './config/env.js';
import { asExecutor, createPgPool } from './database/pool.js';
import { TransactionManager } from './database/transaction-manager.js';
import { pollingJob } from './jobs/worker-host.js';
import { createLogger } from './logging/logger.js';
import type { IdentityPublicQueries } from './modules/identity/public/index.js';
import { createLaoLetterBatchProcessor } from './modules/content/worker/composition.js';
import { OperationsService } from './modules/operations/application/services/index.js';
import { PostgresOperationsRepository } from './modules/operations/infrastructure/index.js';

const config = loadConfig();
const logger = createLogger(config.logLevel);
const pool = createPgPool(config.database, logger);
const transactions = new TransactionManager(pool, logger);
const database = asExecutor(pool);
const workerIdentityBoundary: IdentityPublicQueries = {
  getIdentityAccountStatus: async () => null,
  isIdentityActive: async () => false,
  getIdentitySummary: async () => null,
};
const operations = new OperationsService(
  transactions,
  database,
  new PostgresOperationsRepository(),
  workerIdentityBoundary,
);
const batchProcessor = createLaoLetterBatchProcessor({
  transactions,
  operations,
  batchSize: config.contentLetterBatch.batchSize,
  concurrency: config.contentLetterBatch.concurrency,
});
const worker = buildWorker(config, database, logger, undefined, [
  pollingJob(
    'content-lo-letter-batch',
    config.contentLetterBatch.pollIntervalMs,
    async () => {
      const telemetry = await batchProcessor.processCycle();
      logger.info({
        queueDepth: telemetry.queueDepth,
        oldestAgeMs: telemetry.oldestAgeMs,
        cycleDurationMs: telemetry.cycleDurationMs,
        outcomes: telemetry.outcomes,
      }, 'Content Lao-letter batch cycle completed');
    },
  ),
]);
logger.info({ config: configSummary(config) }, 'Starting ZH-LAO worker');
worker.start();
installShutdown({ logger, timeoutMs: config.shutdownTimeoutMs, close: async () => { await worker.stop(); await pool.end(); } });
