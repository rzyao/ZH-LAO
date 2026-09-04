import assert from 'node:assert/strict';
import test from 'node:test';
import { assignSortOrders, mapLegacyLaoLetter } from '../scripts/legacy-lao-letter-mapping.mjs';

test('maps legacy classifications to the frozen PostgreSQL values', () => {
  assert.deepEqual(mapLegacyLaoLetter({ id: 'a', lao: 'ກ', phonetic: 'k', description: 'ko', classification: '2', subtype: 'cons_middle' }), {
    sourceId: 'a', character: 'ກ', romanization: 'k', name: 'ko', letterType: 'consonant', letterClass: 'cons_middle',
  });
  assert.equal(mapLegacyLaoLetter({ id: 'b', lao: '່', phonetic: 'ignored', description: null, classification: '3', subtype: null }).letterType, 'tone_mark');
  assert.equal(mapLegacyLaoLetter({ id: 'c', lao: '໌', phonetic: '-', description: null, classification: '3', subtype: 'other' }).letterClass, 'symbol_other');
});

test('assigns stable, positive sort orders without relying on legacy IDs', () => {
  const rows = assignSortOrders([
    mapLegacyLaoLetter({ id: 'v', lao: 'າ', phonetic: 'a:', description: null, classification: '1', subtype: 'vowel_long' }),
    mapLegacyLaoLetter({ id: 'c', lao: 'ກ', phonetic: 'k', description: null, classification: '2', subtype: 'cons_middle' }),
  ]);
  assert.deepEqual(rows.map(({ letterType, sortOrder }) => [letterType, sortOrder]), [['consonant', 1], ['vowel', 2]]);
});
