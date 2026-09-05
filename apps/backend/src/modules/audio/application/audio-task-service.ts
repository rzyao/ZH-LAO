import { newLogicalUuid } from '../../../ids/uuid.js';
import type { DatabaseExecutor } from '../../../database/executor.js';
import type { ContentPublicQueryService } from '../../content/public/content-public-queries.js';

export type CreateAudioTask = { slotId:string; productionMethod:'tts'|'human_recording'; ttsPresetKey?:string; createdByOperatorId:string; idempotencyKey:string };
export class AudioTaskService {
  constructor(private readonly db:DatabaseExecutor,private readonly content:ContentPublicQueryService){}
  async create(input:CreateAudioTask):Promise<{id:string;replayed:boolean}> {
    if(input.productionMethod==='tts'&&!input.ttsPresetKey) throw new Error('AUDIO_TTS_PRESET_REQUIRED');
    const existing=await this.db.query<{id:string}>(`SELECT id FROM audio.audio_tasks WHERE client_idempotency_key=$1`,[input.idempotencyKey]);
    if(existing.rows[0]) return {id:existing.rows[0].id,replayed:true};
    const slot=await this.db.query<{required_content_revision_id:string;required_audio_input_hash:string;content_entity_type:string;content_entity_id:string;language_code:'zh'|'lo';audio_role:string}>(`SELECT required_content_revision_id,required_audio_input_hash,content_entity_type,content_entity_id,language_code,audio_role FROM audio.audio_slots WHERE id=$1 AND status='active'`,[input.slotId]);
    if(!slot.rows[0]) throw new Error('AUDIO_SLOT_NOT_ACTIVE'); const s=slot.rows[0]; const id=newLogicalUuid();
    const source=await this.content.validateAudioSource({entityType:s.content_entity_type as never,entityId:s.content_entity_id,revisionId:s.required_content_revision_id,languageCode:s.language_code,audioRole:s.audio_role});
    try { await this.db.query(`INSERT INTO audio.audio_tasks(id,slot_id,production_method,status,content_revision_id,text_snapshot,pronunciation_snapshot,audio_input_hash,tts_preset_key,created_by_operator_id,client_idempotency_key) VALUES($1,$2,$3,'pending_assignment',$4,$5,$6::jsonb,$7,$8,$9,$10)`,[id,input.slotId,input.productionMethod,source.revisionId,source.textSnapshot,JSON.stringify(source.pronunciationSnapshot),source.audioInputHashMaterial,input.productionMethod==='tts'?input.ttsPresetKey??null:null,input.createdByOperatorId,input.idempotencyKey]); }
    catch(error){ const again=await this.db.query<{id:string}>(`SELECT id FROM audio.audio_tasks WHERE client_idempotency_key=$1`,[input.idempotencyKey]); if(again.rows[0])return{id:again.rows[0].id,replayed:true}; throw error; }
    return {id,replayed:false};
  }
}
