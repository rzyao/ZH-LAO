import { httpClient } from '../../../api/client/httpClient';

export interface PublishedCharacter {
  id: string;
  unicodeChar: string;
  classification: 'consonant' | 'vowel' | 'tone_mark' | 'other';
  subtype: string;
  ipaPhonetic: string;
  name: string;
  sortOrder: number;
  noAudio: boolean;
  audioUrl: string | null;
}

export const alphabetApi = {
  async getPublishedLetters(classification?: string): Promise<PublishedCharacter[]> {
    const res = await httpClient.get<{ items: PublishedCharacter[]; total: number }>(
      '/api/v1/content/letters',
      {
        query: classification ? { classification } : undefined,
      }
    );
    return res.data.items;
  },
};
