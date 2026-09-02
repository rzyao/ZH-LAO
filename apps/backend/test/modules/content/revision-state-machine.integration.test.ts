import { describe, it, expect } from 'vitest';
import { LaoCharacterRevision } from '../../../src/modules/content/domain/lao-character-revision.js';

describe('LaoCharacterRevision State Machine', () => {
  const createDraftRevision = () =>
    new LaoCharacterRevision({
      id: '00000000-0000-0000-0000-000000000001',
      characterId: '00000000-0000-0000-0000-000000000002',
      revisionNo: 1,
      snapshot: {
        unicodeChar: 'ກ',
        classification: 'consonant',
        subtype: 'cons_middle',
        ipaPhonetic: '/k/',
        description: 'Ko',
        sortOrder: 1,
        noAudio: false,
        audioInputHash: 'hash-sample',
      },
      reviewStatus: 'draft',
      lockVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  it('should transition legally: Draft -> Pending Review -> Approved -> Published -> Superseded', () => {
    const rev = createDraftRevision();
    expect(rev.reviewStatus).toBe('draft');

    rev.submitForReview();
    expect(rev.reviewStatus).toBe('pending_review');

    rev.approve('reviewer-1');
    expect(rev.reviewStatus).toBe('approved');

    rev.publish();
    expect(rev.reviewStatus).toBe('published');
    expect(rev.publishedAt).not.toBeNull();

    rev.supersede();
    expect(rev.reviewStatus).toBe('superseded');
  });

  it('should support rejection and re-editing', () => {
    const rev = createDraftRevision();
    rev.submitForReview();
    rev.reject('reviewer-1', 'IPA is incorrect');

    expect(rev.reviewStatus).toBe('rejected');
    expect(rev.reviewRemark).toBe('IPA is incorrect');

    rev.reEdit();
    expect(rev.reviewStatus).toBe('draft');
  });

  it('should forbid illegal transitions', () => {
    const rev = createDraftRevision();
    expect(() => rev.publish()).toThrow('Cannot publish revision from status: draft');
    expect(() => rev.approve('reviewer-1')).toThrow('Cannot approve revision from status: draft');
  });
});
