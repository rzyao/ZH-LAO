import { httpClient } from '../../../api/client/httpClient';

export interface PublishedCharacter {
  id: string;
  unicodeChar: string;
  classification: 'consonant' | 'vowel' | 'symbol';
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
        params: classification ? { classification } : undefined,
      }
    );
    return res.data.items;
  },
};
