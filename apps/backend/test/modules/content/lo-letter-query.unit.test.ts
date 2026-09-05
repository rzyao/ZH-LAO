import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createLaoLetterSelectionHash,
  normalizeLaoLetterQuery,
} from '../../../src/modules/content/domain/lo-letter-admin-query.js';

describe('Lao-letter admin query normalization', () => {
  it('normalizes search text to NFC, trims it, and applies stable defaults', () => {
    expect(normalizeLaoLetterQuery({ q: '  e\u0301  ' })).toEqual({
      q: 'é',
      letterType: [],
      letterClass: [],
      contentStatus: [],
      revisionStatus: [],
      sort: 'sort_order',
      order: 'asc',
    });
  });

  it('sorts and deduplicates every multi-value filter', () => {
    expect(normalizeLaoLetterQuery({
      letterType: ['vowel', 'consonant', 'vowel'],
      letterClass: ['cons_middle', 'cons_high', 'cons_middle'],
      contentStatus: ['disabled', 'active', 'disabled'],
      revisionStatus: ['rejected', 'none', 'draft', 'none'],
      sort: 'updated_at',
      order: 'desc',
    })).toEqual({
      letterType: ['consonant', 'vowel'],
      letterClass: ['cons_high', 'cons_middle'],
      contentStatus: ['active', 'disabled'],
      revisionStatus: ['draft', 'none', 'rejected'],
      sort: 'updated_at',
      order: 'desc',
    });
  });

  it('excludes pagination fields from the normalized selection descriptor', () => {
    const query = normalizeLaoLetterQuery({
      q: 'ກ',
      page: 4,
      pageSize: 200,
      sort: 'character',
      order: 'asc',
    });

    expect(query).not.toHaveProperty('page');
    expect(query).not.toHaveProperty('pageSize');
    expect(query).toMatchObject({ q: 'ກ', sort: 'character', order: 'asc' });
  });
});

describe('Lao-letter selection fingerprint (TC-002)', () => {
  const firstId = '00000000-0000-4000-8000-000000000001';
  const secondId = '00000000-0000-4000-8000-000000000002';

  it('uses a versioned fixed-field UTF-8 SHA-256 encoding and lowercase hex', () => {
    const query = normalizeLaoLetterQuery({
      q: ' ກ ',
      letterType: ['consonant'],
      letterClass: ['cons_middle'],
      contentStatus: ['active'],
      revisionStatus: ['pending_review'],
    });
    const expectedPayload = [
      'zh-lao:lo-letter-selection:v1',
      'q=ກ',
      'letter_type=consonant',
      'letter_class=cons_middle',
      'content_status=active',
      'revision_status=pending_review',
      'sort=sort_order',
      'order=asc',
      'content_ids:',
      firstId,
      secondId,
    ].join('\n');
    const expected = createHash('sha256').update(expectedPayload, 'utf8').digest('hex');

    expect(createLaoLetterSelectionHash(query, [secondId, firstId])).toBe(expected);
    expect(expected).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns the same hash for semantically identical filter and UUID order', () => {
    const firstQuery = normalizeLaoLetterQuery({
      letterType: ['vowel', 'consonant', 'vowel'],
      contentStatus: ['disabled', 'active'],
    });
    const secondQuery = normalizeLaoLetterQuery({
      contentStatus: ['active', 'disabled', 'active'],
      letterType: ['consonant', 'vowel'],
      page: 99,
      pageSize: 500,
    });

    expect(createLaoLetterSelectionHash(firstQuery, [secondId, firstId])).toBe(
      createLaoLetterSelectionHash(secondQuery, [firstId, secondId]),
    );
  });

  it('changes the hash when membership changes even if the query is unchanged', () => {
    const query = normalizeLaoLetterQuery({ letterType: ['consonant'] });

    expect(createLaoLetterSelectionHash(query, [firstId])).not.toBe(
      createLaoLetterSelectionHash(query, [firstId, secondId]),
    );
  });
});
