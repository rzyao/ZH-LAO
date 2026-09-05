/**
 * Object Storage 能力 Port（共享基础设施 / Capability Layer，WP-04）。
 *
 * 位置说明：Port 保持在本文件，与既有 Asset / Media canonical metadata 基础设施
 * （asset-record / asset-repository）相邻（docs: architecture/infrastructure 中
 * “Object Storage Port” 条目）。生产 Provider 由架构决策冻结为 Cloudflare R2，
 * 但 Provider 选择仍仅经 backend config schema 的 `OBJECT_STORAGE_PROVIDER` 接线到
 * Adapter。业务域只依赖本 Port，禁止 import 任何 Provider Adapter 实现。
 *
 * 契约：
 * - put：写入对象，同 key 幂等覆盖；content 按快照语义存储（副本）。
 * - delete：删除对象；对象不存在视为成功（对齐主流对象存储 delete 语义）。
 * - stat：回读 canonical 元数据（contentType / sizeBytes / metadata），不存在返回 null。
 * - createSignedReadUrl：为 Asset delivery 边界生成短时读取地址；业务域不得自行构造 URL。
 */
export type ObjectStorageMetadata = Readonly<Record<string, string>>;

export type ObjectStorageStat = Readonly<{
  key: string;
  contentType: string;
  sizeBytes: number;
  metadata: ObjectStorageMetadata;
}>;

export interface ObjectStoragePort {
  put(key: string, content: Uint8Array, contentType: string, options?: Readonly<{ metadata?: ObjectStorageMetadata }>): Promise<void>;
  delete(key: string): Promise<void>;
  stat(key: string): Promise<ObjectStorageStat | null>;
  /** Returns an expiring opaque read URL; callers must never derive it from a storage key. */
  createSignedReadUrl(key: string, expiresInSeconds: number): Promise<string>;
}
