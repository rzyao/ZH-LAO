import { buildApp } from './bootstrap/build-app.js';
import { installShutdown } from './bootstrap/shutdown.js';
import { configSummary, loadConfig } from './config/env.js';
import { asExecutor, createPgPool } from './database/pool.js';
import { createLogger } from './logging/logger.js';

const config = loadConfig();
const logger = createLogger(config.logLevel);
const pool = createPgPool(config.database, logger);
const readinessState = { isShuttingDown: false };
const app = buildApp({ logger, database: asExecutor(pool), readinessState });
logger.info({ config: configSummary(config) }, 'Starting ZH-LAO backend');
await app.listen({ host: config.host, port: config.port });
installShutdown({ logger, timeoutMs: config.shutdownTimeoutMs, markShuttingDown: () => { readinessState.isShuttingDown = true; }, close: async () => { await app.close(); await pool.end(); } });
