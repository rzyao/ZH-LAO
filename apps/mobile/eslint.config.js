const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expo,
  {
    ignores: [
      'node_modules/**',
      'dist-web/**',
      'dist-android/**',
      'android/**',
      'ios/**',
      '.expo/**',
      'coverage/**',
      'babel.config.js',
      'metro.config.js',
      'tailwind.config.js',
      'scripts/**',
    ],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['axios'],
              message:
                'Screens and features must not import axios directly. Use the V2 HTTP client in src/api/client.',
            },
            {
              group: ['expo-av', 'expo-av/*'],
              message: 'expo-av is forbidden in V2. Use expo-audio via src/audio.',
            },
            {
              group: ['react-native-mmkv', 'react-native-mmkv/*'],
              message: 'MMKV is not part of the V2 stack. Use src/storage.',
            },
            {
              group: ['expo-sqlite', 'expo-sqlite/*'],
              message: 'SQLite / offline-first is out of Foundation scope.',
            },
            {
              group: ['expo-router', 'expo-router/*'],
              message: 'Expo Router is forbidden. V2 uses React Navigation 7.',
            },
            {
              group: ['zustand', 'zustand/*'],
              message: 'Zustand is not included by default in the frozen stack.',
            },
          ],
        },
      ],
    },
  },
  {
    // `src/api/client` is the ONLY place allowed to own the axios transport.
    files: ['src/api/client/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['expo-av', 'expo-av/*'],
              message: 'expo-av is forbidden in V2. Use expo-audio via src/audio.',
            },
            {
              group: ['expo-sqlite', 'expo-sqlite/*'],
              message: 'SQLite / offline-first is out of Foundation scope.',
            },
            {
              group: ['expo-router', 'expo-router/*'],
              message: 'Expo Router is forbidden. V2 uses React Navigation 7.',
            },
          ],
        },
      ],
      'import/no-named-as-default-member': 'off',
    },
  },
]);
