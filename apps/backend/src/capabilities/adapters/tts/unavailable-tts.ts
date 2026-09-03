/**
 * TTS Unavailable Adapter（WP-04）。
 *
 * 默认失败安全实现：Provider 未接线（TTS_PROVIDER=unavailable）时，
 * 任何合成请求抛 PROVIDER_UNAVAILABLE，绝不静默 fake-success。
 */
import type { TtsProvider, TtsRequest, TtsResult } from '../../ports/tts.js';
import { providerUnavailable } from '../../provider-error.js';

export class UnavailableTtsProvider implements TtsProvider {
  readonly name = 'unavailable';
  readonly kind = 'cloud' as const;

  private readonly context = { provider: 'tts', operation: 'synthesize' };

  async synthesize(_request: TtsRequest): Promise<TtsResult> {
    throw providerUnavailable(this.context);
  }
}
