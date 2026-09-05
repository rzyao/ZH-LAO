/**
 * Capability 容器（WP-04）：按 backend config schema 的 Provider 选择装配 Adapter。
 *
 * 组装规则：
 * - Business Domain 只依赖 capabilities/ports（或 assets/object-storage.ts）中的 Port；
 * - Provider 具体实现仅在本容器与 composition root 可见；
 * - check-architecture 护栏禁止业务模块 import capabilities/adapters 或 container。
 *
 * 装配产物为只读 Capabilities；Memory/Noop Adapter 内部可变状态（如缓存 Map）
 * 属于单实例生命周期内状态，生产多实例共享状态必须由外部 Provider 提供。
 */
import type { ObjectStoragePort } from '../assets/object-storage.js';
import type { CachePort } from './ports/cache.js';
import type { MediaProcessingPort } from './ports/media.js';
import type { TranslationPort } from './ports/translation.js';
import type { TtsPort } from './ports/tts.js';
import { MemoryObjectStorage } from './adapters/object-storage/memory-object-storage.js';
import { UnavailableObjectStorage } from './adapters/object-storage/unavailable-object-storage.js';
import { R2ObjectStorage } from './adapters/object-storage/r2-object-storage.js';
import { FakeTranslationProvider } from './adapters/translation/fake-translation.js';
import { UnavailableTranslationProvider } from './adapters/translation/unavailable-translation.js';
import { FakeTtsProvider } from './adapters/tts/fake-tts.js';
import { UnavailableTtsProvider } from './adapters/tts/unavailable-tts.js';
import { FakeMediaProcessingProvider } from './adapters/media/fake-media.js';
import { UnavailableMediaProcessingProvider } from './adapters/media/unavailable-media.js';
import { MemoryCacheAdapter } from './adapters/cache/memory-cache.js';
import { NoopCacheAdapter } from './adapters/cache/noop-cache.js';

export type Capabilities = Readonly<{
  objectStorage: ObjectStoragePort;
  translation: TranslationPort;
  tts: TtsPort;
  media: MediaProcessingPort;
  cache: CachePort;
}>;

/** AppConfig['capabilities'] 的窄化形态，便于独立测试（不依赖完整环境变量）。 */
export type CapabilityProviderConfig = Readonly<{
  objectStorage: 'unavailable' | 'memory' | 'r2';
  r2?: Readonly<{ endpoint: string; bucket: string; accessKeyId: string; secretAccessKey: string }>;
  translation: 'unavailable' | 'fake';
  tts: 'unavailable' | 'fake';
  media: 'unavailable' | 'fake';
  cache: 'none' | 'memory';
}>;

function assertNever(value: never): never {
  throw new Error(`Unhandled capability provider selection: ${JSON.stringify(value)}`);
}

export function buildCapabilities(config: CapabilityProviderConfig): Capabilities {
  const objectStorage: ObjectStoragePort = (() => {
    switch (config.objectStorage) {
      case 'memory': return new MemoryObjectStorage();
      case 'r2': {
        const r2 = config.r2;
        if (!r2?.endpoint || !r2.bucket || !r2.accessKeyId || !r2.secretAccessKey) throw new Error('R2 configuration is incomplete');
        return new R2ObjectStorage({ endpoint: r2.endpoint, bucket: r2.bucket, accessKeyId: r2.accessKeyId, secretAccessKey: r2.secretAccessKey });
      }
      case 'unavailable': return new UnavailableObjectStorage();
      default: return assertNever(config.objectStorage);
    }
  })();
  const translation: TranslationPort = (() => {
    switch (config.translation) {
      case 'fake': return new FakeTranslationProvider();
      case 'unavailable': return new UnavailableTranslationProvider();
      default: return assertNever(config.translation);
    }
  })();
  const tts: TtsPort = (() => {
    switch (config.tts) {
      case 'fake': return new FakeTtsProvider();
      case 'unavailable': return new UnavailableTtsProvider();
      default: return assertNever(config.tts);
    }
  })();
  const media: MediaProcessingPort = (() => {
    switch (config.media) {
      case 'fake': return new FakeMediaProcessingProvider();
      case 'unavailable': return new UnavailableMediaProcessingProvider();
      default: return assertNever(config.media);
    }
  })();
  const cache: CachePort = (() => {
    switch (config.cache) {
      case 'memory': return new MemoryCacheAdapter();
      case 'none': return new NoopCacheAdapter();
      default: return assertNever(config.cache);
    }
  })();
  return Object.freeze({ objectStorage, translation, tts, media, cache });
}
