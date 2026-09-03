/**
 * Media Processing Fake Adapter（WP-04）。
 *
 * 仅用于 development/test（config schema 禁止 production 使用）：
 * 确定性“技术处理”实现，用于 Port 契约测试与本地联调。probe 只做 MIME 解析；
 * process 原样返回目标封装（真实转码/探测由生产级 Adapter 负责，如基于 ffmpeg /
 * 云媒体服务；生产级实现基于 Object Storage 引用或流式处理，另行扩展）。
 */
import type {
  MediaContainerKind,
  MediaProcessingProvider,
  MediaProcessRequest,
  MediaProcessResult,
  MediaProbeRequest,
  MediaProbeResult,
} from '../../ports/media.js';

const FORMAT_ALIASES: Readonly<Record<string, string>> = {
  mpeg: 'mp3',
  'x-wav': 'wav',
  'x-msvideo': 'avi',
  'x-matroska': 'mkv',
  'x-ms-wmv': 'wmv',
};

function containerKind(contentType: string): MediaContainerKind {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  return 'audio';
}

function formatName(contentType: string): string {
  const subtype = contentType.split('/')[1] ?? 'unknown';
  return FORMAT_ALIASES[subtype] ?? subtype;
}

export class FakeMediaProcessingProvider implements MediaProcessingProvider {
  readonly name = 'fake';

  async probe(request: MediaProbeRequest): Promise<MediaProbeResult> {
    return {
      kind: containerKind(request.contentType),
      format: formatName(request.contentType),
      metadata: {},
    };
  }

  async process(request: MediaProcessRequest): Promise<MediaProcessResult> {
    return {
      content: new Uint8Array(request.content), // 快照语义
      contentType: request.targetContentType,
      format: formatName(request.targetContentType),
    };
  }
}
