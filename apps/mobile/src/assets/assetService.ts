/**
 * AssetService — the single abstraction over `expo-image` / `expo-file-system`.
 *
 * Provides:
 * - asset reference construction and URL resolution;
 * - local file metadata reads;
 * - a media cache (download to the cache directory);
 * - file selection via the system picker;
 * - an upload SKELETON with progress + cancellation.
 *
 * The upload skeleton performs no network call until a real V2 upload contract
 * is registered; calling it before that fails loudly.
 */

import { Directory, File, Paths } from 'expo-file-system';

import type { PublicId } from '../api/contracts/uuid';
import { createLogger } from '../utils/logger';

import {
  AssetFoundationError,
  UploadContractNotConfiguredError,
  createProgress,
  type AssetRef,
  type FileSource,
  type UploadProgress,
  type UploadSnapshot,
  type UploadTaskHandle,
} from './types';

const log = createLogger('asset-service');

export interface LocalFileInfo {
  readonly uri: string;
  readonly exists: boolean;
  readonly sizeBytes: number | null;
  readonly mimeType: string | null;
}

const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  mp4: 'video/mp4',
  json: 'application/json',
  pdf: 'application/pdf',
  txt: 'text/plain',
};

export function guessMimeType(uriOrName: string | null | undefined): string | null {
  if (!uriOrName) {
    return null;
  }
  const cleaned = uriOrName.split(/[?#]/)[0] ?? '';
  const match = /\.([a-z0-9]+)$/i.exec(cleaned);
  if (!match?.[1]) {
    return null;
  }
  return MIME_BY_EXTENSION[match[1].toLowerCase()] ?? null;
}

function isRemoteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith('blob:');
}

/**
 * Resolves an asset reference to something the UI can render.
 * Remote URLs are returned untouched; local paths are normalised to file URIs.
 */
export function resolveAssetUrl(ref: Pick<AssetRef, 'url'> | null | undefined): string | null {
  if (!ref?.url) {
    return null;
  }
  const url = ref.url;
  if (isRemoteUrl(url) || url.startsWith('file://')) {
    return url;
  }
  return `file://${url.replace(/^\/+/, '')}`;
}

export function createAssetRef(input: {
  assetId?: PublicId | null;
  url: string;
  mimeType?: string | null;
  metadata?: AssetRef['metadata'];
}): AssetRef {
  return {
    assetId: input.assetId ?? null,
    url: input.url,
    mimeType: input.mimeType ?? guessMimeType(input.url),
    metadata: input.metadata ?? {},
  };
}

export const assetService = {
  /** Cache directory used for downloaded media. */
  get cacheDirectory(): Directory {
    return Paths.cache;
  },

  /** Reads metadata for a local file. Remote URLs are reported as unknown. */
  async readLocalFileInfo(uri: string): Promise<LocalFileInfo> {
    if (isRemoteUrl(uri)) {
      return { uri, exists: false, sizeBytes: null, mimeType: guessMimeType(uri) };
    }
    try {
      const file = new File(uri);
      if (!file.exists) {
        return { uri, exists: false, sizeBytes: null, mimeType: guessMimeType(uri) };
      }
      return {
        uri,
        exists: true,
        sizeBytes: file.size ?? null,
        mimeType: guessMimeType(uri),
      };
    } catch (error) {
      log.warn('file info read failed', { uri, error: String(error) });
      return { uri, exists: false, sizeBytes: null, mimeType: guessMimeType(uri) };
    }
  },

  /** Downloads a remote asset into the cache directory and returns the local URI. */
  async cacheRemoteAsset(url: string, fileName?: string): Promise<string | null> {
    if (!isRemoteUrl(url)) {
      return resolveAssetUrl({ url });
    }
    try {
      const name = fileName ?? buildCacheFileName(url);
      const target = new File(Paths.cache, name);
      if (target.exists) {
        return target.uri;
      }
      const downloaded = await File.downloadFileAsync(url, target, { idempotent: true });
      return downloaded.uri;
    } catch (error) {
      log.warn('asset download failed', { url, error: String(error) });
      return null;
    }
  },

  /** Removes a cached file. Non-existent files are a no-op. */
  async removeCachedAsset(uri: string): Promise<boolean> {
    try {
      const file = new File(uri);
      if (!file.exists) {
        return false;
      }
      file.delete();
      return true;
    } catch (error) {
      log.warn('cached asset removal failed', { uri, error: String(error) });
      return false;
    }
  },

  /** Opens the system file picker. Returns `null` when the user cancels. */
  async pickFile(
    options: { initialUri?: string; mimeType?: string } = {},
  ): Promise<FileSource | null> {
    try {
      const result = await File.pickFileAsync(options.initialUri, options.mimeType);
      if (!result) {
        return null;
      }
      const file = Array.isArray(result) ? result[0] : result;
      if (!file) {
        return null;
      }
      const info = await assetService.readLocalFileInfo(file.uri);
      const fileName = file.uri.split(/[/\\]/).pop() ?? null;
      return {
        uri: file.uri,
        name: fileName,
        mimeType: guessMimeType(fileName ?? file.uri),
        sizeBytes: info.sizeBytes,
      };
    } catch (error) {
      log.warn('file selection failed', { error: String(error) });
      throw new AssetFoundationError('文件选择失败。', error);
    }
  },
};

function buildCacheFileName(url: string): string {
  const base = (url.split(/[?#]/)[0] ?? 'asset').split('/').pop() ?? 'asset';
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return safe.length > 0 ? safe : 'asset';
}

/* -------------------------------------------------------------------------- */
/* Upload skeleton                                                            */
/* -------------------------------------------------------------------------- */

export interface UploadRequest {
  readonly file: FileSource;
  readonly signal?: AbortSignal;
  readonly onProgress?: (progress: UploadProgress) => void;
}

export interface UploadResultPayload {
  readonly assetId: PublicId;
  readonly raw?: unknown;
}

/**
 * Transport implemented once the real V2 upload endpoint is frozen.
 * The Foundation ships no implementation.
 */
export interface UploadTransport {
  upload(request: UploadRequest): Promise<UploadResultPayload>;
}

let uploadTransport: UploadTransport | null = null;

export function registerUploadTransport(transport: UploadTransport | null): void {
  uploadTransport = transport;
}

export function hasUploadTransport(): boolean {
  return uploadTransport !== null;
}

/**
 * Upload skeleton: progress + cancellation plumbing, no endpoint guessing.
 * Throws `UploadContractNotConfiguredError` until a transport is registered.
 */
export function createUploadTask(request: UploadRequest): UploadTaskHandle {
  const id = `upload_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  let canceled = false;

  return {
    id,
    async start(): Promise<UploadResultPayload> {
      if (canceled) {
        throw new AssetFoundationError('Upload was canceled before it started.');
      }
      if (!uploadTransport) {
        throw new UploadContractNotConfiguredError();
      }
      return uploadTransport.upload({
        ...request,
        onProgress: (progress) => {
          if (!canceled) {
            request.onProgress?.(progress);
          }
        },
      });
    },
    cancel() {
      canceled = true;
      log.debug('upload canceled', { id });
    },
  };
}

export function uploadSnapshotFromProgress(progress: UploadProgress): UploadSnapshot {
  return {
    state: progress.ratio >= 1 ? 'succeeded' : 'uploading',
    progress,
    error: null,
    assetId: null,
  };
}

export { createProgress, resolveAssetUrl as resolveUrl };
export type { AssetRef, FileSource, UploadProgress, UploadSnapshot };
