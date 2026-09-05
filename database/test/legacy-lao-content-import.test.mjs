import test from 'node:test';
import assert from 'node:assert/strict';

import {
  requireLegacyLaoContentConfig,
  buildImportPlan,
} from '../scripts/import-legacy-lao-content.mjs';

test('TC001: requires explicit source and target configuration', () => {
  assert.throws(() => requireLegacyLaoContentConfig({}), /DATABASE_URL/);
});

test('TC004: creates draft records, preserves ordered relations, and isolates missing relations', () => {
  const plan = buildImportPlan({
    syllables: [{ id: 1, text: 'ກາ' }],
    words: [{ id: 2, text: 'ຄຳ', syllableIds: [1] }],
    sentences: [{ id: 3, text: 'ປະໂຫຍກ', wordIds: [2, 999] }],
  });

  assert.equal(plan.contents.every((entry) => entry.status === 'draft'), true);
  assert.deepEqual(plan.relations.sentenceWords, [{ sentenceSourceId: 3, wordSourceId: 2, position: 0 }]);
  assert.equal(plan.isolation.find((entry) => entry.reason === 'missing_sentence_word').sourceChildId, 999);
});
