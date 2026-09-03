/**
 * Cache Noop Adapter（WP-04）。
 *
 * CACHE_PROVIDER=none 时的显式选择：读写均为 no-op、get 恒返回 undefined。
 * 用于“缓存能力未接线但业务代码已依赖 CachePort”的失败安全部署，
 * 绝不静默伪造命中/使用单进程 Map 冒充共享缓存。
 */
import type { CacheProvider, CacheSetOptions } from '../../ports/cache.js';

export class NoopCacheAdapter implements CacheProvider {
  readonly name = 'none';

  async get(_key: string): Promise<string | undefined> {
    return undefined;
  }

  async set(_key: string, _value: string, _options?: CacheSetOptions): Promise<void> {
    // 显式 no-op
  }

  async delete(_key: string): Promise<void> {
    // 显式 no-op
  }
}
