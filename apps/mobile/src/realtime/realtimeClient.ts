import {
  REALTIME_ALL_CHANNEL,
  type ConnectionStateListener,
  type RealtimeClient,
  type RealtimeConnectionState,
  type RealtimeListener,
  type RealtimeSubscription,
} from './types';

/**
 * Registry + a no-op implementation.
 *
 * The Foundation ships no real transport: registering one is the Chat domain's
 * responsibility once its protocol is frozen.
 */

let client: RealtimeClient | null = null;

export function registerRealtimeClient(next: RealtimeClient | null): void {
  client = next;
}

export function getRealtimeClient(): RealtimeClient | null {
  return client;
}

export function hasRealtimeClient(): boolean {
  return client !== null;
}

/**
 * In-memory client used by tests and by the Foundation UI before a transport
 * exists. It records subscriptions and sends nothing off-device.
 */
export function createNoopRealtimeClient(): RealtimeClient {
  const listeners = new Map<string, Set<RealtimeListener<never>>>();
  const stateListeners = new Set<ConnectionStateListener>();
  let state: RealtimeConnectionState = 'idle';

  const setState = (next: RealtimeConnectionState): void => {
    state = next;
    stateListeners.forEach((listener) => {
      listener(next);
    });
  };

  return {
    async connect() {
      setState('connecting');
      setState('open');
    },
    async disconnect() {
      setState('closed');
    },
    subscribe(channel, listener) {
      const set = listeners.get(channel) ?? new Set();
      set.add(listener as RealtimeListener<never>);
      listeners.set(channel, set);
      return {
        channel,
        unsubscribe() {
          const current = listeners.get(channel);
          current?.delete(listener as RealtimeListener<never>);
        },
      };
    },
    send(channel, payload) {
      const set = listeners.get(channel);
      set?.forEach((listener) => {
        (listener as RealtimeListener<unknown>)({
          channel,
          payload,
          receivedAt: new Date().toISOString(),
        });
      });
      const wildcard = listeners.get(REALTIME_ALL_CHANNEL);
      wildcard?.forEach((listener) => {
        (listener as RealtimeListener<unknown>)({
          channel,
          payload,
          receivedAt: new Date().toISOString(),
        });
      });
    },
    getConnectionState() {
      return state;
    },
    onConnectionStateChange(listener) {
      stateListeners.add(listener);
      return {
        channel: REALTIME_ALL_CHANNEL,
        unsubscribe() {
          stateListeners.delete(listener);
        },
      };
    },
  };
}

export type { RealtimeSubscription, RealtimeConnectionState };
