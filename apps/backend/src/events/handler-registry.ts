import type { EventHandler } from './event-handler.js';

export class EventHandlerRegistry {
  private readonly handlers = new Map<string, EventHandler[]>();

  register(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, [...(this.handlers.get(eventType) ?? []), handler]);
  }
  get(eventType: string): readonly EventHandler[] { return this.handlers.get(eventType) ?? []; }
}
