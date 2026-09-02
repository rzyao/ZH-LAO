/**
 * AudioService — the single place that talks to `expo-audio`.
 *
 * ```text
 * Screen -> useAudioPlayback / useAudioRecording -> AudioService -> expo-audio
 * ```
 *
 * `expo-av` is forbidden; there is exactly one audio engine in the app.
 */

import {
  createAudioPlayer,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  setIsAudioActiveAsync,
} from 'expo-audio';
import type { AudioPlayer, RecorderState } from 'expo-audio';
import { Platform } from 'react-native';

import { createLogger } from '../utils/logger';

import {
  AudioFoundationError,
  describeAudioSource,
  type AudioPermissionState,
  type AudioSourceInput,
} from './types';

const log = createLogger('audio-service');

export interface PlaybackHandle {
  readonly id: string;
  play(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  seek(seconds: number): Promise<void>;
  replace(source: AudioSourceInput): void;
  release(): void;
  readonly isPlaying: boolean;
  readonly currentTime: number;
  readonly duration: number;
  readonly isBuffering: boolean;
  readonly isLoaded: boolean;
}

export const audioService = {
  isPlaybackSupported(): boolean {
    // expo-audio implements playback on Android, iOS and Web.
    return true;
  },

  isRecordingSupported(): boolean {
    // Web uses MediaRecorder; native uses the platform recorder.
    return Platform.OS === 'android' || Platform.OS === 'ios' || Platform.OS === 'web';
  },

  async configurePlaybackMode(): Promise<void> {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        allowsRecording: false,
      });
    } catch (error) {
      log.warn('failed to configure playback audio mode', { error: String(error) });
      throw new AudioFoundationError('无法配置音频播放模式。', error);
    }
  },

  async configureRecordingMode(): Promise<void> {
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    } catch (error) {
      log.warn('failed to configure recording audio mode', { error: String(error) });
      throw new AudioFoundationError('无法配置录音模式。', error);
    }
  },

  async setAudioActive(active: boolean): Promise<void> {
    try {
      await setIsAudioActiveAsync(active);
    } catch (error) {
      log.warn('failed to toggle audio subsystem', { active, error: String(error) });
    }
  },

  async getRecordingPermission(): Promise<AudioPermissionState> {
    if (!audioService.isRecordingSupported()) {
      return 'unsupported';
    }
    try {
      const response = await getRecordingPermissionsAsync();
      return response.granted ? 'granted' : 'denied';
    } catch (error) {
      log.warn('recording permission lookup failed', { error: String(error) });
      return 'undetermined';
    }
  },

  async requestRecordingPermission(): Promise<AudioPermissionState> {
    if (!audioService.isRecordingSupported()) {
      return 'unsupported';
    }
    try {
      const response = await requestRecordingPermissionsAsync();
      return response.granted ? 'granted' : 'denied';
    } catch (error) {
      log.warn('recording permission request failed', { error: String(error) });
      return 'denied';
    }
  },

  /**
   * Creates a player. The caller owns the handle and MUST call `release()`.
   * Hooks in this module do that automatically on unmount.
   */
  createPlayer(source: AudioSourceInput): PlaybackHandle {
    if (source === null) {
      throw new AudioFoundationError('Cannot create a player without an audio source.');
    }

    let player: AudioPlayer;
    try {
      player = createAudioPlayer(source as Parameters<typeof createAudioPlayer>[0], {
        updateInterval: 100,
      });
    } catch (error) {
      log.warn('player creation failed', { error: String(error) });
      throw new AudioFoundationError('无法创建音频播放器。', error);
    }

    let released = false;

    return {
      id: String(player.id),
      play: () => {
        guardNotReleased(released);
        player.play();
      },
      pause: () => {
        guardNotReleased(released);
        player.pause();
      },
      resume: () => {
        guardNotReleased(released);
        player.play();
      },
      stop: () => {
        guardNotReleased(released);
        player.pause();
        void player.seekTo(0);
      },
      seek: (seconds) => {
        guardNotReleased(released);
        return player.seekTo(Math.max(0, seconds));
      },
      replace: (next) => {
        guardNotReleased(released);
        if (next === null) {
          return;
        }
        player.replace(next as Parameters<AudioPlayer['replace']>[0]);
      },
      release: () => {
        if (released) {
          return;
        }
        released = true;
        try {
          player.remove();
        } catch (error) {
          log.warn('player release failed', { error: String(error) });
        }
      },
      get isPlaying() {
        return !released && player.playing;
      },
      get currentTime() {
        return released ? 0 : player.currentTime;
      },
      get duration() {
        return released ? 0 : player.duration;
      },
      get isBuffering() {
        return !released && player.isBuffering;
      },
      get isLoaded() {
        return !released && player.isLoaded;
      },
    };
  },
};

function guardNotReleased(released: boolean): void {
  if (released) {
    throw new AudioFoundationError('This audio player has already been released.');
  }
}

/** Reads a recorder state defensively (shapes differ slightly per platform). */
export function readRecorderState(state: RecorderState | null | undefined): {
  durationMillis: number;
  isRecording: boolean;
  metering: number | null;
  url: string | null;
} {
  if (!state) {
    return { durationMillis: 0, isRecording: false, metering: null, url: null };
  }
  return {
    durationMillis: typeof state.durationMillis === 'number' ? state.durationMillis : 0,
    isRecording: Boolean(state.isRecording),
    metering: typeof state.metering === 'number' ? state.metering : null,
    url: state.url ?? null,
  };
}

export { describeAudioSource };
