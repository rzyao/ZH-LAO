import { z } from 'zod';

// This mirrors the frozen PostgreSQL `content.lo_letters.letter_type` constraint.
export const LaoCharacterClassificationSchema = z.enum(['consonant', 'vowel', 'tone_mark', 'other']);
export type LaoCharacterClassification = z.infer<typeof LaoCharacterClassificationSchema>;

export const ConsonantSubtypeSchema = z.enum(['cons_middle', 'cons_high', 'cons_low']);
export type ConsonantSubtype = z.infer<typeof ConsonantSubtypeSchema>;

export const VowelSubtypeSchema = z.enum(['vowel_short', 'vowel_long']);
export type VowelSubtype = z.infer<typeof VowelSubtypeSchema>;

export const ToneMarkSubtypeSchema = z.enum(['symbol_tone']);
export type ToneMarkSubtype = z.infer<typeof ToneMarkSubtypeSchema>;

export const OtherSubtypeSchema = z.enum([
  'symbol_ligature',
  'symbol_repeat',
  'symbol_special',
  'symbol_other',
]);
export type OtherSubtype = z.infer<typeof OtherSubtypeSchema>;

export const LaoCharacterSubtypeSchema = z.union([
  ConsonantSubtypeSchema,
  VowelSubtypeSchema,
  ToneMarkSubtypeSchema,
  OtherSubtypeSchema,
]);
export type LaoCharacterSubtype = z.infer<typeof LaoCharacterSubtypeSchema>;

export const OnlineStatusSchema = z.enum(['online', 'offline', 'deleted']);
export type OnlineStatus = z.infer<typeof OnlineStatusSchema>;

export interface LaoCharacterProps {
  id: string; // UUID
  unicodeChar: string;
  classification: LaoCharacterClassification;
  subtype: LaoCharacterSubtype;
  sortOrder: number;
  noAudio: boolean;
  onlineStatus: OnlineStatus;
  publishedRevisionId: string | null;
  workingRevisionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LaoCharacter {
  readonly id: string;
  readonly unicodeChar: string;
  readonly classification: LaoCharacterClassification;
  readonly subtype: LaoCharacterSubtype;
  readonly sortOrder: number;
  readonly noAudio: boolean;
  readonly onlineStatus: OnlineStatus;
  readonly publishedRevisionId: string | null;
  readonly workingRevisionId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: LaoCharacterProps) {
    this.id = props.id;
    this.unicodeChar = props.unicodeChar;
    this.classification = props.classification;
    this.subtype = props.subtype;
    this.sortOrder = props.sortOrder;
    this.noAudio = props.noAudio;
    this.onlineStatus = props.onlineStatus;
    this.publishedRevisionId = props.publishedRevisionId;
    this.workingRevisionId = props.workingRevisionId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

    this.validateInvariants();
  }

  private validateInvariants(): void {
    if (!this.unicodeChar || this.unicodeChar.trim().length === 0) {
      throw new Error('Unicode character cannot be empty');
    }

    if (this.sortOrder < 0) {
      throw new Error('Sort order must be non-negative');
    }

    // Validate classification & subtype compatibility
    if (this.classification === 'consonant') {
      ConsonantSubtypeSchema.parse(this.subtype);
      if (this.noAudio !== false) {
        throw new Error('Consonants must have noAudio = false');
      }
    } else if (this.classification === 'vowel') {
      VowelSubtypeSchema.parse(this.subtype);
      if (this.noAudio !== false) {
        throw new Error('Vowels must have noAudio = false');
      }
    } else if (this.classification === 'tone_mark') {
      ToneMarkSubtypeSchema.parse(this.subtype);
      if (this.noAudio !== true) {
        throw new Error('Tone marks must strictly enforce noAudio = true');
      }
    } else if (this.classification === 'other') {
      OtherSubtypeSchema.parse(this.subtype);
      if (this.noAudio !== true) {
        throw new Error('Other orthographic marks must strictly enforce noAudio = true');
      }
    }
  }

  isPublished(): boolean {
    return this.publishedRevisionId !== null && this.onlineStatus === 'online';
  }
}
