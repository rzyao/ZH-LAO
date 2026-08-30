/**
 * Asset foundation public surface.
 *
 * Screens use `expo-image` for rendering and this module for everything else.
 */

export {
  assetService,
  createAssetRef,
  createProgress,
  createUploadTask,
  guessMimeType,
  hasUploadTransport,
  registerUploadTransport,
  resolveAssetUrl,
  uploadSnapshotFromProgress,
} from './assetService';
export type {
  LocalFileInfo,
  UploadRequest,
  UploadResultPayload,
  UploadTransport,
} from './assetService';

export { useAssetUpload } from './useAssetUpload';
export type { UseAssetUploadResult } from './useAssetUpload';

export {
  AssetFoundationError,
  IDLE_UPLOAD_SNAPSHOT,
  UploadContractNotConfiguredError,
} from './types';
export type {
  AssetMetadata,
  AssetRef,
  FileSource,
  UploadProgress,
  UploadSnapshot,
  UploadState,
  UploadTaskHandle,
} from './types';
