import { describe, expect, it } from 'vitest';
import { FakeTranslationProvider } from '../adapters/translation/fake-translation.js';
import { UnavailableTranslationProvider } from '../adapters/translation/unavailable-translation.js';
import type { TranslationRequest } from '../ports/translation.js';
import { AppError } from '../../errors/app-error.js';
import { PROVIDER_UNAVAILABLE } from '../../errors/business-codes.js';

describe('FakeTranslationProvider (WP-04)', () => {
  it('produces a deterministic default result tagged with provider name', async () => {
    const provider = new FakeTranslationProvider();
    const result = await provider.translate({ text: '你好', targetLanguage: 'lo' });
    expect(result.translatedText).toBe('[fake:lo] 你好');
    expect(result.provider).toBe('fake');
  });

  it('delegates to an injected engine and preserves request fields', async () => {
    const seen: TranslationRequest[] = [];
    const provider = new FakeTranslationProvider((request) => {
      seen.push(request);
      return `引擎结果:${request.text}`;
    });
    const request: TranslationRequest = { text: 'ສະບາຍດີ', targetLanguage: 'zh', sourceLanguage: 'lo' };
    const result = await provider.translate(request);
    expect(result.translatedText).toBe('引擎结果:ສະບາຍດີ');
    expect(result.provider).toBe('fake');
    expect(seen).toEqual([request]);
  });

  it('is a synchronous lightweight capability (no async-forced contract)', async () => {
    const provider = new FakeTranslationProvider();
    await expect(provider.translate({ text: 'x', targetLanguage: 'zh' })).resolves.toMatchObject({ provider: 'fake' });
  });
});

describe('UnavailableTranslationProvider (WP-04 fail-safe)', () => {
  it('throws PROVIDER_UNAVAILABLE AppError carrying provider context', async () => {
    const provider = new UnavailableTranslationProvider();
    const error = await provider.translate({ text: 'hi', targetLanguage: 'zh' }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: PROVIDER_UNAVAILABLE, httpStatus: 503, expose: true });
    expect((error as AppError).details).toMatchObject({ provider: 'translation', operation: 'translate' });
  });
});
