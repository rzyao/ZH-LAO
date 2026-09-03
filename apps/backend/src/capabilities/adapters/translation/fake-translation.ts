/**
 * Translation Fake Adapter（WP-04）。
 *
 * 仅用于 development/test（config schema 禁止 production 使用）：
 * 提供确定性的可替换“翻译引擎”，用于契约测试与本地联调，不代表真实翻译质量。
 * 真实云 Provider 后续在本目录新增 Adapter，Port 与业务域代码无需改动。
 */
import type { TranslationProvider, TranslationRequest, TranslationResult } from '../../ports/translation.js';

export type FakeTranslationEngine = (request: TranslationRequest) => string;

const defaultEngine: FakeTranslationEngine = (request) => `[fake:${request.targetLanguage}] ${request.text}`;

export class FakeTranslationProvider implements TranslationProvider {
  readonly name = 'fake';

  constructor(private readonly engine: FakeTranslationEngine = defaultEngine) {}

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    return { translatedText: this.engine(request), provider: this.name };
  }
}
