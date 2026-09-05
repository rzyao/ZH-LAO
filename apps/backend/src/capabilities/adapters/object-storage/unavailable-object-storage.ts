/**
 * Object Storage Unavailable Adapter（WP-04）。
 *
 * 默认失败安全实现：Provider 未接线（OBJECT_STORAGE_PROVIDER=unavailable）时，
 * 任何写入/读取都抛 PROVIDER_UNAVAILABLE，绝不静默 fake-success。
 */
import type { ObjectStorageMetadata, ObjectStoragePort, ObjectStorageStat } from '../../../assets/object-storage.js';
import { providerUnavailable } from '../../provider-error.js';

export class UnavailableObjectStorage implements ObjectStoragePort {
  readonly name = 'unavailable';

  private readonly context = { provider: 'object-storage', operation: 'unavailable' };

  async put(_key: string, _content: Uint8Array, _contentType: string, _options?: Readonly<{ metadata?: ObjectStorageMetadata }>): Promise<void> {
    throw providerUnavailable(this.context);
  }

  async delete(_key: string): Promise<void> {
    throw providerUnavailable(this.context);
  }

  async stat(_key: string): Promise<ObjectStorageStat | null> {
    throw providerUnavailable(this.context);
  }

  async createSignedReadUrl(_key: string, _expiresInSeconds: number): Promise<string> {
    throw providerUnavailable(this.context);
  }
}
