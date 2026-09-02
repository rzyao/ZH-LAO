export interface CharacterItem {
  id: string;
  unicodeChar: string;
  classification: 'consonant' | 'vowel' | 'symbol';
  subtype: string;
  ipaPhonetic: string;
  description?: string;
  name?: string;
  sortOrder: number;
  noAudio: boolean;
  status?: string;
  audioUrl?: string | null;
}

export interface CreateCharacterInput {
  unicodeChar: string;
  classification: 'consonant' | 'vowel' | 'symbol';
  subtype: string;
  ipaPhonetic: string;
  description: string;
  sortOrder: number;
}

export const alphabetAdminApi = {
  async createCharacter(input: CreateCharacterInput) {
    const res = await fetch('/api/v1/admin/content/letters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async submitReview(characterId: string, revId: string) {
    const res = await fetch(`/api/v1/admin/content/letters/${characterId}/revisions/${revId}/submit`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async reviewCharacter(characterId: string, revId: string, action: 'approve' | 'reject', remark?: string) {
    const res = await fetch(`/api/v1/admin/content/letters/${characterId}/revisions/${revId}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, remark }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async publishCharacter(characterId: string, revId: string) {
    const res = await fetch(`/api/v1/admin/content/letters/${characterId}/revisions/${revId}/publish`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};
