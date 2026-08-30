/**
 * Secure storage (Expo SecureStore).
 *
 * Sole home for long-lived credentials such as the refresh token.
 *
 * Platform strategy:
 * - Android: KeyStore-backed.
 * - iOS: Keychain-backed.
 * - Web: SecureStore has no equivalent. The layer reports itself as
 *   unsupported and degrades gracefully instead of crashing the app. Native
 *   security guarantees are validated on Android/iOS.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { createLogger } from '../utils/logger';

const log = createLogger('secure-storage');

export interface SecureStorage {
  readonly isSupported: boolean;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const SECURE_KEYS = {
  refreshToken: 'zhlao.auth.refresh_token',
  sessionMetadata: 'zhlao.auth.session_metadata',
} as const;

export type SecureKey = (typeof SECURE_KEYS)[keyof typeof SECURE_KEYS];

function detectSupport(): boolean {
  // SecureStore is a native-only module: on Web there is no Keychain/KeyStore
  // equivalent, so the layer must not attempt a native call.
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export const secureStorage: SecureStorage = {
  isSupported: detectSupport(),

  async getItem(key: string): Promise<string | null> {
    if (!detectSupport()) {
      log.debug('SecureStore unavailable on this platform; read skipped', { platform: Platform.OS });
      return null;
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      log.warn('SecureStore read failed', { key, error: String(error) });
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!detectSupport()) {
      log.debug('SecureStore unavailable on this platform; write skipped', {
        platform: Platform.OS,
      });
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      log.warn('SecureStore write failed', { key, error: String(error) });
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    if (!detectSupport()) {
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      log.warn('SecureStore delete failed', { key, error: String(error) });
    }
  },
};

/**
 * Test seam: allows the auth layer to be exercised against an in-memory
 * implementation in unit tests. Never used by application code.
 */
export function createInMemorySecureStorage(): SecureStorage {
  const store = new Map<string, string>();
  return {
    isSupported: true,
    async getItem(key) {
      return store.get(key) ?? null;
    },
    async setItem(key, value) {
      store.set(key, value);
    },
    async removeItem(key) {
      store.delete(key);
    },
  };
}
