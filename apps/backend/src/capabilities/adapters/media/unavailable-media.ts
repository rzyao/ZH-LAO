/**
 * Media Processing Unavailable Adapter（WP-04）。
 *
 * 默认失败安全实现：Provider 未接线（MEDIA_PROCESSING_PROVIDER=unavailable）时，
 * 任何探测/处理请求抛 PROVIDER_UNAVAILABLE，绝不静默 fake-success。
 */
import type {
  MediaProcessingProvider,
  MediaProcessRequest,
  MediaProcessResult,
  MediaProbeRequest,
  MediaProbeResult,
} from '../../ports/media.js';
import { providerUnavailable } from '../../provider-error.js';

export class UnavailableMediaProcessingProvider implements MediaProcessingProvider {
  readonly name = 'unavailable';

  private readonly context = { provider: 'media', operation: 'unavailable' };

  async probe(_request: MediaProbeRequest): Promise<MediaProbeResult> {
    throw providerUnavailable(this.context);
  }

  async process(_request: MediaProcessRequest): Promise<MediaProcessResult> {
    throw providerUnavailable(this.context);
  }
}
