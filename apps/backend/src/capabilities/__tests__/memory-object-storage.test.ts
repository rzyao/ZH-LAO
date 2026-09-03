import { describe, expect, it } from 'vitest';
import { MemoryObjectStorage } from '../adapters/object-storage/memory-object-storage.js';
import { UnavailableObjectStorage } from '../adapters/object-storage/unavailable-object-storage.js';
import { AppError } from '../../errors/app-error.js';
import { PROVIDER_UNAVAILABLE } from '../../errors/business-codes.js';

const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

describe('MemoryObjectStorage (WP-04)', () => {
  it('put then stat round-trips contentType, sizeBytes and metadata', async () => {
    const storage = new MemoryObjectStorage();
    await storage.put('lesson/001.mp3', encode('audio-bytes'), 'audio/mpeg', { metadata: { asset: 'a-1' } });
    const stat = await storage.stat('lesson/001.mp3');
    expect(stat).toEqual({
      key: 'lesson/001.mp3',
      contentType: 'audio/mpeg',
      sizeBytes: 'audio-bytes'.length,
      metadata: { asset: 'a-1' },
    });
    expect(storage.count()).toBe(1);
  });

  it('put without metadata defaults to empty metadata', async () => {
    const storage = new MemoryObjectStorage();
    await storage.put('k', encode('x'), 'text/plain');
    const stat = await storage.stat('k');
    expect(stat?.metadata).toEqual({});
  });

  it('stores a content snapshot, isolating later caller mutation', async () => {
    const storage = new MemoryObjectStorage();
    const content = encode('original');
    await storage.put('k', content, 'text/plain');
    content.fill(0);
    const stat = await storage.stat('k');
    expect(stat?.sizeBytes).toBe('original'.length);
  });

  it('overwrite on same key is idempotent and replaces content', async () => {
    const storage = new MemoryObjectStorage();
    await storage.put('k', encode('one'), 'text/plain');
    await storage.put('k', encode('two-longer'), 'text/plain');
    const stat = await storage.stat('k');
    expect(stat?.sizeBytes).toBe('two-longer'.length);
    expect(storage.count()).toBe(1);
  });

  it('delete removes the object; deleting a missing object succeeds silently', async () => {
    const storage = new MemoryObjectStorage();
    await storage.put('k', encode('x'), 'text/plain');
    await storage.delete('k');
    await expect(storage.stat('k')).resolves.toBeNull();
    await expect(storage.delete('never-existed')).resolves.toBeUndefined();
  });

  it('stat of a missing object returns null', async () => {
    const storage = new MemoryObjectStorage();
    await expect(storage.stat('missing')).resolves.toBeNull();
  });
});

describe('UnavailableObjectStorage (WP-04 fail-safe)', () => {
  it('throws PROVIDER_UNAVAILABLE AppError for put/delete/stat', async () => {
    const storage = new UnavailableObjectStorage();
    const expectUnavailable = async (action: Promise<unknown>): Promise<void> => {
      await expect(action).rejects.toBeInstanceOf(AppError);
      await expect(action).rejects.toMatchObject({ code: PROVIDER_UNAVAILABLE });
    };
    await expectUnavailable(storage.put('k', encode('x'), 'text/plain'));
    await expectUnavailable(storage.delete('k'));
    await expectUnavailable(storage.stat('k'));
  });

  it('never reports fake success', async () => {
    const storage = new UnavailableObjectStorage();
    await expect(storage.put('k', encode('x'), 'text/plain')).rejects.toMatchObject({ expose: true });
  });
});
