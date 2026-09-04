import { z } from 'zod';
import { computeAudioInputHash } from './audio-role-policy.js';
import type { LaoCharacterClassification, LaoCharacterSubtype } from './lao-character.js';

export const RevisionReviewStatusSchema = z.enum([
  'draft',
  'pending_review',
  'approved',
  'published',
  'rejected',
  'superseded',
]);
export type RevisionReviewStatus = z.infer<typeof RevisionReviewStatusSchema>;

export interface CharacterRevisionSnapshot {
  unicodeChar: string;
  classification: LaoCharacterClassification;
  subtype: LaoCharacterSubtype;
  ipaPhonetic: string;
  description: string;
  sortOrder: number;
  noAudio: boolean;
  audioInputHash: string;
}

export interface LaoCharacterRevisionProps {
  id: string; // UUID
  characterId: string; // UUID of LaoCharacter
  revisionNo: number;
  snapshot: CharacterRevisionSnapshot;
  reviewStatus: RevisionReviewStatus;
  reviewRemark?: string | null;
  createdByOperatorId?: string | null;
  reviewedByOperatorId?: string | null;
  reviewedAt?: Date | null;
  publishedAt?: Date | null;
  supersedesRevisionId?: string | null;
  lockVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export class LaoCharacterRevision {
  readonly id: string;
  readonly characterId: string;
  readonly revisionNo: number;
  private _snapshot: CharacterRevisionSnapshot;
  private _reviewStatus: RevisionReviewStatus;
  private _reviewRemark: string | null;
  private _reviewedByOperatorId: string | null;
  private _reviewedAt: Date | null;
  private _publishedAt: Date | null;
  private _supersedesRevisionId: string | null;
  private _lockVersion: number;
  readonly createdByOperatorId: string | null;
  readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: LaoCharacterRevisionProps) {
    this.id = props.id;
    this.characterId = props.characterId;
    this.revisionNo = props.revisionNo;
    this._snapshot = props.snapshot;
    this._reviewStatus = props.reviewStatus;
    this._reviewRemark = props.reviewRemark ?? null;
    this.createdByOperatorId = props.createdByOperatorId ?? null;
    this._reviewedByOperatorId = props.reviewedByOperatorId ?? null;
    this._reviewedAt = props.reviewedAt ?? null;
    this._publishedAt = props.publishedAt ?? null;
    this._supersedesRevisionId = props.supersedesRevisionId ?? null;
    this._lockVersion = props.lockVersion;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get snapshot(): CharacterRevisionSnapshot {
    return this._snapshot;
  }

  get reviewStatus(): RevisionReviewStatus {
    return this._reviewStatus;
  }

  get reviewRemark(): string | null {
    return this._reviewRemark;
  }

  get reviewedByOperatorId(): string | null {
    return this._reviewedByOperatorId;
  }

  get reviewedAt(): Date | null {
    return this._reviewedAt;
  }

  get publishedAt(): Date | null {
    return this._publishedAt;
  }

  get lockVersion(): number {
    return this._lockVersion;
  }

  get supersedesRevisionId(): string | null {
    return this._supersedesRevisionId;
  }

  // --- State Machine Transitions ---

  submitForReview(): void {
    if (this._reviewStatus !== 'draft') {
      throw new Error(`Cannot submit revision for review from status: ${this._reviewStatus}`);
    }
    this._reviewStatus = 'pending_review';
    this._lockVersion += 1;
    this._updatedAt = new Date();
  }

  approve(reviewerOperatorId: string): void {
    if (this._reviewStatus !== 'pending_review') {
      throw new Error(`Cannot approve revision from status: ${this._reviewStatus}`);
    }
    this._reviewStatus = 'approved';
    this._reviewedByOperatorId = reviewerOperatorId;
    this._reviewedAt = new Date();
    this._lockVersion += 1;
    this._updatedAt = new Date();
  }

  reject(reviewerOperatorId: string, remark: string): void {
    if (this._reviewStatus !== 'pending_review') {
      throw new Error(`Cannot reject revision from status: ${this._reviewStatus}`);
    }
    if (!remark || remark.trim().length === 0) {
      throw new Error('Rejection remark is required');
    }
    this._reviewStatus = 'rejected';
    this._reviewedByOperatorId = reviewerOperatorId;
    this._reviewRemark = remark;
    this._reviewedAt = new Date();
    this._lockVersion += 1;
    this._updatedAt = new Date();
  }

  reEdit(): void {
    if (this._reviewStatus !== 'rejected' && this._reviewStatus !== 'approved') {
      throw new Error(`Cannot re-edit revision from status: ${this._reviewStatus}`);
    }
    this._reviewStatus = 'draft';
    this._lockVersion += 1;
    this._updatedAt = new Date();
  }

  publish(publishedAt: Date = new Date()): void {
    if (this._reviewStatus !== 'approved') {
      throw new Error(`Cannot publish revision from status: ${this._reviewStatus}`);
    }
    this._reviewStatus = 'published';
    this._publishedAt = publishedAt;
    this._lockVersion += 1;
    this._updatedAt = new Date();
  }

  supersede(): void {
    if (this._reviewStatus !== 'published') {
      throw new Error(`Cannot supersede revision from status: ${this._reviewStatus}`);
    }
    this._reviewStatus = 'superseded';
    this._lockVersion += 1;
    this._updatedAt = new Date();
  }

  updateContent(
    updates: Partial<Omit<CharacterRevisionSnapshot, 'audioInputHash'>>,
    expectedLockVersion: number
  ): void {
    if (this._reviewStatus !== 'draft') {
      throw new Error('Only Draft revisions can be modified in-place');
    }
    if (this._lockVersion !== expectedLockVersion) {
      throw new Error('Optimistic lock conflict');
    }

    const newUnicode = updates.unicodeChar ?? this._snapshot.unicodeChar;
    const newIpa = updates.ipaPhonetic ?? this._snapshot.ipaPhonetic;
    const newHash = computeAudioInputHash(newUnicode, newIpa);

    this._snapshot = {
      ...this._snapshot,
      ...updates,
      audioInputHash: newHash,
    };
    this._lockVersion += 1;
    this._updatedAt = new Date();
  }
}
