/**
 * Capability Layer（WP-04）统一出口。
 *
 * 层次（只允许单向依赖）：
 *   Business Domain → Capability Port → Provider Adapter → External Service
 *
 * - Ports：translation / tts / media / cache（object storage Port 位于
 *   assets/object-storage.ts，与 Asset Infrastructure 同处，属共享基础设施）。
 * - Provider Adapter：capabilities/adapters/<capability>/，业务域禁止直接 import。
 * - 装配：buildCapabilities(config) 按 config schema 选择 Adapter。
 * - 错误：provider-error.ts 统一产出 AppError（ADR-023 兼容），不新造契约。
 * - External Provider：external-provider.ts 提供超时/重试/上游错误建模原语。
 */
export { buildCapabilities, type Capabilities, type CapabilityProviderConfig } from './container.js';
export { providerUnavailable, mapProviderError, type ProviderContext } from './provider-error.js';
export {
  ExternalProviderClient,
  ProviderTimeoutError,
  UpstreamHttpError,
  backoffDelayMs,
  isRetryableHttpStatus,
  withRetries,
  withTimeout,
  type ExternalJsonCallOptions,
  type ExternalProviderClientOptions,
  type RetryOptions,
  type RetryPolicy,
} from './external-provider.js';
export type { TranslationPort, TranslationProvider, TranslationRequest, TranslationResult } from './ports/translation.js';
export type { TtsPort, TtsProvider, TtsRequest, TtsResult, TtsAudioFormat, TtsProviderKind, TtsVoice } from './ports/tts.js';
export type {
  MediaProcessingPort,
  MediaProcessingProvider,
  MediaProbeRequest,
  MediaProbeResult,
  MediaProcessRequest,
  MediaProcessResult,
  MediaContainerKind,
} from './ports/media.js';
export type { CachePort, CacheProvider, CacheSetOptions } from './ports/cache.js';
