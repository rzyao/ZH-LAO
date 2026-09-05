import { createHash } from 'node:crypto';

export function computeAudioInputHash(unicodeChar: string, ipaPhonetic: string): string {
  const normalizedInput = `${unicodeChar.trim()}:${ipaPhonetic.trim()}`;
  return createHash('sha256').update(normalizedInput, 'utf8').digest('hex');
}

export class AudioRolePolicy {
  static readonly ALLOWED_CONTENT_TYPES = [
    'lo_letter',
    'lo_syllable',
    'lo_word',
    'lo_sentence',
    'zh_pinyin_element',
    'zh_syllable',
  ] as const;

  static isAudioAllowed(contentType: string, noAudio: boolean): boolean {
    if (!this.ALLOWED_CONTENT_TYPES.includes(contentType as (typeof AudioRolePolicy.ALLOWED_CONTENT_TYPES)[number])) {
      return false;
    }
    return !noAudio;
  }

  static supportsRole(contentType: string, audioRole: string): boolean {
    if (!this.ALLOWED_CONTENT_TYPES.includes(contentType as (typeof AudioRolePolicy.ALLOWED_CONTENT_TYPES)[number])) return false;
    return contentType.startsWith('lo_')
      ? audioRole === 'pronunciation'
      : ['tone_1', 'tone_2', 'tone_3', 'tone_4'].includes(audioRole);
  }
}
