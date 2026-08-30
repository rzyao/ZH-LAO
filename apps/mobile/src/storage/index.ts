/**
 * Storage layering — the single source of truth for where data lives.
 *
 * ```text
 * Access token        -> memory          (never persisted)
 * Refresh token       -> SecureStore     (Keychain / KeyStore)
 * Preferences         -> AsyncStorage    (non-sensitive only)
 * ```
 *
 * No other module may import AsyncStorage, SecureStore or a second key/value
 * engine directly.
 */

export { credentialMemory, createMemoryStorage } from './memoryStorage';
export type { MemoryStorage } from './memoryStorage';

export {
  SECURE_KEYS,
  secureStorage,
  createInMemorySecureStorage,
} from './secureStorage';
export type { SecureStorage, SecureKey } from './secureStorage';

export {
  PREFERENCE_KEYS,
  FORBIDDEN_ASYNC_STORAGE_KEYS,
  preferencesStorage,
  createInMemoryPreferencesStorage,
} from './preferencesStorage';
export type { PreferencesStorage, PreferenceKey } from './preferencesStorage';
