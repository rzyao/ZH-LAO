import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { createLogger } from '../utils/logger';

import { audioService } from './audioService';
import type { PlaybackHandle } from './audioService';
import {
  IDLE_PLAYBACK_SNAPSHOT,
  describeAudioSource,
  type AudioPlaybackSnapshot,
  type AudioSourceInput,
} from './types';

const log = createLogger('audio-playback');

export interface UseAudioPlaybackResult extends AudioPlaybackSnapshot {
  /** Loads a source and starts playback. */
  load(source: AudioSourceInput): Promise<void>;
  play(): void;
  pause(): void;
  resume(): void;
  seek(seconds: number): Promise<void>;
  stop(): void;
  /** Stops and releases the underlying player. */
  release(): void;
  /** Auto-pauses on background and restores audio on foreground. */
  readonly pauseOnBackground: boolean;
}

export interface UseAudioPlaybackOptions {
  /** Poll interval for position/duration updates, in milliseconds. */
  readonly updateIntervalMs?: number;
  /** Release the player when the app goes to the background. Default: false. */
  readonly releaseOnBackground?: boolean;
}

/**
 * Foundation playback hook.
 *
 * Lifecycle guarantees:
 * - the player is released when the component unmounts;
 * - backgrounding pauses playback (and optionally releases the player);
 * - `release()` is idempotent.
 */
export function useAudioPlayback(options: UseAudioPlaybackOptions = {}): UseAudioPlaybackResult {
  const { updateIntervalMs = 200, releaseOnBackground = false } = options;

  const handleRef = useRef<PlaybackHandle | null>(null);
  const [snapshot, setSnapshot] = useState<AudioPlaybackSnapshot>(IDLE_PLAYBACK_SNAPSHOT);
  const [pauseOnBackground, setPauseOnBackground] = useState(false);

  const release = useCallback(() => {
    handleRef.current?.release();
    handleRef.current = null;
    setSnapshot(IDLE_PLAYBACK_SNAPSHOT);
  }, []);

  useEffect(() => {
    return () => {
      handleRef.current?.release();
      handleRef.current = null;
    };
  }, []);

  // Screen/app lifecycle: pause on background, resume audio subsystem on
  // foreground. Prevents a stuck audio session and frees resources.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        const handle = handleRef.current;
        if (handle?.isPlaying) {
          setPauseOnBackground(true);
          handle.pause();
          setSnapshot((previous) => ({ ...previous, state: 'paused', isPlaying: false }));
        }
        if (releaseOnBackground) {
          release();
        }
        void audioService.setAudioActive(false);
        return;
      }

      if (next === 'active') {
        void audioService.setAudioActive(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [releaseOnBackground, release]);

  // Position/duration polling. expo-audio exposes imperative getters, so the
  // hook samples them instead of relying on an event stream.
  useEffect(() => {
    if (snapshot.state !== 'playing' && snapshot.state !== 'loading') {
      return;
    }
    const timer = setInterval(() => {
      const handle = handleRef.current;
      if (!handle) {
        return;
      }
      setSnapshot((previous) => ({
        ...previous,
        currentTimeSeconds: handle.currentTime,
        durationSeconds: handle.duration,
        isPlaying: handle.isPlaying,
        isBuffering: handle.isBuffering,
        state: handle.isPlaying ? 'playing' : previous.state === 'loading' ? 'loading' : 'paused',
      }));
    }, updateIntervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [snapshot.state, updateIntervalMs]);

  const load = useCallback(
    async (source: AudioSourceInput) => {
      const uri = describeAudioSource(source);
      if (source === null) {
        release();
        return;
      }

      try {
        setSnapshot((previous) => ({
          ...previous,
          state: 'loading',
          error: null,
          sourceUri: uri,
        }));

        // Never leak the previous player.
        handleRef.current?.release();

        await audioService.configurePlaybackMode();
        const handle = audioService.createPlayer(source);
        handleRef.current = handle;

        setSnapshot({
          state: 'playing',
          currentTimeSeconds: 0,
          durationSeconds: handle.duration,
          isPlaying: true,
          isBuffering: handle.isBuffering,
          error: null,
          sourceUri: uri,
        });

        handle.play();
      } catch (error) {
        log.warn('playback load failed', { error: String(error) });
        handleRef.current?.release();
        handleRef.current = null;
        setSnapshot({
          ...IDLE_PLAYBACK_SNAPSHOT,
          state: 'error',
          sourceUri: uri,
          error: error instanceof Error ? error.message : '音频加载失败。',
        });
      }
    },
    [release],
  );

  const play = useCallback(() => {
    const handle = handleRef.current;
    if (!handle) {
      return;
    }
    handle.play();
    setPauseOnBackground(false);
    setSnapshot((previous) => ({ ...previous, state: 'playing', isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    const handle = handleRef.current;
    if (!handle) {
      return;
    }
    handle.pause();
    setSnapshot((previous) => ({ ...previous, state: 'paused', isPlaying: false }));
  }, []);

  const resume = play;

  const seek = useCallback(async (seconds: number) => {
    const handle = handleRef.current;
    if (!handle) {
      return;
    }
    await handle.seek(seconds);
    setSnapshot((previous) => ({ ...previous, currentTimeSeconds: Math.max(0, seconds) }));
  }, []);

  const stop = useCallback(() => {
    const handle = handleRef.current;
    if (!handle) {
      return;
    }
    handle.stop();
    setSnapshot((previous) => ({
      ...previous,
      state: 'stopped',
      isPlaying: false,
      currentTimeSeconds: 0,
    }));
  }, []);

  return {
    ...snapshot,
    load,
    play,
    pause,
    resume,
    seek,
    stop,
    release,
    pauseOnBackground,
  };
}
