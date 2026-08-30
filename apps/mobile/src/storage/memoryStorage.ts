/**
 * Process-memory storage.
 *
 * Used exclusively for short-lived credentials (access token). Values never
 * touch disk, never reach AsyncStorage and are dropped when the JS context is
 * destroyed.
 */

export interface MemoryStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  clear(): void;
  keys(): readonly string[];
}

export function createMemoryStorage(initial: Record<string, string> = {}): MemoryStorage {
  const store = new Map<string, string>(Object.entries(initial));

  return {
    get: (key) => store.get(key) ?? null,
    set: (key, value) => {
      store.set(key, value);
    },
    remove: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    keys: () => Array.from(store.keys()),
  };
}

/**
 * The single process-wide memory store for credentials.
 * Nothing else in the app may hold a long-lived copy of an access token.
 */
export const credentialMemory = createMemoryStorage();
