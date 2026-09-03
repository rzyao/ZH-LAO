import { describe, expect, it } from 'vitest';
import { FakeMediaProcessingProvider } from '../adapters/media/fake-media.js';
import { UnavailableMediaProcessingProvider } from '../adapters/media/unavailable-media.js';
import { AppError } from '../../errors/app-error.js';
import { PROVIDER_UNAVAILABLE } from '../../errors/business-codes.js';

const encode = (text: string): Uint8Array => new TextEncoder().encode(text);

describe('FakeMediaProcessingProvider (WP-04)', () => {
  it('probes audio MIME into kind audio and normalized format', async () => {
    const provider = new FakeMediaProcessingProvider();
    const probe = await provider.probe({ content: encode('bytes'), contentType: 'audio/mpeg' });
    expect(probe.kind).toBe('audio');
    expect(probe.format).toBe('mp3');
    expect(probe.metadata).toEqual({});
  });

  it('probes image/video MIME into their own kinds', async () => {
    const provider = new FakeMediaProcessingProvider();
    await expect(provider.probe({ content: encode('x'), contentType: 'image/jpeg' })).resolves.toMatchObject({ kind: 'image', format: 'jpeg' });
    await expect(provider.probe({ content: encode('x'), contentType: 'video/mp4' })).resolves.toMatchObject({ kind: 'video', format: 'mp4' });
  });

  it('process re-wraps content into the target container without mutating input', async () => {
    const provider = new FakeMediaProcessingProvider();
    const source = encode('audio-payload');
    const result = await provider.process({ content: source, sourceContentType: 'audio/wav', targetContentType: 'audio/mpeg' });
    expect(result.contentType).toBe('audio/mpeg');
    expect(result.format).toBe('mp3');
    expect(result.content.byteLength).toBe('audio-payload'.length);
    source.fill(0);
    expect(new TextDecoder().decode(result.content)).toBe('audio-payload');
  });
});

describe('UnavailableMediaProcessingProvider (WP-04 fail-safe)', () => {
  it('throws PROVIDER_UNAVAILABLE AppError for probe and process', async () => {
    const provider = new UnavailableMediaProcessingProvider();
    const probeError = await provider.probe({ content: encode('x'), contentType: 'audio/mpeg' }).catch((caught: unknown) => caught);
    const processError = await provider
      .process({ content: encode('x'), sourceContentType: 'audio/wav', targetContentType: 'audio/mpeg' })
      .catch((caught: unknown) => caught);
    expect(probeError).toBeInstanceOf(AppError);
    expect(processError).toBeInstanceOf(AppError);
    expect(probeError).toMatchObject({ code: PROVIDER_UNAVAILABLE });
    expect(processError).toMatchObject({ code: PROVIDER_UNAVAILABLE });
  });
});
