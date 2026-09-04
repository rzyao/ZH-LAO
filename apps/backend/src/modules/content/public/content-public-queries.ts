import { createHash } from 'node:crypto';
import { AudioRolePolicy } from '../domain/audio-role-policy.js';

export type AudioEligibleContentEntityType = (typeof AudioRolePolicy.ALLOWED_CONTENT_TYPES)[number];
export type ContentRevisionStatus = 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'superseded';
export type ContentAudioSource = { entityType: string; entityId: string; revisionId: string; languageCode: 'zh' | 'lo'; status: ContentRevisionStatus; textSnapshot: string; pronunciationSnapshot: unknown | null; noAudio?: boolean };
export type ValidateAudioSourceRequest = { entityType: AudioEligibleContentEntityType; entityId: string; revisionId: string; languageCode: 'zh' | 'lo'; audioRole: string; requirePublished?: boolean };
export type ValidatedAudioSource = Omit<ValidateAudioSourceRequest, 'requirePublished'> & { sourceDomain: 'content'; textSnapshot: string; pronunciationSnapshot: unknown | null; audioInputHashMaterial: string };
export type ContentRevisionView = ContentAudioSource;
export interface ContentAudioSourceReader { findRevision(revisionId: string): Promise<ContentAudioSource | null>; findCurrentPublished(entityType: AudioEligibleContentEntityType, entityId: string): Promise<ContentAudioSource | null>; }
export class ContentPublicQueryService {
  constructor(private readonly reader: ContentAudioSourceReader) {}
  async validateAudioSource(request: ValidateAudioSourceRequest): Promise<ValidatedAudioSource> {
    if (!AudioRolePolicy.ALLOWED_CONTENT_TYPES.includes(request.entityType)) throw new Error('AUDIO_SOURCE_TYPE_NOT_ELIGIBLE');
    if (!AudioRolePolicy.supportsRole(request.entityType, request.audioRole)) throw new Error('AUDIO_SOURCE_ROLE_NOT_ALLOWED');
    const source = await this.reader.findRevision(request.revisionId);
    if (!source || source.entityType !== request.entityType || source.entityId !== request.entityId) throw new Error('AUDIO_SOURCE_REVISION_NOT_OWNED');
    if (source.languageCode !== request.languageCode) throw new Error('AUDIO_SOURCE_LANGUAGE_MISMATCH');
    if (source.noAudio || !source.textSnapshot.trim()) throw new Error('AUDIO_SOURCE_NOT_RESOLVABLE');
    if (request.requirePublished !== false && source.status !== 'published') throw new Error('AUDIO_SOURCE_REVISION_NOT_PUBLISHED');
    const audioInputHashMaterial = createHash('sha256').update(JSON.stringify([source.entityType, source.languageCode, source.textSnapshot, source.pronunciationSnapshot, request.audioRole])).digest('hex');
    return { sourceDomain: 'content', entityType: request.entityType, entityId: source.entityId, revisionId: source.revisionId, languageCode: source.languageCode, audioRole: request.audioRole, textSnapshot: source.textSnapshot, pronunciationSnapshot: source.pronunciationSnapshot, audioInputHashMaterial };
  }
  async resolveRevision(revisionId: string): Promise<ContentRevisionView | null> { return this.reader.findRevision(revisionId); }
  async resolveCurrentPublishedRevision(entityType: AudioEligibleContentEntityType, entityId: string): Promise<ContentRevisionView | null> { return this.reader.findCurrentPublished(entityType, entityId); }
}
