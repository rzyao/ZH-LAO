import type { Logger } from 'pino';
import type { AppConfig } from '../config/env.js';
import type { DatabaseExecutor } from '../database/executor.js';
import { EventHandlerRegistry } from '../events/handler-registry.js';
import { JobRegistry } from '../jobs/job-registry.js';
import { pollingJob, WorkerHost } from '../jobs/worker-host.js';
import { OutboxPublisher } from '../outbox/outbox-publisher.js';
import { OutboxRepository } from '../outbox/outbox-repository.js';

export function buildWorker(config: AppConfig, database: DatabaseExecutor, logger: Logger, handlers = new EventHandlerRegistry()): WorkerHost {
  const publisher = new OutboxPublisher(new OutboxRepository(database), handlers, logger, config.outbox);
  const registry = new JobRegistry();
  registry.register(pollingJob('outbox-publisher', config.outbox.pollIntervalMs, (signal) => publisher.runOnce(signal).then(() => undefined)));
  return new WorkerHost(registry.all(), logger);
}
