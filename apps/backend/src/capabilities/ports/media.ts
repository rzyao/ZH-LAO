/**
 * Media Processing 能力 Port（WP-04）。
 *
 * 职责边界：Media capability 只负责技术处理（格式探测 / 转换 / codec / 时长 /
 * 元数据提取）。业务状态（Task / Attempt / Review / 发布状态机）归业务域所有，
 * 不在本 Port 暴露任何业务状态机。
 *
 * 本 WP 以字节级同步契约为准（处理产物由调用方决定写 Object Storage 并登记
 * metadata）；生产级 Media Adapter 若需流式/远端处理，可基于 Object Storage
 * 引用扩展新的请求形态，但不得改动现有 Port 的语义。
 */
export type MediaContainerKind = 'audio' | 'image' | 'video';

export type MediaProbeRequest = Readonly<{
  content: Uint8Array;
  /** 源 MIME，如 'audio/mpeg' / 'image/jpeg'。 */
  contentType: string;
}>;

export type MediaProbeResult = Readonly<{
  kind: MediaContainerKind;
  /** 归一化容器/编码格式名，如 'mp3' / 'wav' / 'jpeg' / 'mp4'。 */
  format: string;
  /** 音频/视频编码（如 'aac' / 'opus'）；探测不到时省略。 */
  codec?: string;
  /** 音频/视频时长（毫秒）；不可得时省略。 */
  durationMs?: number;
  width?: number;
  height?: number;
  metadata: Readonly<Record<string, string>>;
}>;

export type MediaProcessRequest = Readonly<{
  content: Uint8Array;
  sourceContentType: string;
  targetContentType: string;
}>;

export type MediaProcessResult = Readonly<{
  content: Uint8Array;
  contentType: string;
  /** 归一化目标格式名（如 'mp3'）。 */
  format: string;
}>;

/** 业务域依赖的最小契约。 */
export interface MediaProcessingPort {
  probe(request: MediaProbeRequest): Promise<MediaProbeResult>;
  process(request: MediaProcessRequest): Promise<MediaProcessResult>;
}

/** Provider Adapter 契约：在 Port 之上附加可诊断的 Provider 名称。 */
export interface MediaProcessingProvider extends MediaProcessingPort {
  readonly name: string;
}
