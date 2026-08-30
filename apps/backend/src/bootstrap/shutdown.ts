import type { Logger } from 'pino';

export function installShutdown(options: { logger: Logger; timeoutMs: number; close: () => Promise<void>; markShuttingDown?: () => void; forceExit?: (code: number) => void }): () => void {
  let closing = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (closing) return;
    closing = true;
    options.markShuttingDown?.();
    options.logger.info({ signal }, 'Graceful shutdown started');
    const timeout = setTimeout(() => {
      options.logger.fatal({ timeoutMs: options.timeoutMs }, 'Graceful shutdown timed out');
      process.exitCode = 1;
      (options.forceExit ?? process.exit)(1);
    }, options.timeoutMs);
    timeout.unref();
    void options.close().then(() => {
      clearTimeout(timeout);
      options.logger.info('Graceful shutdown completed');
    }).catch((error) => {
      clearTimeout(timeout);
      options.logger.error({ err: error }, 'Graceful shutdown failed');
      process.exitCode = 1;
    });
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return () => { process.off('SIGTERM', shutdown); process.off('SIGINT', shutdown); };
}
