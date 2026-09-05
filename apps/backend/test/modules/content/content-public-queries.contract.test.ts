import { describe, expect, it } from 'vitest';
import { ContentPublicQueryService, type AudioEligibleContentEntityType, type ContentAudioSource, type ContentAudioSourceReader } from '../../../src/modules/content/public/content-public-queries.js';

const types: readonly AudioEligibleContentEntityType[] = ['lo_letter', 'lo_syllable', 'lo_word', 'lo_sentence', 'zh_pinyin_element', 'zh_syllable'];
const source = (entityType: string, overrides: Partial<ContentAudioSource> = {}): ContentAudioSource => ({ entityType, entityId: '00000000-0000-0000-0000-000000000001', revisionId: '00000000-0000-0000-0000-000000000002', languageCode: entityType.startsWith('lo_') ? 'lo' : 'zh', status: 'published', textSnapshot: 'sample', pronunciationSnapshot: 'sample-pronunciation', ...overrides });
class Reader implements ContentAudioSourceReader {
  constructor(private readonly value: ContentAudioSource | null) {}
  async findRevision(): Promise<ContentAudioSource | null> { return this.value; }
  async findCurrentPublished(): Promise<ContentAudioSource | null> { return this.value; }
}
describe('ContentPublicQueries audio contract', () => {
  it.each(types)('validates every approved audio entity type: %s', async (entityType) => {
    const result = await new ContentPublicQueryService(new Reader(source(entityType))).validateAudioSource({ entityType, entityId: '00000000-0000-0000-0000-000000000001', revisionId: '00000000-0000-0000-0000-000000000002', languageCode: entityType.startsWith('lo_') ? 'lo' : 'zh', audioRole: entityType.startsWith('lo_') ? 'pronunciation' : 'tone_1' });
    expect(result).toMatchObject({ sourceDomain: 'content', entityType, audioRole: entityType.startsWith('lo_') ? 'pronunciation' : 'tone_1' });
    expect(result.audioInputHashMaterial).toHaveLength(64);
  });
  it('rejects a non-whitelisted entity type', async () => {
    await expect(new ContentPublicQueryService(new Reader(source('zh_hanzi'))).validateAudioSource({ entityType: 'zh_hanzi' as AudioEligibleContentEntityType, entityId: '00000000-0000-0000-0000-000000000001', revisionId: '00000000-0000-0000-0000-000000000002', languageCode: 'zh', audioRole: 'tone_1' })).rejects.toThrow('AUDIO_SOURCE_TYPE_NOT_ELIGIBLE');
  });
  it('rejects an unrelated revision, mismatched language or invalid role', async () => {
    const query = new ContentPublicQueryService(new Reader(source('lo_letter', { entityId: '00000000-0000-0000-0000-000000000099' })));
    const request = { entityType: 'lo_letter' as const, entityId: '00000000-0000-0000-0000-000000000001', revisionId: '00000000-0000-0000-0000-000000000002', languageCode: 'lo' as const, audioRole: 'pronunciation' };
    await expect(query.validateAudioSource(request)).rejects.toThrow('AUDIO_SOURCE_REVISION_NOT_OWNED');
    await expect(new ContentPublicQueryService(new Reader(source('lo_letter'))).validateAudioSource({ ...request, languageCode: 'zh' })).rejects.toThrow('AUDIO_SOURCE_LANGUAGE_MISMATCH');
    await expect(new ContentPublicQueryService(new Reader(source('lo_letter'))).validateAudioSource({ ...request, audioRole: 'tone_1' })).rejects.toThrow('AUDIO_SOURCE_ROLE_NOT_ALLOWED');
  });
  it('rejects unpublished and unresolvable revisions', async () => {
    const request = { entityType: 'lo_letter' as const, entityId: '00000000-0000-0000-0000-000000000001', revisionId: '00000000-0000-0000-0000-000000000002', languageCode: 'lo' as const, audioRole: 'pronunciation' };
    await expect(new ContentPublicQueryService(new Reader(source('lo_letter', { status: 'draft' }))).validateAudioSource(request)).rejects.toThrow('AUDIO_SOURCE_REVISION_NOT_PUBLISHED');
    await expect(new ContentPublicQueryService(new Reader(source('lo_letter', { noAudio: true }))).validateAudioSource(request)).rejects.toThrow('AUDIO_SOURCE_NOT_RESOLVABLE');
  });
});
