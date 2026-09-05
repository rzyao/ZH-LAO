import { describe, expect, it, vi } from 'vitest';
import { parseLogicalUuid } from '../ids/uuid.js';
import type { AssetRecord } from './asset-record.js';
import { AssetDeliveryService } from './asset-delivery-service.js';

const readyAudio: AssetRecord = {
  id: parseLogicalUuid('00000000-0000-4000-8000-000000000001'),
  storageProvider: 'r2',
  storageBucket: 'audio',
  storageKey: 'audio/example.mp3',
  mimeType: 'audio/mpeg',
  sizeBytes: 42n,
  status: 'ready',
  metadata: {},
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
};

describe('AssetDeliveryService', () => {
  it('returns only a short-lived client-safe URL for a ready audio asset', async () => {
    const repository = { findById: vi.fn().mockResolvedValue(readyAudio) };
    const storage = { createSignedReadUrl: vi.fn().mockResolvedValue('https://r2.example/signed') };
    const now = new Date('2026-01-02T00:00:00.000Z');
    const service = new AssetDeliveryService(repository, storage, { now: () => now, expiresInSeconds: 300 });

    await expect(service.resolveClientSafeRead({ assetId: readyAudio.id, purpose: 'audio_playback' })).resolves.toEqual({
      status: 'available',
      asset: { url: 'https://r2.example/signed', expiresAt: '2026-01-02T00:05:00.000Z', contentType: 'audio/mpeg' },
    });
    expect(storage.createSignedReadUrl).toHaveBeenCalledWith('audio/example.mp3', 300);
  });

  it.each(['pending', 'failed', 'deleted'] as const)('does not expose a %s asset', async (status) => {
    const repository = { findById: vi.fn().mockResolvedValue({ ...readyAudio, status }) };
    const storage = { createSignedReadUrl: vi.fn() };
    const service = new AssetDeliveryService(repository, storage);

    await expect(service.resolveClientSafeRead({ assetId: readyAudio.id, purpose: 'audio_playback' })).resolves.toEqual({ status: 'unavailable' });
    expect(storage.createSignedReadUrl).not.toHaveBeenCalled();
  });

  it('fails closed when signed delivery cannot be created', async () => {
    const repository = { findById: vi.fn().mockResolvedValue(readyAudio) };
    const storage = { createSignedReadUrl: vi.fn().mockRejectedValue(new Error('R2 unavailable')) };
    const service = new AssetDeliveryService(repository, storage);

    await expect(service.resolveClientSafeRead({ assetId: readyAudio.id, purpose: 'audio_playback' })).resolves.toEqual({ status: 'unavailable' });
  });
});
