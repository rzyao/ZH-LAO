import { describe, it, expect } from 'vitest';
import { LaoCharacter } from '../../../src/modules/content/domain/lao-character.js';
import { computeAudioInputHash } from '../../../src/modules/content/domain/audio-role-policy.js';

describe('Unicode & Domain Invariants', () => {
  it('should create valid consonant character', () => {
    const char = new LaoCharacter({
      id: '00000000-0000-0000-0000-000000000001',
      unicodeChar: 'ກ',
      classification: 'consonant',
      subtype: 'cons_middle',
      sortOrder: 1,
      noAudio: false,
      onlineStatus: 'online',
      publishedRevisionId: null,
      workingRevisionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(char.unicodeChar).toBe('ກ');
    expect(char.noAudio).toBe(false);
  });

  it('should enforce noAudio = true for tone marks', () => {
    expect(() => {
      new LaoCharacter({
        id: '00000000-0000-0000-0000-000000000002',
        unicodeChar: '່',
        classification: 'tone_mark',
        subtype: 'symbol_tone',
        sortOrder: 1,
        noAudio: false, // Invalid
        onlineStatus: 'online',
        publishedRevisionId: null,
        workingRevisionId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrow('Tone marks must strictly enforce noAudio = true');
  });

  it('should compute consistent SHA-256 hash for audio input', () => {
    const hash1 = computeAudioInputHash('ກ', '/k/');
    const hash2 = computeAudioInputHash('ກ', '/k/');
    const hash3 = computeAudioInputHash('ກ', '/g/');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });
});
