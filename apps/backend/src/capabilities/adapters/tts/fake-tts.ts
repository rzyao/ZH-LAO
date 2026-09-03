/**
 * TTS Fake Adapter（WP-04）。
 *
 * 仅用于 development/test（config schema 禁止 production 使用）。
 * 以 'cloud' kind 提供确定性的合成字节，用于 Interactive TTS 契约测试与本地联调；
 * 不代表真实语音质量。真实 Cloud / Local Provider 后续在本目录新增 Adapter，
 * Port 与业务域代码无需改动。Local TTS（Library Audio Production 路径）不要求
 * 实时响应，届时以 kind='local' 的 Adapter 表达，异步化边界保持在 Job/Worker 层。
 */
import type { TtsAudioFormat, TtsProvider, TtsRequest, TtsResult } from '../../ports/tts.js';

const CONTENT_TYPES: Readonly<Record<TtsAudioFormat, string>> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
};

export class FakeTtsProvider implements TtsProvider {
  readonly name = 'fake';
  readonly kind = 'cloud' as const;

  async synthesize(request: TtsRequest): Promise<TtsResult> {
    const payload = `[fake-tts:${request.format}:${request.voice}:${request.text.length}]`;
    return {
      audio: new TextEncoder().encode(payload),
      contentType: CONTENT_TYPES[request.format],
      format: request.format,
      provider: this.name,
    };
  }
}
