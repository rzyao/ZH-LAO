/**
 * Cache Memory Adapter（WP-04）。
 *
 * 仅用于 development/test / 单进程场景。backend config schema 禁止其在
 * production 使用：多实例部署绝不能把单进程 Map 当共享状态。生产共享缓存
 * （Redis Adapter 等）接入前请使用 NoopCacheAdapter（CACHE_PROVIDER=none）
 * 或真实共享缓存，避免读到过期/错实例数据。
 */
import type { CacheProvider, CacheSetOptions } from '../../ports/cache.js';

type Entry = Readonly<{ value: string; expiresAtMs?: number }>;

export class MemoryCacheAdapter implements CacheProvider {
  readonly name = 'memory';

  private readonly store = new Map<string, Entry>();

  /** 测试/诊断辅助：当前存活条目数（不含懒删除清理）。 */
  count(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  async get(key: string): Promise<string | undefined> {
    const entry = this.store.get(key);
    if (entry === undefined) return undefined;
    if (entry.expiresAtMs !== undefined && entry.expiresAtMs <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  async set(key: string, value: string, options?: CacheSetOptions): Promise<void> {
    this.store.set(key, options?.ttlMs !== undefined ? { value, expiresAtMs: Date.now() + options.ttlMs } : { value });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
