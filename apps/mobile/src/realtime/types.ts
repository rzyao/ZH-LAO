/**
 * Realtime foundation — INTERFACE ONLY.
 *
 * Explicit non-scope (waits for the Chat domain):
 * - chat message protocol
 * - conversation subscription semantics
 * - typing indicators
 * - presence
 * - delivery / read receipt semantics
 * - reconnect + replay policy
 *
 * This module defines transport primitives and nothing above them.
 */

export type RealtimeConnectionState =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed'
  | 'error';

export interface RealtimeEnvelope<TPayload = unknown> {
  /** Opaque channel/topic name. Meaning is defined by the owning domain. */
  readonly channel: string;
  readonly payload: TPayload;
  readonly receivedAt: string;
}

export interface RealtimeSubscription {
  readonly channel: string;
  unsubscribe(): void;
}

export type RealtimeListener<TPayload = unknown> = (
  envelope: RealtimeEnvelope<TPayload>,
) => void;

export type ConnectionStateListener = (state: RealtimeConnectionState) => void;

export interface RealtimeClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe<TPayload = unknown>(
    channel: string,
    listener: RealtimeListener<TPayload>,
  ): RealtimeSubscription;
  /**
   * Sends an opaque payload. The Foundation does not define any message shape
   * beyond `{ channel, payload }` — protocols belong to their domain.
   */
  send<TPayload = unknown>(channel: string, payload: TPayload): void;
  getConnectionState(): RealtimeConnectionState;
  onConnectionStateChange(listener: ConnectionStateListener): RealtimeSubscription;
}

export class RealtimeNotConfiguredError extends Error {
  constructor() {
    super(
      'No realtime client is registered. The Chat domain must provide an implementation before realtime is used.',
    );
    this.name = 'RealtimeNotConfiguredError';
  }
}

export const REALTIME_ALL_CHANNEL = '*';
