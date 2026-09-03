/**
 * TTS 能力 Port（WP-04）。
 *
 * 两条路径共用同一同步 Port 契约；异步化边界在 Port 之外的调用方 / Job / Worker 层，
 * 禁止为了统一接口破坏 Library Audio Production 的异步模型，也禁止把
 * Interactive TTS 强制异步化：
 *
 * 1) Interactive TTS（实时）：Client → Backend → Cloud TTS Adapter（kind='cloud'）→ Response；
 * 2) Library Audio Production（非实时）：Content / Audio Production 域 → Job → Worker
 *    → TTS Adapter（kind='cloud' | 'local'）→ Object Storage Port → Asset metadata。
 *
 * Port 只负责“文本 → 音频字节”的一次合成（request/result 语义）；
 * 合成后置的写对象存储、登记 Asset metadata、维护业务状态（Task/Attempt/Review）等
 * 均由调用方（Worker / Job / 域服务）负责，不进入本 Port。
 */
export type TtsAudioFormat = 'mp3' | 'wav' | 'ogg';

/** Provider voice id 或 Preset Key；Audio 域只保存实际使用的 key，不复制参数定义。 */
export type TtsVoice = string;

export type TtsRequest = Readonly<{
  text: string;
  voice: TtsVoice;
  format: TtsAudioFormat;
  /** 可选语言提示（如 'zh' / 'lo'）；Provider 不支持时忽略。 */
  language?: string;
}>;

export type TtsResult = Readonly<{
  audio: Uint8Array;
  /** 实际音频 MIME，如 'audio/mpeg' / 'audio/wav' / 'audio/ogg'。 */
  contentType: string;
  format: TtsAudioFormat;
  provider: string;
  /** Provider 可回传的合成时长；不承诺所有 Provider 提供。 */
  durationMs?: number;
}>;

export type TtsProviderKind = 'cloud' | 'local';

/** 业务域依赖的最小契约：只暴露合成能力。 */
export interface TtsPort {
  synthesize(request: TtsRequest): Promise<TtsResult>;
}

/** Provider Adapter 契约：kind 标识实时性承诺，供调用方选择交互/生产路径。 */
export interface TtsProvider extends TtsPort {
  readonly name: string;
  /** 'cloud' = 交互式实时路径可用；'local' = 面向 Library 生产，不承诺实时响应。 */
  readonly kind: TtsProviderKind;
}
