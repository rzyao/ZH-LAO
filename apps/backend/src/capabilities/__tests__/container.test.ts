import { describe, expect, it } from 'vitest';
import { buildCapabilities, type CapabilityProviderConfig } from '../container.js';
import { AppError } from '../../errors/app-error.js';
import { PROVIDER_UNAVAILABLE } from '../../errors/business-codes.js';

const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

const FAIL_SAFE: CapabilityProviderConfig = {
  objectStorage: 'unavailable',
  translation: 'unavailable',
  tts: 'unavailable',
  media: 'unavailable',
  cache: 'none',
};

const DEV: CapabilityProviderConfig = {
  objectStorage: 'memory',
  translation: 'fake',
  tts: 'fake',
  media: 'fake',
  cache: 'memory',
};

describe('buildCapabilities (WP-04)', () => {
  it('default fail-safe config wires every capability to a PROVIDER_UNAVAILABLE-or-noop adapter', async () => {
    const capabilities = buildCapabilities(FAIL_SAFE);
    const expectUnavailable = async (action: Promise<unknown>): Promise<void> => {
      await expect(action).rejects.toBeInstanceOf(AppError);
      await expect(action).rejects.toMatchObject({ code: PROVIDER_UNAVAILABLE });
    };
    await expectUnavailable(capabilities.objectStorage.put('k', encode('x'), 'text/plain'));
    await expectUnavailable(capabilities.translation.translate({ text: 'hi', targetLanguage: 'zh' }));
    await expectUnavailable(capabilities.tts.synthesize({ text: 'hi', voice: 'v', format: 'mp3' }));
    await expectUnavailable(capabilities.media.probe({ content: encode('x'), contentType: 'audio/mpeg' }));
    await expect(capabilities.cache.get('k')).resolves.toBeUndefined();
    await expect(capabilities.cache.set('k', 'v')).resolves.toBeUndefined();
  });

  it('dev config wires memory/fake adapters that actually work', async () => {
    const capabilities = buildCapabilities(DEV);

    await capabilities.objectStorage.put('a/1', encode('x'), 'text/plain');
    await expect(capabilities.objectStorage.stat('a/1')).resolves.toMatchObject({ sizeBytes: 1 });

    await expect(capabilities.translation.translate({ text: '你好', targetLanguage: 'lo' })).resolves.toMatchObject({
      translatedText: '[fake:lo] 你好',
      provider: 'fake',
    });

    await expect(capabilities.tts.synthesize({ text: '你好', voice: 'v1', format: 'mp3' })).resolves.toMatchObject({
      contentType: 'audio/mpeg',
      provider: 'fake',
    });

    await expect(capabilities.media.probe({ content: encode('x'), contentType: 'audio/mpeg' })).resolves.toMatchObject({
      kind: 'audio',
      format: 'mp3',
    });

    await capabilities.cache.set('k', 'v', { ttlMs: 60_000 });
    await expect(capabilities.cache.get('k')).resolves.toBe('v');
  });

  it('returns a frozen capabilities object', () => {
    const capabilities = buildCapabilities(DEV);
    expect(Object.isFrozen(capabilities)).toBe(true);
  });

  it('wires Cloudflare R2 only when all S3-compatible settings are present', () => {
    expect(() => buildCapabilities({ ...FAIL_SAFE, objectStorage: 'r2' })).toThrow('R2 configuration is incomplete');
    const capabilities = buildCapabilities({
      ...FAIL_SAFE,
      objectStorage: 'r2',
      r2: { endpoint: 'https://account.r2.cloudflarestorage.com', bucket: 'audio', accessKeyId: 'key', secretAccessKey: 'secret' },
    });
    expect(capabilities.objectStorage).toMatchObject({ name: 'cloudflare-r2' });
  });
});
