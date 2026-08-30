import type { DatabaseExecutor } from '../database/executor.js';
import { newLogicalUuid } from '../ids/uuid.js';
import { validateDomainEvent, type DomainEvent } from '../events/domain-event.js';

export class OutboxWriter {
  async write(executor: DatabaseExecutor, input: DomainEvent): Promise<void> {
    const event = validateDomainEvent(input);
    await executor.query(`
      INSERT INTO infrastructure.system_outbox_events(
        id, event_id, source_domain, event_type, aggregate_type, aggregate_id,
        payload, headers, occurred_at, available_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10)
    `, [newLogicalUuid(), event.id, event.sourceDomain, event.type, event.aggregateType, event.aggregateId,
      JSON.stringify(event.payload), JSON.stringify(event.headers), event.occurredAt, event.availableAt ?? event.occurredAt]);
  }
}
