/**
 * Realtime foundation public surface. Interface only — no chat protocol.
 */

export {
  createNoopRealtimeClient,
  getRealtimeClient,
  hasRealtimeClient,
  registerRealtimeClient,
} from './realtimeClient';

export { useRealtimeConnection } from './useRealtimeConnection';
export type { UseRealtimeConnectionResult } from './useRealtimeConnection';

export { REALTIME_ALL_CHANNEL, RealtimeNotConfiguredError } from './types';
export type {
  ConnectionStateListener,
  RealtimeClient,
  RealtimeConnectionState,
  RealtimeEnvelope,
  RealtimeListener,
  RealtimeSubscription,
} from './types';
