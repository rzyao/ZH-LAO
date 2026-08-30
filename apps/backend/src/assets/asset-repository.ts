import type { DatabaseExecutor } from '../database/executor.js';
import type { LogicalUuid } from '../ids/uuid.js';
import type { AssetRecord, NewAsset } from './asset-record.js';

type AssetRow = { id: LogicalUuid; storage_provider: string; storage_bucket: string; storage_key: string; mime_type: string; size_bytes: string; status: AssetRecord['status']; metadata: Record<string, unknown>; created_at: Date; updated_at: Date; deleted_at: Date | null };
const map = (row: AssetRow): AssetRecord => ({ id: row.id, storageProvider: row.storage_provider, storageBucket: row.storage_bucket, storageKey: row.storage_key, mimeType: row.mime_type, sizeBytes: BigInt(row.size_bytes), status: row.status, metadata: row.metadata, createdAt: row.created_at, updatedAt: row.updated_at, deletedAt: row.deleted_at });

export class AssetRepository {
  constructor(private readonly executor: DatabaseExecutor) {}
  async create(asset: NewAsset): Promise<AssetRecord> {
    const result = await this.executor.query<AssetRow>(`
      INSERT INTO infrastructure.assets(id, storage_provider, storage_bucket, storage_key, mime_type, size_bytes, status, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
      RETURNING id,storage_provider,storage_bucket,storage_key,mime_type,size_bytes,status,metadata,created_at,updated_at,deleted_at
    `, [asset.id, asset.storageProvider, asset.storageBucket, asset.storageKey, asset.mimeType, asset.sizeBytes.toString(), asset.status, JSON.stringify(asset.metadata)]);
    return map(result.rows[0]!);
  }
  async findById(id: LogicalUuid): Promise<AssetRecord | null> {
    const result = await this.executor.query<AssetRow>(`SELECT id,storage_provider,storage_bucket,storage_key,mime_type,size_bytes,status,metadata,created_at,updated_at,deleted_at FROM infrastructure.assets WHERE id=$1`, [id]);
    return result.rows[0] ? map(result.rows[0]) : null;
  }
}
