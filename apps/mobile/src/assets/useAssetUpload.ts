import { useCallback, useEffect, useRef, useState } from 'react';

import { createLogger } from '../utils/logger';

import {
  assetService,
  createUploadTask,
  hasUploadTransport,
} from './assetService';
import { IDLE_UPLOAD_SNAPSHOT } from './types';
import type { FileSource, UploadProgress, UploadSnapshot, UploadTaskHandle } from './types';

const log = createLogger('asset-upload');

export interface UseAssetUploadResult extends UploadSnapshot {
  /** Opens the system picker and stores the selection. */
  selectFile(): Promise<FileSource | null>;
  /** Runs the upload skeleton for the current selection. */
  start(): Promise<void>;
  cancel(): void;
  reset(): void;
  readonly selectedFile: FileSource | null;
  readonly isConfigured: boolean;
  readonly isSupported: boolean;
}

/**
 * Upload skeleton hook.
 *
 * Foundation scope only: file selection, progress, cancellation and error
 * handling. No endpoint is called until `registerUploadTransport()` is used by
 * the domain that owns the frozen upload contract.
 */
export function useAssetUpload(): UseAssetUploadResult {
  const [snapshot, setSnapshot] = useState<UploadSnapshot>(IDLE_UPLOAD_SNAPSHOT);
  const [selectedFile, setSelectedFile] = useState<FileSource | null>(null);
  const taskRef = useRef<UploadTaskHandle | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      taskRef.current?.cancel();
      taskRef.current = null;
    };
  }, []);

  const selectFile = useCallback(async () => {
    try {
      const file = await assetService.pickFile();
      if (!mounted.current) {
        return null;
      }
      setSelectedFile(file);
      setSnapshot(IDLE_UPLOAD_SNAPSHOT);
      return file;
    } catch (error) {
      log.warn('file selection failed', { error: String(error) });
      if (mounted.current) {
        setSnapshot({
          ...IDLE_UPLOAD_SNAPSHOT,
          state: 'failed',
          error: error instanceof Error ? error.message : '文件选择失败。',
        });
      }
      return null;
    }
  }, []);

  const start = useCallback(async () => {
    if (!selectedFile) {
      setSnapshot({
        ...IDLE_UPLOAD_SNAPSHOT,
        state: 'failed',
        error: '请先选择文件。',
      });
      return;
    }

    setSnapshot({ ...IDLE_UPLOAD_SNAPSHOT, state: 'uploading' });

    const task = createUploadTask({
      file: selectedFile,
      onProgress: (progress: UploadProgress) => {
        if (mounted.current) {
          setSnapshot((previous) => ({ ...previous, state: 'uploading', progress }));
        }
      },
    });
    taskRef.current = task;

    try {
      const result = await task.start();
      if (!mounted.current) {
        return;
      }
      setSnapshot((previous) => ({
        ...previous,
        state: 'succeeded',
        assetId: result.assetId,
        progress: { ...previous.progress, ratio: 1 },
      }));
    } catch (error) {
      log.warn('upload failed', { error: String(error) });
      if (mounted.current) {
        setSnapshot((previous) => ({
          ...previous,
          state: 'failed',
          error: error instanceof Error ? error.message : '上传失败。',
        }));
      }
    } finally {
      taskRef.current = null;
    }
  }, [selectedFile]);

  const cancel = useCallback(() => {
    taskRef.current?.cancel();
    taskRef.current = null;
    setSnapshot((previous) => ({ ...previous, state: 'canceled' }));
  }, []);

  const reset = useCallback(() => {
    taskRef.current?.cancel();
    taskRef.current = null;
    setSelectedFile(null);
    setSnapshot(IDLE_UPLOAD_SNAPSHOT);
  }, []);

  return {
    ...snapshot,
    selectFile,
    start,
    cancel,
    reset,
    selectedFile,
    isConfigured: hasUploadTransport(),
    // The system file picker is available on Android, iOS and Web.
    isSupported: true,
  };
}
