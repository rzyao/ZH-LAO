import type { DatabaseExecutor } from '../../../database/executor.js';
import type { ContentPublicQueryService } from '../../content/public/content-public-queries.js';
import type { AudioRequirementSync, SyncAudioRequirementRequest } from '../public/audio-requirement-sync.js';
export class AudioRequirementSyncService implements AudioRequirementSync {
  constructor(private readonly db: DatabaseExecutor, private readonly content: ContentPublicQueryService) {}
  async syncRequirement(request: SyncAudioRequirementRequest): Promise<void> {
    const source = await this.content.validateAudioSource(request);
    await this.db.query(`INSERT INTO audio.audio_slots(id,source_domain,content_entity_type,content_entity_id,language_code,audio_role,required_content_revision_id,required_audio_input_hash,status) VALUES(gen_random_uuid(),'content',$1,$2,$3,$4,$5,$6,'active') ON CONFLICT(source_domain,content_entity_type,content_entity_id,language_code,audio_role) DO UPDATE SET required_content_revision_id=EXCLUDED.required_content_revision_id, required_audio_input_hash=EXCLUDED.required_audio_input_hash`, [source.entityType, source.entityId, source.languageCode, source.audioRole, source.revisionId, source.audioInputHashMaterial]);
  }
}
