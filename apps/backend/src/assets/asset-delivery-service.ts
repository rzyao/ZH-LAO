import type { LogicalUuid } from '../ids/uuid.js';
import type { AssetRecord } from './asset-record.js';
import type { ObjectStoragePort } from './object-storage.js';

export type ResolveAssetReadRequest = Readonly<{
  assetId: LogicalUuid;
  purpose: 'audio_playback';
}>;

export type AssetDeliveryResolution =
  | Readonly<{ status: 'available'; asset: Readonly<{ url: string; expiresAt: string; contentType: string }> }>
  | Readonly<{ status: 'unavailable' }>;

type AssetReader = Readonly<{ findById(id: LogicalUuid): Promise<AssetRecord | null> }>;

type AssetDeliveryOptions = Readonly<{
  expiresInSeconds?: number;
  now?: () => Date;
}>;

/**
 * Asset's public delivery boundary.  It deliberately does not disclose the
 * storage provider, bucket, key, or any other infrastructure metadata.
 */
export class AssetDeliveryService {
  private readonly expiresInSeconds: number;
  private readonly now: () => Date;

  constructor(
    private readonly assets: AssetReader,
    private readonly storage: Pick<ObjectStoragePort, 'createSignedReadUrl'>,
    options: AssetDeliveryOptions = {},
  ) {
    this.expiresInSeconds = options.expiresInSeconds ?? 300;
    this.now = options.now ?? (() => new Date());
  }

  async resolveClientSafeRead(request: ResolveAssetReadRequest): Promise<AssetDeliveryResolution> {
    const asset = await this.assets.findById(request.assetId);
    if (!asset || asset.status !== 'ready' || !asset.mimeType.startsWith('audio/')) {
      return { status: 'unavailable' };
    }

    try {
      const url = await this.storage.createSignedReadUrl(asset.storageKey, this.expiresInSeconds);
      const expiresAt = new Date(this.now().getTime() + this.expiresInSeconds * 1000).toISOString();
      return { status: 'available', asset: { url, expiresAt, contentType: asset.mimeType } };
    } catch {
      return { status: 'unavailable' };
    }
  }
}
