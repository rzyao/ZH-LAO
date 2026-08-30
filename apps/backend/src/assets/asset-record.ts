import type { LogicalUuid } from '../ids/uuid.js';
import type { JsonObject } from '../events/domain-event.js';

export type AssetStatus = 'pending' | 'ready' | 'deleted' | 'failed';
export type AssetRecord = Readonly<{
  id: LogicalUuid; storageProvider: string; storageBucket: string; storageKey: string;
  mimeType: string; sizeBytes: bigint; status: AssetStatus; metadata: JsonObject;
  createdAt: Date; updatedAt: Date; deletedAt: Date | null;
}>;
export type NewAsset = Omit<AssetRecord, 'createdAt' | 'updatedAt' | 'deletedAt'>;
