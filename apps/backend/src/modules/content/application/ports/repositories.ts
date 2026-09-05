import type { LaoCharacter } from '../../domain/lao-character.js';
import type { LaoCharacterRevision } from '../../domain/lao-character-revision.js';
export * from './structured-content-repository.js';
export * from './lo-letter-admin-repository.js';
export * from './curriculum-repository.js';

export interface PublishedCharacterView {
  id: string;
  unicodeChar: string;
  classification: string;
  subtype: string;
  ipaPhonetic: string;
  name: string;
  sortOrder: number;
  noAudio: boolean;
  audioUrl: string | null;
}

export interface ManagedCharacterView {
  id: string;
  unicodeChar: string;
  classification: string;
  subtype: string;
  ipaPhonetic: string;
  name: string;
  sortOrder: number;
  noAudio: boolean;
  status: string;
  publishedRevisionId: string | null;
  workingRevisionId: string | null;
}

export interface ContentRepository {
  findCharacterById(id: string): Promise<LaoCharacter | null>;
  findCharacterByUnicode(unicodeChar: string): Promise<LaoCharacter | null>;
  findRevisionById(revisionId: string): Promise<LaoCharacterRevision | null>;
  findActiveWorkingRevision(characterId: string): Promise<LaoCharacterRevision | null>;
  findPublishedRevision(characterId: string): Promise<LaoCharacterRevision | null>;

  saveCharacterAndRevision(character: LaoCharacter, revision: LaoCharacterRevision): Promise<void>;
  saveRevision(revision: LaoCharacterRevision): Promise<void>;

  publishRevisionAtomic(
    characterId: string,
    targetRevision: LaoCharacterRevision,
    previousPublishedRevision: LaoCharacterRevision | null
  ): Promise<void>;

  listPublishedCharacters(classification?: string): Promise<PublishedCharacterView[]>;
  listManagedCharacters(classification?: string): Promise<ManagedCharacterView[]>;
}
