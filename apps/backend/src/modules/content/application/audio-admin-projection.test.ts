import { describe, expect, it, vi } from 'vitest';
import { AudioAdminProjection } from './audio-admin-projection.js';
import { calculateAudioInputHashMaterial, type ContentAudioSource } from '../public/content-public-queries.js';

const source: ContentAudioSource = {
  entityType: 'zh_syllable',
  entityId: '00000000-0000-4000-8000-000000000021',
  revisionId: '00000000-0000-4000-8000-000000000022',
  languageCode: 'zh',
  status: 'published',
  textSnapshot: 'mā',
  pronunciationSnapshot: { tone: 1 },
};

describe('AudioAdminProjection', () => {
  it('looks up each supported Chinese tone against the current published source and returns the first official audio', async () => {
    const sources = { findRevision: vi.fn(), findCurrentPublished: vi.fn().mockResolvedValue(source) };
    const officialAudio = { resolveOfficialAudio: vi.fn(async (request: { audioRole: string }) => request.audioRole === 'tone_2'
      ? { status: 'available' as const, audio: { url: 'https://delivery.example/audio', expiresAt: '2026-01-02T00:05:00.000Z', contentType: 'audio/mpeg' } }
      : { status: 'unavailable' as const }) };
    const projection = new AudioAdminProjection(sources, officialAudio);

    await expect(projection.resolve('zh_syllable', source.entityId)).resolves.toEqual({
      status: 'available', playback: { url: 'https://delivery.example/audio', expires_at: '2026-01-02T00:05:00.000Z', content_type: 'audio/mpeg' },
    });
    expect(officialAudio.resolveOfficialAudio).toHaveBeenCalledWith(expect.objectContaining({
      audioRole: 'tone_2', audioInputHash: calculateAudioInputHashMaterial(source, 'tone_2'), revisionId: source.revisionId,
    }));
  });

  it('does not query Audio for a content type outside the frozen whitelist', async () => {
    const sources = { findRevision: vi.fn(), findCurrentPublished: vi.fn() };
    const officialAudio = { resolveOfficialAudio: vi.fn() };
    const projection = new AudioAdminProjection(sources, officialAudio);

    await expect(projection.resolve('zh_hanzi', '00000000-0000-4000-8000-000000000023')).resolves.toEqual({ status: 'unavailable' });
    expect(sources.findCurrentPublished).not.toHaveBeenCalled();
    expect(officialAudio.resolveOfficialAudio).not.toHaveBeenCalled();
  });
});
