/**
 * Cache 能力 Port（WP-04）。
 *
 * 注意（多实例部署护栏）：Memory Adapter 只允许 development/test 使用，
 * 禁止在生产多实例把单进程 Map 当共享状态（backend config schema 已在
 * production 拒绝 `CACHE_PROVIDER=memory`）。生产应接入共享缓存（Redis Adapter
 * 未在本 WP 捆绑上线，其部署前置条件与接入说明见 capabilities 层文档/汇报）。
 *
 * 存储语义：字符串键值 + 可选 TTL（毫秒）。结构化值由调用方自行序列化。
 */
export type CacheSetOptions = Readonly<{ ttlMs?: number }>;

/** 业务域依赖的最小契约。 */
export interface CachePort {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, options?: CacheSetOptions): Promise<void>;
  delete(key: string): Promise<void>;
}

/** Provider Adapter 契约：在 Port 之上附加可诊断的 Provider 名称。 */
export interface CacheProvider extends CachePort {
  readonly name: string;
}
