import type { DomainEvent, JsonObject } from './domain-event.js';

export type PublishedEvent = Omit<DomainEvent, 'payload' | 'headers'> & { payload: JsonObject; headers: JsonObject; attempt: number };
export interface EventHandler { handle(event: PublishedEvent): Promise<void>; }
