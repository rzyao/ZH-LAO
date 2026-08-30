import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RecordingPresets, useAudioRecorder } from 'expo-audio';
import type { AudioRecorder, RecordingStatus } from 'expo-audio';

import { createLogger } from '../utils/logger';

import { audioService } from './audioService';
import type { AudioPermissionState, AudioRecordingSnapshot, AudioRecordingState } from './types';

const log = createLogger('audio-recording');

export interface UseAudioRecordingResult extends AudioRecordingSnapshot {
  /** Requests the microphone permission and returns the outcome. */
  requestPermission(): Promise<AudioPermissionState>;
  /** Prepares the recorder (idempotent). */
  prepare(): Promise<boolean>;
  record(): Promise<boolean>;
  stop(): Promise<string | null>;
  /** Releases recorder resources. Safe to call multiple times. */
  cleanup(): void;
  readonly isSupported: boolean;
}

/**
 * Foundation recording hook.
 *
 * Scope: permission -> prepare -> record -> stop -> cleanup.
 * No learning-domain recording flow is implemented here.
 *
 * The native recorder state (`durationMillis` / `metering`) is derived during
 * render rather than mirrored through an effect, which keeps the hook free of
 * render-triggering state writes.
 */
export function useAudioRecording(): UseAudioRecordingResult {
  const isSupported = audioService.isRecordingSupported();

  const [phase, setPhase] = useState<AudioRecordingState>('idle');
  const [permission, setPermission] = useState<AudioPermissionState>('undetermined');
  const [error, setError] = useState<string | null>(null);
  const [completedUri, setCompletedUri] = useState<string | null>(null);
  const [nativeStatus, setNativeStatus] = useState<{ durationMillis: number; metering: number | null }>({
    durationMillis: 0,
    metering: null,
  });

  const preparedRef = useRef(false);
  const recorderRef = useRef<AudioRecorder | null>(null);

  const handleStatus = useCallback(
    (status: RecordingStatus) => {
      if (status.hasError) {
        log.warn('recording status error', { error: status.error });
        setPhase('error');
        setError(status.error ?? '录音失败。');
        return;
      }
      if (status.isFinished) {
        setPhase('stopped');
        if (status.url) {
          setCompletedUri(status.url);
        }
      }
    },
    [],
  );

  const recorder: AudioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, handleStatus);

  useEffect(() => {
    recorderRef.current = recorder;
    return () => {
      recorderRef.current = null;
    };
  }, [recorder]);

  // Sampling loop: reads the imperative recorder status into state.
  useEffect(() => {
    if (phase !== 'recording') {
      return;
    }
    const timer = setInterval(() => {
      const state = recorder.getStatus();
      setNativeStatus({
        durationMillis: typeof state.durationMillis === 'number' ? state.durationMillis : 0,
        metering: typeof state.metering === 'number' ? state.metering : null,
      });
    }, 120);
    return () => {
      clearInterval(timer);
    };
  }, [phase, recorder]);

  const cleanup = useCallback(() => {
    try {
      if (recorder.isRecording) {
        void recorder.stop();
      }
    } catch (caught) {
      log.warn('recorder cleanup failed', { error: String(caught) });
    }
    preparedRef.current = false;
    setPhase('idle');
    setNativeStatus({ durationMillis: 0, metering: null });
  }, [recorder]);

  // Release recorder resources when the screen goes away.
  useEffect(() => {
    const active = recorder;
    return () => {
      try {
        if (active.isRecording) {
          void active.stop();
        }
      } catch {
        // Unmount cleanup must never throw.
      }
    };
  }, [recorder]);

  const requestPermission = useCallback(async (): Promise<AudioPermissionState> => {
    if (!isSupported) {
      setPermission('unsupported');
      return 'unsupported';
    }
    const result = await audioService.requestRecordingPermission();
    setPermission(result);
    return result;
  }, [isSupported]);

  const prepare = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setPhase('error');
      setError('当前平台不支持录音。');
      return false;
    }

    setPhase('preparing');
    setError(null);

    try {
      const result = await audioService.requestRecordingPermission();
      setPermission(result);
      if (result !== 'granted') {
        setPhase('error');
        setError('未获得麦克风权限。');
        return false;
      }

      await audioService.configureRecordingMode();
      if (!preparedRef.current) {
        await recorder.prepareToRecordAsync();
        preparedRef.current = true;
      }

      setPhase('idle');
      return true;
    } catch (caught) {
      log.warn('recorder prepare failed', { error: String(caught) });
      setPhase('error');
      setError(caught instanceof Error ? caught.message : '录音准备失败。');
      return false;
    }
  }, [isSupported, recorder]);

  const record = useCallback(async (): Promise<boolean> => {
    if (!preparedRef.current) {
      const ready = await prepare();
      if (!ready) {
        return false;
      }
    }
    try {
      recorder.record();
      setCompletedUri(null);
      setError(null);
      setPhase('recording');
      return true;
    } catch (caught) {
      log.warn('recorder start failed', { error: String(caught) });
      setPhase('error');
      setError(caught instanceof Error ? caught.message : '录音启动失败。');
      return false;
    }
  }, [prepare, recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      preparedRef.current = false;
      setCompletedUri(uri);
      setPhase('stopped');
      setNativeStatus({ durationMillis: 0, metering: null });
      return uri;
    } catch (caught) {
      log.warn('recorder stop failed', { error: String(caught) });
      setPhase('error');
      setError(caught instanceof Error ? caught.message : '停止录音失败。');
      return null;
    }
  }, [recorder]);

  return useMemo<UseAudioRecordingResult>(
    () => ({
      state: phase,
      permission,
      durationMillis: nativeStatus.durationMillis,
      metering: nativeStatus.metering,
      uri: completedUri,
      error,
      requestPermission,
      prepare,
      record,
      stop,
      cleanup,
      isSupported,
    }),
    [
      phase,
      permission,
      nativeStatus,
      completedUri,
      error,
      requestPermission,
      prepare,
      record,
      stop,
      cleanup,
      isSupported,
    ],
  );
}
