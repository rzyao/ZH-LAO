import { apiClient } from '@/api/client';

export type LaoLetterClassification = 'consonant' | 'vowel' | 'tone_mark' | 'other';

export interface CharacterItem {
  id: string;
  unicodeChar: string;
  classification: LaoLetterClassification;
  subtype: string;
  ipaPhonetic: string;
  description?: string;
  name?: string;
  sortOrder: number;
  noAudio: boolean;
  status?: string;
  publishedRevisionId?: string | null;
  workingRevisionId?: string | null;
  audioUrl?: string | null;
}

export interface CreateCharacterInput {
  unicodeChar: string;
  classification: LaoLetterClassification;
  subtype: string;
  ipaPhonetic: string;
  description: string;
  sortOrder: number;
}

export interface CharacterListResponse {
  items: CharacterItem[];
}

export const alphabetAdminApi = {
  async listCharacters() {
    const response = await apiClient.get<CharacterListResponse>('/api/v1/admin/content/letters');
    return response.data;
  },

  async createCharacter(input: CreateCharacterInput) {
    const response = await apiClient.post('/api/v1/admin/content/letters', {
      json: input,
    });
    return response.data;
  },

  async submitReview(characterId: string, revId: string) {
    const response = await apiClient.post(`/api/v1/admin/content/letters/${encodeURIComponent(characterId)}/revisions/${encodeURIComponent(revId)}/submit`);
    return response.data;
  },

  async reviewCharacter(characterId: string, revId: string, action: 'approve' | 'reject', remark?: string) {
    const response = await apiClient.post(`/api/v1/admin/content/letters/${encodeURIComponent(characterId)}/revisions/${encodeURIComponent(revId)}/review`, {
      json: { action, remark },
    });
    return response.data;
  },

  async publishCharacter(characterId: string, revId: string) {
    const response = await apiClient.post(`/api/v1/admin/content/letters/${encodeURIComponent(characterId)}/revisions/${encodeURIComponent(revId)}/publish`);
    return response.data;
  },
};
