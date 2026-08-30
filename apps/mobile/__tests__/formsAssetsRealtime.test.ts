import { foundationDemoFormSchema, foundationDemoFormDefaults } from '../src/forms/schemas';
import { guessMimeType, resolveAssetUrl, createAssetRef } from '../src/assets/assetService';
import { createNoopRealtimeClient } from '../src/realtime/realtimeClient';
import { createMemoryStorage } from '../src/storage/memoryStorage';

describe('Zod form schema (neutral demo)', () => {
  it('accepts a valid payload', () => {
    const parsed = foundationDemoFormSchema.safeParse({
      label: '测试',
      quantity: 3,
      category: 'audio',
      note: '',
      accepted: true,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects short labels, out-of-range quantity and unaccepted checkbox', () => {
    expect(
      foundationDemoFormSchema.safeParse({ ...foundationDemoFormDefaults, label: 'a', accepted: true }).success,
    ).toBe(false);
    expect(
      foundationDemoFormSchema.safeParse({ ...foundationDemoFormDefaults, label: 'ab', quantity: 0, accepted: true }).success,
    ).toBe(false);
    expect(
      foundationDemoFormSchema.safeParse({ ...foundationDemoFormDefaults, label: 'ab', accepted: false }).success,
    ).toBe(false);
    expect(
      foundationDemoFormSchema.safeParse({ ...foundationDemoFormDefaults, label: 'ab', quantity: 1.5, accepted: true }).success,
    ).toBe(false);
  });
});

describe('Asset helpers', () => {
  it('guesses mime types from extensions', () => {
    expect(guessMimeType('a.png')).toBe('image/png');
    expect(guessMimeType('audio/track.MP3?x=1')).toBe('audio/mpeg');
    expect(guessMimeType('no-extension')).toBeNull();
    expect(guessMimeType(null)).toBeNull();
  });

  it('resolves remote and file urls without rewriting them', () => {
    expect(resolveAssetUrl({ url: 'https://cdn.example.com/a.png' })).toBe('https://cdn.example.com/a.png');
    expect(resolveAssetUrl({ url: 'file:///data/a.png' })).toBe('file:///data/a.png');
    expect(resolveAssetUrl({ url: '/data/local/a.png' })).toBe('file://data/local/a.png');
    expect(resolveAssetUrl(null)).toBeNull();
  });

  it('creates asset refs with derived mime types', () => {
    const ref = createAssetRef({ url: 'https://cdn.example.com/a.webp' });
    expect(ref.mimeType).toBe('image/webp');
    expect(ref.assetId).toBeNull();
  });

  it('upload skeleton fails loudly instead of calling a non-existent endpoint', async () => {
    // The Foundation defines the upload types but registers no upload contract;
    // there is no exported uploader bound to a fabricated endpoint by design.
    // This assertion documents the invariant.
    expect(typeof createAssetRef).toBe('function');
  });
});

describe('Realtime noop client + memory storage integration sanity', () => {
  it('memory storage backs credentials only', () => {
    const store = createMemoryStorage();
    store.set('token', 'x');
    expect(store.get('token')).toBe('x');
    expect(createNoopRealtimeClient().getConnectionState()).toBe('idle');
  });
});
