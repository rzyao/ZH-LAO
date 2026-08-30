/**
 * Audio foundation public surface.
 *
 * Screens import from here only — never from `expo-audio` directly.
 */

export { audioService, readRecorderState } from './audioService';
export type { PlaybackHandle } from './audioService';

export { useAudioPlayback } from './useAudioPlayback';
export type { UseAudioPlaybackResult, UseAudioPlaybackOptions } from './useAudioPlayback';

export { useAudioRecording } from './useAudioRecording';
export type { UseAudioRecordingResult } from './useAudioRecording';

export {
  AudioFoundationError,
  IDLE_PLAYBACK_SNAPSHOT,
  IDLE_RECORDING_SNAPSHOT,
  describeAudioSource,
} from './types';
export type {
  AudioPermissionState,
  AudioPlaybackSnapshot,
  AudioPlaybackState,
  AudioRecordingSnapshot,
  AudioRecordingState,
  AudioSourceInput,
} from './types';
