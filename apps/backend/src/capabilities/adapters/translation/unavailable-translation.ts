/**
 * Translation Unavailable Adapter（WP-04）。
 *
 * 默认失败安全实现：Provider 未接线（TRANSLATION_PROVIDER=unavailable）时，
 * 任何翻译请求抛 PROVIDER_UNAVAILABLE，绝不静默 fake-success。
 */
import type { TranslationProvider, TranslationRequest, TranslationResult } from '../../ports/translation.js';
import { providerUnavailable } from '../../provider-error.js';

export class UnavailableTranslationProvider implements TranslationProvider {
  readonly name = 'unavailable';

  private readonly context = { provider: 'translation', operation: 'translate' };

  async translate(_request: TranslationRequest): Promise<TranslationResult> {
    throw providerUnavailable(this.context);
  }
}
