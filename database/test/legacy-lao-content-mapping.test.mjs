import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeLaoText,
  selectCanonicalRecords,
  stableMigrationUuid,
} from '../scripts/legacy-lao-content-mapping.mjs';

test('TC002: normalizes text and retains the lowest source ID as canonical', () => {
  assert.equal(normalizeLaoText(' ຄຳ '), 'ຄຳ');

  const result = selectCanonicalRecords([
    { id: 42, text: 'ຄຳ', type: 'word' },
    { id: 7, text: ' ຄຳ ', type: 'word' },
  ]);

  assert.deepEqual(result.canonical, [{ id: 7, text: ' ຄຳ ', type: 'word' }]);
  assert.equal(result.isolated[0].canonicalSourceId, 7);
  assert.equal(stableMigrationUuid('word', 7), stableMigrationUuid('word', 7));
});
