/**
 * Audio foundation types.
 *
 * The whole app talks to `expo-audio` through `src/audio` only. Screens never
 * import the audio engine directly.
 */

export type AudioPlaybackState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'error';

export interface AudioPlaybackSnapshot {
  readonly state: AudioPlaybackState;
  readonly currentTimeSeconds: number;
  readonly durationSeconds: number;
  readonly isPlaying: boolean;
  readonly isBuffering: boolean;
  readonly error: string | null;
  /** Last source that was loaded; `null` before the first `load()`. */
  readonly sourceUri: string | null;
}

export const IDLE_PLAYBACK_SNAPSHOT: AudioPlaybackSnapshot = {
  state: 'idle',
  currentTimeSeconds: 0,
  durationSeconds: 0,
  isPlaying: false,
  isBuffering: false,
  error: null,
  sourceUri: null,
};

export type AudioPermissionState = 'undetermined' | 'granted' | 'denied' | 'unsupported';

export type AudioRecordingState =
  | 'idle'
  | 'preparing'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'error';

export interface AudioRecordingSnapshot {
  readonly state: AudioRecordingState;
  readonly permission: AudioPermissionState;
  readonly durationMillis: number;
  /** dB level when metering is available, otherwise `null`. */
  readonly metering: number | null;
  /** File URI produced by the last completed recording. */
  readonly uri: string | null;
  readonly error: string | null;
}

export const IDLE_RECORDING_SNAPSHOT: AudioRecordingSnapshot = {
  state: 'idle',
  permission: 'undetermined',
  durationMillis: 0,
  metering: null,
  uri: null,
  error: null,
};

export type AudioSourceInput = string | number | { uri: string } | null;

/** Normalises the several shapes expo-audio accepts into a display string. */
export function describeAudioSource(source: AudioSourceInput): string | null {
  if (source === null) {
    return null;
  }
  if (typeof source === 'number') {
    return `asset:${source}`;
  }
  if (typeof source === 'string') {
    return source;
  }
  if (typeof source === 'object' && 'uri' in source) {
    return source.uri;
  }
  return null;
}

export class AudioFoundationError extends Error {
  constructor(
    message: string,
    override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AudioFoundationError';
  }
}
