import { buildWorker } from './bootstrap/build-worker.js';
import { installShutdown } from './bootstrap/shutdown.js';
import { configSummary, loadConfig } from './config/env.js';
import { asExecutor, createPgPool } from './database/pool.js';
import { createLogger } from './logging/logger.js';

const config = loadConfig();
const logger = createLogger(config.logLevel);
const pool = createPgPool(config.database, logger);
const worker = buildWorker(config, asExecutor(pool), logger);
logger.info({ config: configSummary(config) }, 'Starting ZH-LAO worker');
worker.start();
installShutdown({ logger, timeoutMs: config.shutdownTimeoutMs, close: async () => { await worker.stop(); await pool.end(); } });
