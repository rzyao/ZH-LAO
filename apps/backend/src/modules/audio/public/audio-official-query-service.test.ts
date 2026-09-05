import { describe, expect, it, vi } from 'vitest';
import { AudioOfficialQueryService } from './audio-official-query-service.js';

const request = {
  entityType: 'lo_word',
  entityId: '00000000-0000-4000-8000-000000000011',
  languageCode: 'lo' as const,
  audioRole: 'pronunciation',
  revisionId: '00000000-0000-4000-8000-000000000012',
  audioInputHash: 'fresh-hash',
};

describe('AudioOfficialQueryService', () => {
  it('delivers an asset only when the active official version is approved and fresh', async () => {
    const db = { query: vi.fn().mockResolvedValue({ rows: [{ asset_id: '00000000-0000-4000-8000-000000000013' }] }) };
    const delivery = { resolveClientSafeRead: vi.fn().mockResolvedValue({ status: 'available', asset: { url: 'https://r2.example/signed', expiresAt: '2026-01-02T00:05:00.000Z', contentType: 'audio/mpeg' } }) };
    const service = new AudioOfficialQueryService(db, delivery);

    await expect(service.resolveOfficialAudio(request)).resolves.toEqual({
      status: 'available',
      audio: { url: 'https://r2.example/signed', expiresAt: '2026-01-02T00:05:00.000Z', contentType: 'audio/mpeg' },
    });
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining("s.status = 'active'"), [
      request.entityType, request.entityId, request.languageCode, request.audioRole, request.revisionId, request.audioInputHash,
    ]);
  });

  it('does not attempt asset delivery when no matching official version exists', async () => {
    const db = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    const delivery = { resolveClientSafeRead: vi.fn() };
    const service = new AudioOfficialQueryService(db, delivery);

    await expect(service.resolveOfficialAudio(request)).resolves.toEqual({ status: 'unavailable' });
    expect(delivery.resolveClientSafeRead).not.toHaveBeenCalled();
  });
});
