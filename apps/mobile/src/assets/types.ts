import type { PublicId } from '../api/contracts/uuid';

/**
 * Asset foundation types.
 *
 * The Foundation defines the technical shape only. It does NOT invent a Domain
 * upload contract — the exact endpoint and payload belong to the Asset / domain
 * API that will be frozen later.
 */

export interface AssetMetadata {
  readonly width?: number;
  readonly height?: number;
  readonly durationMs?: number;
  readonly byteSize?: number;
  readonly [key: string]: unknown;
}

/** Canonical client-side asset reference. */
export interface AssetRef {
  /** Asset UUID as issued by the platform. Never a database BIGINT. */
  readonly assetId: PublicId | null;
  /** Resolvable URL (remote) or file URI (local). */
  readonly url: string;
  readonly mimeType: string | null;
  readonly metadata: AssetMetadata;
}

/** A file the user or the app selected for a future upload. */
export interface FileSource {
  readonly uri: string;
  readonly name: string | null;
  readonly mimeType: string | null;
  readonly sizeBytes: number | null;
}

export interface UploadProgress {
  readonly totalBytesSent: number;
  readonly totalBytesExpectedToSend: number;
  /** 0..1 */
  readonly ratio: number;
}

export interface UploadResultPayload {
  readonly assetId: PublicId;
  readonly raw?: unknown;
}

export interface UploadTaskHandle {
  readonly id: string;
  start(): Promise<UploadResultPayload>;
  cancel(): void;
}

export type UploadState =
  | 'idle'
  | 'uploading'
  | 'succeeded'
  | 'canceled'
  | 'failed';

export interface UploadSnapshot {
  readonly state: UploadState;
  readonly progress: UploadProgress;
  readonly error: string | null;
  /** Asset id returned by the future upload endpoint, if any. */
  readonly assetId: PublicId | null;
}

export const IDLE_UPLOAD_SNAPSHOT: UploadSnapshot = {
  state: 'idle',
  progress: { totalBytesSent: 0, totalBytesExpectedToSend: 0, ratio: 0 },
  error: null,
  assetId: null,
};

export function createProgress(
  totalBytesSent: number,
  totalBytesExpectedToSend: number,
): UploadProgress {
  const expected = totalBytesExpectedToSend > 0 ? totalBytesExpectedToSend : 0;
  return {
    totalBytesSent,
    totalBytesExpectedToSend,
    ratio: expected > 0 ? Math.min(1, totalBytesSent / expected) : 0,
  };
}

export class AssetFoundationError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AssetFoundationError';
  }
}

/**
 * Thrown when an upload is attempted before the Domain upload contract exists.
 * The Foundation must never guess an endpoint.
 */
export class UploadContractNotConfiguredError extends AssetFoundationError {
  constructor() {
    super(
      'Upload endpoint is not configured yet. The V2 upload contract must be frozen before uploads are wired.',
    );
    this.name = 'UploadContractNotConfiguredError';
  }
}
