import { parseLogicalUuid, type LogicalUuid } from '../ids/uuid.js';

export type JsonObject = Readonly<Record<string, unknown>>;
export type DomainEvent = Readonly<{
  id: LogicalUuid;
  sourceDomain: string;
  type: string;
  aggregateType: string;
  aggregateId: LogicalUuid;
  payload: JsonObject;
  headers: JsonObject;
  occurredAt: Date;
  availableAt?: Date;
}>;

export function validateDomainEvent(event: DomainEvent): DomainEvent {
  parseLogicalUuid(event.id);
  parseLogicalUuid(event.aggregateId);
  if (!event.payload || Array.isArray(event.payload) || typeof event.payload !== 'object') throw new TypeError('Event payload must be a JSON object');
  if (!event.headers || Array.isArray(event.headers) || typeof event.headers !== 'object') throw new TypeError('Event headers must be a JSON object');
  return event;
}
