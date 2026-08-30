import { SECURE_KEYS, credentialMemory, secureStorage } from '../../storage';
import type { SecureStorage } from '../../storage';
import { createLogger } from '../../utils/logger';

/**
 * Token storage — the security-critical part of the V2 client.
 *
 * ```text
 * Access token   -> memory only (never persisted, never logged)
 * Refresh token  -> Expo SecureStore (Keychain / KeyStore)
 * Preferences    -> AsyncStorage (see storage/preferencesStorage)
 * ```
 *
 * There is no code path that writes a credential to AsyncStorage.
 */

const log = createLogger('token-store');

const ACCESS_TOKEN_KEY = 'zhlao.auth.access_token';

export interface StoredSessionMetadata {
  readonly subjectId: string | null;
  readonly updatedAt: string | null;
}

export interface TokenStore {
  /** Synchronous read; the access token is held in memory only. */
  getAccessToken(): string | null;
  setAccessToken(token: string): void;
  clearAccessToken(): void;

  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clearRefreshToken(): Promise<void>;

  readSessionMetadata(): Promise<StoredSessionMetadata | null>;
  writeSessionMetadata(metadata: StoredSessionMetadata): Promise<void>;

  /** Clears every credential held by the client. */
  clearAll(): Promise<void>;
}

export function createTokenStore(store: SecureStorage = secureStorage): TokenStore {
  return {
    getAccessToken: () => credentialMemory.get(ACCESS_TOKEN_KEY),

    setAccessToken: (token) => {
      credentialMemory.set(ACCESS_TOKEN_KEY, token);
      log.debug('access token stored in memory');
    },

    clearAccessToken: () => {
      credentialMemory.remove(ACCESS_TOKEN_KEY);
      log.debug('access token cleared from memory');
    },

    getRefreshToken: async () => store.getItem(SECURE_KEYS.refreshToken),

    setRefreshToken: async (token) => {
      await store.setItem(SECURE_KEYS.refreshToken, token);
      log.debug('refresh token stored in secure storage');
    },

    clearRefreshToken: async () => {
      await store.removeItem(SECURE_KEYS.refreshToken);
    },

    readSessionMetadata: async () => {
      const raw = await store.getItem(SECURE_KEYS.sessionMetadata);
      if (!raw) {
        return null;
      }
      try {
        return JSON.parse(raw) as StoredSessionMetadata;
      } catch {
        log.warn('session metadata could not be parsed');
        return null;
      }
    },

    writeSessionMetadata: async (metadata) => {
      await store.setItem(SECURE_KEYS.sessionMetadata, JSON.stringify(metadata));
    },

    clearAll: async () => {
      credentialMemory.remove(ACCESS_TOKEN_KEY);
      await store.removeItem(SECURE_KEYS.refreshToken);
      await store.removeItem(SECURE_KEYS.sessionMetadata);
      log.debug('all credentials cleared');
    },
  };
}

/** The application-wide token store. */
export const tokenStore = createTokenStore();

export { ACCESS_TOKEN_KEY };
