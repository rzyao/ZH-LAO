import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseR2PublicUrl,
  validateR2Config,
} from '../scripts/legacy-lao-content-r2.mjs';

test('TC003: maps a confirmed public R2 URL to provider, bucket, and key', () => {
  const config = validateR2Config({
    STORAGE_DRIVER: 'r2',
    R2_ACCOUNT_ID: 'account',
    R2_ACCESS_KEY_ID: 'key-id',
    R2_SECRET_ACCESS_KEY: 'secret',
    R2_BUCKET_NAME: 'zh-lao',
    R2_PUBLIC_DOMAIN: 'https://zh-lao-audio.example.test',
    R2_ENDPOINT: 'https://account.r2.cloudflarestorage.com',
  });

  assert.deepEqual(
    parseR2PublicUrl('https://zh-lao-audio.example.test/uploads/word.mp3', config),
    { storageProvider: 'r2', storageBucket: 'zh-lao', storageKey: 'uploads/word.mp3' },
  );
  assert.throws(() => parseR2PublicUrl('https://elsewhere.example.test/a.mp3', config));
});
