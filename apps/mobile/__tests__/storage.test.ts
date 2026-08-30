import {
  FORBIDDEN_ASYNC_STORAGE_KEYS,
  PREFERENCE_KEYS,
  createInMemoryPreferencesStorage,
} from '../src/storage/preferencesStorage';
import { createMemoryStorage } from '../src/storage/memoryStorage';
import { createTokenStore } from '../src/auth/storage/tokenStore';
import { createMemorySecureStorage } from './helpers/secureStorageStub';

describe('Storage layering', () => {
  it('memory storage keeps values in process only', () => {
    const store = createMemoryStorage({ a: '1' });
    expect(store.get('a')).toBe('1');
    store.set('b', '2');
    expect(store.keys()).toEqual(expect.arrayContaining(['a', 'b']));
    store.remove('a');
    expect(store.get('a')).toBeNull();
    store.clear();
    expect(store.keys()).toHaveLength(0);
  });

  it('preferences storage round-trips strings, booleans and JSON', async () => {
    const prefs = createInMemoryPreferencesStorage();
    await prefs.setString(PREFERENCE_KEYS.themeId, 'dark');
    expect(await prefs.getString(PREFERENCE_KEYS.themeId)).toBe('dark');
    expect(await prefs.getBoolean(PREFERENCE_KEYS.themeId)).toBe(false);

    await prefs.setBoolean(PREFERENCE_KEYS.onboardingCompleted, true);
    expect(await prefs.getBoolean(PREFERENCE_KEYS.onboardingCompleted)).toBe(true);

    await prefs.setJson(PREFERENCE_KEYS.learningLanguage, { code: 'lo' });
    expect(await prefs.getJson<{ code: string }>(PREFERENCE_KEYS.learningLanguage)).toEqual({ code: 'lo' });

    await prefs.remove(PREFERENCE_KEYS.themeId);
    expect(await prefs.getString(PREFERENCE_KEYS.themeId)).toBeNull();
  });

  it('refuses credential-like keys in AsyncStorage', async () => {
    const prefs = createInMemoryPreferencesStorage();
    for (const forbidden of FORBIDDEN_ASYNC_STORAGE_KEYS) {
      await expect(
        prefs.setString(forbidden as never, 'secret'),
      ).rejects.toThrow(/SecureStore/);
    }
  });

  it('token store keeps the access token in memory and the refresh token in secure storage', async () => {
    const secure = createMemorySecureStorage();
    const store = createTokenStore(secure);

    store.setAccessToken('access-1');
    expect(store.getAccessToken()).toBe('access-1');

    await store.setRefreshToken('refresh-1');
    expect(await store.getRefreshToken()).toBe('refresh-1');
    // The refresh token physically lives in secure storage, not memory.
    expect(secure.getItem('zhlao.auth.refresh_token')).toBe('refresh-1');

    await store.writeSessionMetadata({ subjectId: 'sub-1', updatedAt: '2026-08-31T00:00:00.000Z' });
    expect(await store.readSessionMetadata()).toEqual({
      subjectId: 'sub-1',
      updatedAt: '2026-08-31T00:00:00.000Z',
    });

    await store.clearAll();
    expect(store.getAccessToken()).toBeNull();
    expect(await store.getRefreshToken()).toBeNull();
    expect(await store.readSessionMetadata()).toBeNull();
  });

  it('rejects token-valued preference writes (refresh token can never land in AsyncStorage)', async () => {
    const prefs = createInMemoryPreferencesStorage();
    await expect(
      prefs.setString('zhlao.auth.refresh_token' as never, 'r'),
    ).rejects.toThrow(/refresh/);
  });
});
