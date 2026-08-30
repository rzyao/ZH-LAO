// Global test setup for jest-expo.
// Native modules without a JS-safe default are mocked here once.

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
}));

jest.mock('expo-file-system', () => {
  const value = {
    documentDirectory: 'file:///docs/',
    cacheDirectory: 'file:///cache/',
    Directory: class Directory {
      constructor(uri) {
        this.uri = uri;
      }
    },
    File: class File {
      constructor(uri) {
        this.uri = uri;
        this.exists = false;
      }
    },
    Paths: { cache: { uri: 'file:///cache/' }, document: { uri: 'file:///docs/' } },
    FileInfo: class {},
  };
  return value;
});

jest.mock('expo-audio', () => {
  const player = () => ({
    uri: null,
    playing: false,
    paused: false,
    loaded: false,
    isLoaded: false,
    duration: 0,
    currentTime: 0,
    isBuffering: false,
    loop: false,
    shouldCorrectPitch: true,
    volume: 1,
    rate: 1,
    pan: 0,
    replace: jest.fn(),
    load: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    remove: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  });
  return {
    createAudioPlayer: jest.fn(() => player()),
    useAudioPlayer: jest.fn(() => player()),
    useAudioPlayerStatus: jest.fn(() => ({ playing: false, isLoaded: false, duration: 0, currentTime: 0 })),
    setAudioModeAsync: jest.fn(async () => undefined),
    RecordingPresets: { HIGH_QUALITY: {}, LOW_QUALITY: {} },
    useAudioRecorder: jest.fn(() => ({
      prepare: jest.fn(),
      record: jest.fn(),
      stop: jest.fn(),
      release: jest.fn(),
      uri: null,
      isRecording: false,
      durationMs: 0,
      canRecord: false,
    })),
    useAudioRecorderState: jest.fn(() => ({ isRecording: false, durationMs: 0, canRecord: false })),
    requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: false })),
    getRecordingPermissionsAsync: jest.fn(async () => ({ granted: false })),
    isRecordingAvailableAsync: jest.fn(async () => false),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native');
  const mockView = (props) => require('react').createElement(RN.View, props, props.children);
  const inset = { top: 47, right: 0, bottom: 34, left: 0 };
  return {
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: mockView,
    SafeAreaProviderCompat: { SafeAreaProvider: ({ children }) => children },
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: inset,
    },
  };
});

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
