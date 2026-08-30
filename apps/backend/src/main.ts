import { buildApp } from './bootstrap/build-app.js';
import { installShutdown } from './bootstrap/shutdown.js';
import { configSummary, loadConfig } from './config/env.js';
import { asExecutor, createPgPool } from './database/pool.js';
import { TransactionManager } from './database/transaction-manager.js';
import { createLogger } from './logging/logger.js';
import { identityModule } from './modules/identity/index.js';
import { createIdentityHttpDependencies } from './modules/identity/http/composition.js';
import { createIdentityRepositories } from './modules/identity/infrastructure/index.js';
import { ConsoleOtpDeliveryProvider, UnavailableFacebookCredentialVerifier, UnavailableOtpDeliveryProvider } from './modules/identity/application/services/index.js';
import { buildPlatformModule } from './modules/platform/http/composition.js';
import { platformModule } from './modules/platform/index.js';

const config = loadConfig();
const logger = createLogger(config.logLevel);
const pool = createPgPool(config.database, logger);
const readinessState = { isShuttingDown: false };
const app = buildApp({ logger, database: asExecutor(pool), readinessState });
// Provider 装配原则：Fake provider = tests only。
// 未接入真实 SMS/Facebook 适配器前，normal runtime 显式使用 Unavailable provider，
// 对应端点失败安全返回 503 PROVIDER_UNAVAILABLE，绝不静默 fake-success。
// Console OTP 仅限 development 且显式配置 IDENTITY_OTP_PROVIDER=console 时启用。
const identityDependencies = createIdentityHttpDependencies({
  transactionManager: new TransactionManager(pool, logger),
  repositories: createIdentityRepositories,
  executor: asExecutor(pool),
  otpHmacSecret: config.identity.otpHmacSecret ?? '',
  jwtHmacSecret: config.identity.jwtHmacSecret ?? '',
  jwtIssuer: config.identity.jwtIssuer,
  jwtAudience: config.identity.jwtAudience,
  // TECH_DEBT：真实 Meta/Facebook verify adapter 属后续生产集成。
  facebookVerifier: new UnavailableFacebookCredentialVerifier(),
  otpDelivery: config.identity.otpProvider === 'console'
    ? new ConsoleOtpDeliveryProvider({ info: (message, fields) => logger.info(fields, message) })
    : new UnavailableOtpDeliveryProvider()
});
await identityModule.registerHttp(app, identityDependencies);

const platformComposition = buildPlatformModule(asExecutor(pool));
await platformModule.registerHttp(app, {
  executor: asExecutor(pool),
  featureFlagUseCases: platformComposition.featureFlagUseCases,
  appVersionUseCases: platformComposition.appVersionUseCases,
  announcementUseCases: platformComposition.announcementUseCases,
  regionUseCases: platformComposition.regionUseCases,
});

logger.info({ config: configSummary(config) }, 'Starting ZH-LAO backend');
await app.listen({ host: config.host, port: config.port });
installShutdown({ logger, timeoutMs: config.shutdownTimeoutMs, markShuttingDown: () => { readinessState.isShuttingDown = true; }, close: async () => { await app.close(); await pool.end(); } });
