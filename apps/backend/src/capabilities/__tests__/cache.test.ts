import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryCacheAdapter } from '../adapters/cache/memory-cache.js';
import { NoopCacheAdapter } from '../adapters/cache/noop-cache.js';

describe('MemoryCacheAdapter (WP-04)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('round-trips set/get and reports missing keys as undefined', async () => {
    const cache = new MemoryCacheAdapter();
    await expect(cache.get('missing')).resolves.toBeUndefined();
    await cache.set('k', 'v');
    await expect(cache.get('k')).resolves.toBe('v');
  });

  it('delete removes the key', async () => {
    const cache = new MemoryCacheAdapter();
    await cache.set('k', 'v');
    await cache.delete('k');
    await expect(cache.get('k')).resolves.toBeUndefined();
  });

  it('expires entries after ttlMs and lazily removes them', async () => {
    vi.useFakeTimers();
    const cache = new MemoryCacheAdapter();
    await cache.set('k', 'v', { ttlMs: 1_000 });
    await expect(cache.get('k')).resolves.toBe('v');

    vi.advanceTimersByTime(999);
    await expect(cache.get('k')).resolves.toBe('v');

    vi.advanceTimersByTime(2);
    await expect(cache.get('k')).resolves.toBeUndefined();
    expect(cache.count()).toBe(0);
  });

  it('set without ttl never expires', async () => {
    vi.useFakeTimers();
    const cache = new MemoryCacheAdapter();
    await cache.set('k', 'v');
    vi.advanceTimersByTime(60_000);
    await expect(cache.get('k')).resolves.toBe('v');
  });

  it('overwrite replaces value and refreshes ttl window', async () => {
    vi.useFakeTimers();
    const cache = new MemoryCacheAdapter();
    await cache.set('k', 'old', { ttlMs: 1_000 });
    vi.advanceTimersByTime(800);
    await cache.set('k', 'new', { ttlMs: 1_000 });
    vi.advanceTimersByTime(800);
    await expect(cache.get('k')).resolves.toBe('new');
  });

  it('clear resets all entries', async () => {
    const cache = new MemoryCacheAdapter();
    await cache.set('a', '1');
    await cache.set('b', '2');
    cache.clear();
    expect(cache.count()).toBe(0);
  });
});

describe('NoopCacheAdapter (WP-04 fail-safe)', () => {
  it('never hits, set/delete are silent no-ops', async () => {
    const cache = new NoopCacheAdapter();
    await expect(cache.get('anything')).resolves.toBeUndefined();
    await expect(cache.set('k', 'v', { ttlMs: 100 })).resolves.toBeUndefined();
    await expect(cache.delete('k')).resolves.toBeUndefined();
    await expect(cache.get('k')).resolves.toBeUndefined();
  });
});
