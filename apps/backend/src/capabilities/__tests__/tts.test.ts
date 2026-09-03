import { describe, expect, it } from 'vitest';
import { FakeTtsProvider } from '../adapters/tts/fake-tts.js';
import { UnavailableTtsProvider } from '../adapters/tts/unavailable-tts.js';
import type { TtsProvider } from '../ports/tts.js';
import { AppError } from '../../errors/app-error.js';
import { PROVIDER_UNAVAILABLE } from '../../errors/business-codes.js';

const decode = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

describe('FakeTtsProvider (WP-04)', () => {
  it('synthesizes deterministic bytes with content-type for the requested format', async () => {
    const provider = new FakeTtsProvider();
    const result = await provider.synthesize({ text: '你好', voice: 'preset-1', format: 'mp3' });
    expect(result.provider).toBe('fake');
    expect(result.contentType).toBe('audio/mpeg');
    expect(result.format).toBe('mp3');
    expect(decode(result.audio)).toBe('[fake-tts:mp3:preset-1:2]');
  });

  it('maps each audio format to its MIME type', async () => {
    const provider = new FakeTtsProvider();
    const wav = await provider.synthesize({ text: 'a', voice: 'v', format: 'wav' });
    const ogg = await provider.synthesize({ text: 'a', voice: 'v', format: 'ogg' });
    expect(wav.contentType).toBe('audio/wav');
    expect(ogg.contentType).toBe('audio/ogg');
  });

  it('is marked cloud-kind so interactive real-time path may use it', () => {
    const provider = new FakeTtsProvider() as TtsProvider;
    expect(provider.kind).toBe('cloud');
  });
});

describe('UnavailableTtsProvider (WP-04 fail-safe)', () => {
  it('throws PROVIDER_UNAVAILABLE AppError instead of faking success', async () => {
    const provider = new UnavailableTtsProvider();
    const error = await provider.synthesize({ text: 'hi', voice: 'v', format: 'mp3' }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: PROVIDER_UNAVAILABLE });
    expect((error as AppError).details).toMatchObject({ provider: 'tts', operation: 'synthesize' });
  });
});
