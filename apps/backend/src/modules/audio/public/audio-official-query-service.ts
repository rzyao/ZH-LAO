import type { AssetDeliveryResolution, ResolveAssetReadRequest } from '../../../assets/asset-delivery-service.js';
import type { DatabaseExecutor } from '../../../database/executor.js';
import { parseLogicalUuid } from '../../../ids/uuid.js';
import { isSupportedContentAudioRole } from '../../content/public/content-public-queries.js';

export type ResolveOfficialAudioRequest = Readonly<{
  entityType: string;
  entityId: string;
  languageCode: 'zh' | 'lo';
  audioRole: string;
  revisionId: string;
  audioInputHash: string;
}>;

export type OfficialAudioResolution =
  | Readonly<{ status: 'available'; audio: Readonly<{ url: string; expiresAt: string; contentType: string }> }>
  | Readonly<{ status: 'unavailable' }>;

type AssetDelivery = Readonly<{ resolveClientSafeRead(request: ResolveAssetReadRequest): Promise<AssetDeliveryResolution> }>;

/** Public Audio query: validates official pointer, review and freshness before Asset delivery. */
export class AudioOfficialQueryService {
  constructor(private readonly db: DatabaseExecutor, private readonly assetDelivery: AssetDelivery) {}

  async resolveOfficialAudio(request: ResolveOfficialAudioRequest): Promise<OfficialAudioResolution> {
    if (!isSupportedContentAudioRole(request.entityType, request.audioRole)) return { status: 'unavailable' };

    const result = await this.db.query<{ asset_id: string }>(`
      SELECT av.asset_id
      FROM audio.audio_slots s
      JOIN audio.audio_asset_versions av ON av.id = s.official_asset_version_id AND av.slot_id = s.id
      WHERE s.status = 'active'
        AND s.content_entity_type = $1
        AND s.content_entity_id = $2
        AND s.language_code = $3
        AND s.audio_role = $4
        AND s.required_content_revision_id = $5
        AND s.required_audio_input_hash = $6
        AND av.review_status = 'approved'
        AND av.content_revision_id = s.required_content_revision_id
        AND av.audio_input_hash = s.required_audio_input_hash
      LIMIT 1
    `, [request.entityType, request.entityId, request.languageCode, request.audioRole, request.revisionId, request.audioInputHash]);
    const row = result.rows[0];
    if (!row) return { status: 'unavailable' };

    let delivered: AssetDeliveryResolution;
    try {
      delivered = await this.assetDelivery.resolveClientSafeRead({ assetId: parseLogicalUuid(row.asset_id), purpose: 'audio_playback' });
    } catch {
      return { status: 'unavailable' };
    }
    return delivered.status === 'available'
      ? { status: 'available', audio: delivered.asset }
      : { status: 'unavailable' };
  }
}
