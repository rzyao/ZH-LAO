/**
 * Preferences storage (AsyncStorage).
 *
 * Sole home for NON-SENSITIVE user preferences:
 * theme id, interface/learning language, onboarding state, local UI settings.
 *
 * Credentials must never be written here — see `secureStorage`.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { createLogger } from '../utils/logger';

const log = createLogger('preferences');

export const PREFERENCE_KEYS = {
  themeId: 'zhlao.preferences.theme_id',
  interfaceLanguage: 'zhlao.preferences.interface_language',
  learningLanguage: 'zhlao.preferences.learning_language',
  onboardingCompleted: 'zhlao.preferences.onboarding_completed',
} as const;

export type PreferenceKey = (typeof PREFERENCE_KEYS)[keyof typeof PREFERENCE_KEYS];

/**
 * Keys that may never be persisted to AsyncStorage. Used by the security
 * audit script and by unit tests to prove the layering holds.
 */
export const FORBIDDEN_ASYNC_STORAGE_KEYS = [
  'refresh_token',
  'refreshtoken',
  'access_token',
  'accesstoken',
  'password',
  'otp',
] as const;

export interface PreferencesStorage {
  getString(key: PreferenceKey): Promise<string | null>;
  setString(key: PreferenceKey, value: string): Promise<void>;
  getBoolean(key: PreferenceKey): Promise<boolean | null>;
  setBoolean(key: PreferenceKey, value: boolean): Promise<void>;
  getJson<T>(key: PreferenceKey): Promise<T | null>;
  setJson(key: PreferenceKey, value: unknown): Promise<void>;
  remove(key: PreferenceKey): Promise<void>;
  multiRead(keys: readonly PreferenceKey[]): Promise<Record<string, string | null>>;
}

function assertSafeKey(key: string): void {
  const normalized = key.toLowerCase().replace(/[^a-z]/g, '');
  const forbidden = FORBIDDEN_ASYNC_STORAGE_KEYS.find((pattern) => normalized.includes(pattern));
  if (forbidden) {
    throw new Error(
      `Refusing to write credential-like key "${key}" to AsyncStorage. Use secureStorage instead.`,
    );
  }
}

export const preferencesStorage: PreferencesStorage = {
  async getString(key) {
    assertSafeKey(key);
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      log.warn('preference read failed', { key, error: String(error) });
      return null;
    }
  },

  async setString(key, value) {
    assertSafeKey(key);
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      log.warn('preference write failed', { key, error: String(error) });
    }
  },

  async getBoolean(key) {
    const raw = await preferencesStorage.getString(key);
    if (raw === null) {
      return null;
    }
    return raw === 'true';
  },

  async setBoolean(key, value) {
    await preferencesStorage.setString(key, value ? 'true' : 'false');
  },

  async getJson<T>(key: PreferenceKey): Promise<T | null> {
    const raw = await preferencesStorage.getString(key);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      log.warn('preference JSON parse failed', { key });
      return null;
    }
  },

  async setJson(key, value) {
    await preferencesStorage.setString(key, JSON.stringify(value));
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      log.warn('preference delete failed', { key, error: String(error) });
    }
  },

  async multiRead(keys) {
    try {
      keys.forEach((key: PreferenceKey) => assertSafeKey(key));
      const pairs = await AsyncStorage.multiGet([...keys]);
      return Object.fromEntries(pairs) as Record<string, string | null>;
    } catch (error) {
      log.warn('preference multi-read failed', { error: String(error) });
      return Object.fromEntries(keys.map((key) => [key, null]));
    }
  },
};

/** Test seam backed by an in-memory map. */
export function createInMemoryPreferencesStorage(): PreferencesStorage {
  const store = new Map<string, string>();

  const read = async (key: PreferenceKey): Promise<string | null> => {
    assertSafeKey(key);
    return store.get(key) ?? null;
  };

  const write = async (key: PreferenceKey, value: string): Promise<void> => {
    assertSafeKey(key);
    store.set(key, value);
  };

  return {
    getString: read,
    setString: write,
    async getBoolean(key) {
      const raw = await read(key);
      return raw === null ? null : raw === 'true';
    },
    async setBoolean(key, value) {
      await write(key, value ? 'true' : 'false');
    },
    async getJson<T>(key: PreferenceKey) {
      const raw = await read(key);
      return raw ? (JSON.parse(raw) as T) : null;
    },
    async setJson(key, value) {
      await write(key, JSON.stringify(value));
    },
    async remove(key) {
      store.delete(key);
    },
    async multiRead(keys) {
      return Object.fromEntries(keys.map((key: PreferenceKey) => [key, store.get(key) ?? null]));
    },
  };
}
