/**
 * Object Storage 能力 Port（共享基础设施 / Capability Layer，WP-04）。
 *
 * 位置说明：Port 保持在本文件，与既有 Asset / Media canonical metadata 基础设施
 * （asset-record / asset-repository）相邻（docs: architecture/infrastructure 中
 * “Object Storage Port” 条目）。生产 Provider 尚未冻结（不凭空绑定云厂商）；
 * Provider 选择经 backend config schema 的 `OBJECT_STORAGE_PROVIDER` 接线到
 * Adapter。业务域只依赖本 Port，禁止 import 任何 Provider Adapter 实现。
 *
 * 契约：
 * - put：写入对象，同 key 幂等覆盖；content 按快照语义存储（副本）。
 * - delete：删除对象；对象不存在视为成功（对齐主流对象存储 delete 语义）。
 * - stat：回读 canonical 元数据（contentType / sizeBytes / metadata），不存在返回 null。
 *   get / 预签名 URL / 大对象流式读取等按需能力，等真实消费方出现后再扩展，
 *   不在本 WP 强制加入 Port 契约。
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
}
