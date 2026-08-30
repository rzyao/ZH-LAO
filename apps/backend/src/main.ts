import { buildApp } from './bootstrap/build-app.js';
import { installShutdown } from './bootstrap/shutdown.js';
import { configSummary, loadConfig } from './config/env.js';
import { asExecutor, createPgPool } from './database/pool.js';
import { TransactionManager } from './database/transaction-manager.js';
import { createLogger } from './logging/logger.js';
import { identityModule } from './modules/identity/index.js';
import { createIdentityHttpDependencies } from './modules/identity/http/composition.js';
import { createIdentityRepositories } from './modules/identity/infrastructure/index.js';
import { ConsoleOtpDeliveryProvider } from './modules/identity/application/services/index.js';

const config = loadConfig();
const logger = createLogger(config.logLevel);
const pool = createPgPool(config.database, logger);
const readinessState = { isShuttingDown: false };
const app = buildApp({ logger, database: asExecutor(pool), readinessState });
const identityDependencies = createIdentityHttpDependencies({
  transactionManager: new TransactionManager(pool, logger),
  repositories: createIdentityRepositories,
  executor: asExecutor(pool),
  otpHmacSecret: config.identity.otpHmacSecret ?? '',
  jwtHmacSecret: config.identity.jwtHmacSecret ?? '',
  jwtIssuer: config.identity.jwtIssuer,
  jwtAudience: config.identity.jwtAudience,
  // TECH_DEBT: 真实 SMS 与 Facebook 验证适配器属于后续生产集成；临时用占位与空映射避免默认弱凭据。
  otpDelivery: new ConsoleOtpDeliveryProvider({ info: (message, fields) => logger.info(fields, message) })
});
await identityModule.registerHttp(app, identityDependencies);
logger.info({ config: configSummary(config) }, 'Starting ZH-LAO backend');
await app.listen({ host: config.host, port: config.port });
installShutdown({ logger, timeoutMs: config.shutdownTimeoutMs, markShuttingDown: () => { readinessState.isShuttingDown = true; }, close: async () => { await app.close(); await pool.end(); } });
