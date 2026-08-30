import type { DatabaseExecutor } from '../database/executor.js';
import type { LogicalUuid } from '../ids/uuid.js';
import type { PublishedEvent } from '../events/event-handler.js';

type OutboxRow = {
  event_id: LogicalUuid; source_domain: string; event_type: string; aggregate_type: string;
  aggregate_id: LogicalUuid; payload: Record<string, unknown>; headers: Record<string, unknown>;
  occurred_at: Date; attempt_count: number;
};

export class OutboxRepository {
  constructor(private readonly executor: DatabaseExecutor) {}

  async claim(batchSize: number, leaseMs: number): Promise<PublishedEvent[]> {
    const result = await this.executor.query<OutboxRow>(`
      WITH candidates AS (
        SELECT id FROM infrastructure.system_outbox_events
        WHERE published_at IS NULL AND available_at <= now()
        ORDER BY available_at, created_at
        FOR UPDATE SKIP LOCKED LIMIT $1
      )
      UPDATE infrastructure.system_outbox_events AS event
      SET available_at = now() + ($2::integer * interval '1 millisecond'),
          attempt_count = event.attempt_count + 1,
          last_error = NULL
      FROM candidates WHERE event.id = candidates.id
      RETURNING event.event_id, event.source_domain, event.event_type, event.aggregate_type,
        event.aggregate_id, event.payload, event.headers, event.occurred_at, event.attempt_count
    `, [batchSize, leaseMs]);
    return result.rows.map((row) => ({
      id: row.event_id, sourceDomain: row.source_domain, type: row.event_type,
      aggregateType: row.aggregate_type, aggregateId: row.aggregate_id,
      payload: row.payload, headers: row.headers, occurredAt: row.occurred_at, attempt: row.attempt_count
    }));
  }

  async markPublished(eventId: LogicalUuid): Promise<void> {
    await this.executor.query(`UPDATE infrastructure.system_outbox_events SET published_at = now(), last_error = NULL WHERE event_id = $1 AND published_at IS NULL`, [eventId]);
  }
  async markFailed(eventId: LogicalUuid, error: string, retryAt: Date): Promise<void> {
    await this.executor.query(`UPDATE infrastructure.system_outbox_events SET last_error = $2, available_at = $3 WHERE event_id = $1 AND published_at IS NULL`, [eventId, error.slice(0, 4_000), retryAt]);
  }
}
