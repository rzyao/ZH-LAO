/**
 * Object Storage Memory Adapter（WP-04）。
 *
 * 仅用于 development/test 与单进程场景；backend config schema 禁止其在
 * production 使用（多实例共享状态必须交给外部对象存储）。生产 Provider 未冻结，
 * 后续在此目录新增真实 Adapter 即可，Port 与业务域代码无需改动。
 */
import type { ObjectStorageMetadata, ObjectStoragePort, ObjectStorageStat } from '../../../assets/object-storage.js';

type Entry = Readonly<{ content: Uint8Array; contentType: string; metadata: ObjectStorageMetadata }>;

export class MemoryObjectStorage implements ObjectStoragePort {
  readonly name = 'memory';

  private readonly objects = new Map<string, Entry>();

  /** 测试/诊断辅助：当前对象数量。 */
  count(): number {
    return this.objects.size;
  }

  async put(key: string, content: Uint8Array, contentType: string, options?: Readonly<{ metadata?: ObjectStorageMetadata }>): Promise<void> {
    this.objects.set(key, {
      content: new Uint8Array(content), // 快照语义：隔离调用方后续修改
      contentType,
      metadata: options?.metadata ?? {},
    });
  }

  async delete(key: string): Promise<void> {
    // 对象不存在视为成功（对齐主流对象存储 delete 语义）。
    this.objects.delete(key);
  }

  async stat(key: string): Promise<ObjectStorageStat | null> {
    const entry = this.objects.get(key);
    if (entry === undefined) return null;
    return { key, contentType: entry.contentType, sizeBytes: entry.content.byteLength, metadata: entry.metadata };
  }
}
