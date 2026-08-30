import type { Logger } from 'pino';
import { EventHandlerRegistry } from '../events/handler-registry.js';
import { OutboxRepository } from './outbox-repository.js';

export type PublisherOptions = Readonly<{ batchSize: number; leaseMs: number }>;

export class OutboxPublisher {
  constructor(private readonly repository: OutboxRepository, private readonly registry: EventHandlerRegistry, private readonly logger: Logger, private readonly options: PublisherOptions) {}

  async runOnce(signal?: AbortSignal): Promise<number> {
    if (signal?.aborted) return 0;
    const events = await this.repository.claim(this.options.batchSize, this.options.leaseMs);
    for (const event of events) {
      if (signal?.aborted) break;
      const log = this.logger.child({ eventId: event.id, eventType: event.type, sourceDomain: event.sourceDomain, aggregateId: event.aggregateId, attempt: event.attempt });
      try {
        const handlers = this.registry.get(event.type);
        if (handlers.length === 0) throw new Error(`No handler registered for event type ${event.type}`);
        for (const handler of handlers) await handler.handle(event);
        await this.repository.markPublished(event.id);
        log.info('Outbox event published');
      } catch (error) {
        const delay = Math.min(60_000, 1_000 * 2 ** Math.min(event.attempt - 1, 6));
        await this.repository.markFailed(event.id, error instanceof Error ? error.message : String(error), new Date(Date.now() + delay));
        log.warn({ err: error, retryDelayMs: delay }, 'Outbox event publication failed');
      }
    }
    return events.length;
  }
}
