import { describe, expect, it } from 'vitest';
import { parseStructuredContentSnapshot } from '../../../src/modules/content/domain/structured-content.js';

describe('Word dictionary revision snapshot', () => {
  it('keeps dictionary facts inside the parent Word snapshot without child IDs', () => {
    const snapshot = parseStructuredContentSnapshot('zh_word', {
      fields: { simplified: '你好' },
      composition: [],
      dictionary: {
        meanings: [{ language: 'lo', definition: 'ສະບາຍດີ', senseOrder: 1 }],
        examples: [{ sentenceContentId: '00000000-0000-4000-8000-000000000010', sortOrder: 1 }],
        equivalents: [{ targetContentId: '00000000-0000-4000-8000-000000000011', relationType: 'translation' }],
        relations: [{ targetContentId: '00000000-0000-4000-8000-000000000012', relationType: 'synonym', sortOrder: 1 }],
        tags: [{ code: 'greeting', name: '问候' }],
      },
    });

    expect(snapshot.dictionary).toEqual({
      meanings: [{ language: 'lo', definition: 'ສະບາຍດີ', senseOrder: 1 }],
      examples: [{ sentenceContentId: '00000000-0000-4000-8000-000000000010', sortOrder: 1 }],
      equivalents: [{ targetContentId: '00000000-0000-4000-8000-000000000011', relationType: 'translation' }],
      relations: [{ targetContentId: '00000000-0000-4000-8000-000000000012', relationType: 'synonym', sortOrder: 1 }],
      tags: [{ code: 'greeting', name: '问候' }],
    });
    expect(JSON.stringify(snapshot.dictionary)).not.toMatch(/"id"\s*:/);
  });

  it('rejects duplicate aggregate facts before a draft is written', () => {
    expect(() => parseStructuredContentSnapshot('lo_word', {
      fields: { text: 'ສະບາຍດີ' },
      composition: [],
      dictionary: {
        meanings: [
          { language: 'zh', definition: '你好', senseOrder: 1 },
          { language: 'zh', definition: '您好', senseOrder: 1 },
        ],
        examples: [], equivalents: [], relations: [], tags: [],
      },
    })).toThrow(/重复/);
  });

  it('rejects duplicate examples without assigning an external child identity', () => {
    expect(() => parseStructuredContentSnapshot('zh_word', {
      fields: { simplified: '你好' }, composition: [],
      dictionary: {
        meanings: [],
        examples: [
          { sentenceContentId: '00000000-0000-4000-8000-000000000051', sortOrder: 1 },
          { sentenceContentId: '00000000-0000-4000-8000-000000000051', sortOrder: 2 },
        ],
        equivalents: [], relations: [], tags: [],
      },
    })).toThrow(/重复例句/);
  });

  it('rejects duplicate equivalents and relations by their parent-owned semantic keys', () => {
    const base = { fields: { simplified: '你好' }, composition: [], dictionary: { meanings: [], examples: [], tags: [] } };
    expect(() => parseStructuredContentSnapshot('zh_word', {
      ...base, dictionary: { ...base.dictionary, equivalents: [
        { targetContentId: '00000000-0000-4000-8000-000000000061', relationType: 'translation' },
        { targetContentId: '00000000-0000-4000-8000-000000000061', relationType: 'translation' },
      ], relations: [] },
    })).toThrow(/重复对应关系/);
    expect(() => parseStructuredContentSnapshot('zh_word', {
      ...base, dictionary: { ...base.dictionary, equivalents: [], relations: [
        { targetContentId: '00000000-0000-4000-8000-000000000062', relationType: 'related', sortOrder: 1 },
        { targetContentId: '00000000-0000-4000-8000-000000000062', relationType: 'related', sortOrder: 2 },
      ] },
    })).toThrow(/重复同语言关系/);
  });
});
