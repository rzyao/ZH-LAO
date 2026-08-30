import { useCallback, useSyncExternalStore } from 'react';

import { getRealtimeClient } from './realtimeClient';
import type { RealtimeConnectionState } from './types';

export interface UseRealtimeConnectionResult {
  readonly state: RealtimeConnectionState;
  readonly isConfigured: boolean;
  readonly connect: () => Promise<void>;
  readonly disconnect: () => Promise<void>;
}

/**
 * Foundation hook exposing only connection lifecycle.
 *
 * No channel semantics, no message protocol, no domain behaviour.
 */
export function useRealtimeConnection(): UseRealtimeConnectionResult {
  const client = getRealtimeClient();

  const state = useSyncExternalStore<RealtimeConnectionState>(
    useCallback(
      (onStoreChange) => {
        if (!client) {
          return () => undefined;
        }
        const subscription = client.onConnectionStateChange(() => {
          onStoreChange();
        });
        return () => {
          subscription.unsubscribe();
        };
      },
      [client],
    ),
    () => client?.getConnectionState() ?? 'idle',
    () => 'idle',
  );

  const connect = useCallback(async () => {
    if (!client) {
      return;
    }
    await client.connect();
  }, [client]);

  const disconnect = useCallback(async () => {
    if (!client) {
      return;
    }
    await client.disconnect();
  }, [client]);

  return {
    state,
    isConfigured: client !== null,
    connect,
    disconnect,
  };
}
