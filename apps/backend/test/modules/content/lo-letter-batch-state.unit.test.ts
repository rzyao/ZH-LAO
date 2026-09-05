import { describe, expect, it } from 'vitest';
import {
  LO_LETTER_BATCH_ACTIONS,
  getLaoLetterBatchActionPolicy,
  normalizeLaoLetterBatchReason,
  transitionLaoLetterBatchItem,
  transitionLaoLetterBatchTask,
} from '../../../src/modules/content/domain/lo-letter-batch-task.js';

describe('Lao-letter batch action rules (TC-007)', () => {
  it('exposes exactly the five approved actions and their precise permissions', () => {
    expect(LO_LETTER_BATCH_ACTIONS).toEqual([
      'submit_review',
      'approve',
      'reject',
      'publish',
      'archive',
    ]);
    expect(Object.fromEntries(LO_LETTER_BATCH_ACTIONS.map((action) => [
      action,
      getLaoLetterBatchActionPolicy(action).permission,
    ]))).toEqual({
      submit_review: 'content.lo_letters.write',
      approve: 'content.lo_letters.review',
      reject: 'content.lo_letters.review',
      publish: 'content.lo_letters.publish',
      archive: 'content.lo_letters.write',
    });
  });

  it.each(['reject', 'archive'] as const)(
    'requires and trims a non-empty reason for %s',
    (action) => {
      expect(normalizeLaoLetterBatchReason(action, '  fixture reason  ')).toBe('fixture reason');
      expect(() => normalizeLaoLetterBatchReason(action, undefined)).toThrow(/reason/i);
      expect(() => normalizeLaoLetterBatchReason(action, '   ')).toThrow(/reason/i);
      expect(getLaoLetterBatchActionPolicy(action).requiresReason).toBe(true);
    },
  );

  it.each(['submit_review', 'approve', 'publish'] as const)(
    'forbids a reason for %s',
    (action) => {
      expect(normalizeLaoLetterBatchReason(action, undefined)).toBeNull();
      expect(() => normalizeLaoLetterBatchReason(action, 'not allowed')).toThrow(/reason/i);
      expect(getLaoLetterBatchActionPolicy(action).requiresReason).toBe(false);
    },
  );
});

describe('Lao-letter batch task lifecycle', () => {
  it('allows the queue, processing, and terminal paths', () => {
    expect(transitionLaoLetterBatchTask('queued', 'start')).toBe('running');
    expect(transitionLaoLetterBatchTask('queued', 'fail')).toBe('failed');
    expect(transitionLaoLetterBatchTask('running', 'complete')).toBe('completed');
    expect(transitionLaoLetterBatchTask('running', 'complete_with_issues')).toBe('completed_with_issues');
    expect(transitionLaoLetterBatchTask('running', 'fail')).toBe('failed');
  });

  it('allows retry only from an issue/failure state with failed items', () => {
    expect(transitionLaoLetterBatchTask('completed_with_issues', 'retry', {
      failedItemCount: 1,
    })).toBe('queued');
    expect(transitionLaoLetterBatchTask('failed', 'retry', {
      failedItemCount: 2,
    })).toBe('queued');
    expect(() => transitionLaoLetterBatchTask('completed_with_issues', 'retry', {
      failedItemCount: 0,
    })).toThrow(/retry/i);
    expect(() => transitionLaoLetterBatchTask('completed', 'retry', {
      failedItemCount: 1,
    })).toThrow(/transition|retry/i);
  });

  it('rejects illegal and post-terminal task transitions', () => {
    expect(() => transitionLaoLetterBatchTask('queued', 'complete')).toThrow(/transition/i);
    expect(() => transitionLaoLetterBatchTask('running', 'retry', {
      failedItemCount: 1,
    })).toThrow(/transition|retry/i);
    expect(() => transitionLaoLetterBatchTask('completed', 'start')).toThrow(/transition/i);
  });
});

describe('Lao-letter batch item lifecycle', () => {
  it('allows claim and each independent result', () => {
    expect(transitionLaoLetterBatchItem('queued', 'start')).toBe('running');
    expect(transitionLaoLetterBatchItem('running', 'succeed')).toBe('succeeded');
    expect(transitionLaoLetterBatchItem('running', 'fail')).toBe('failed');
    expect(transitionLaoLetterBatchItem('running', 'skip')).toBe('skipped');
  });

  it('requeues only failed items for an explicit retry', () => {
    expect(transitionLaoLetterBatchItem('failed', 'retry')).toBe('queued');
    expect(() => transitionLaoLetterBatchItem('succeeded', 'retry')).toThrow(/transition|retry/i);
    expect(() => transitionLaoLetterBatchItem('skipped', 'retry')).toThrow(/transition|retry/i);
    expect(() => transitionLaoLetterBatchItem('queued', 'retry')).toThrow(/transition|retry/i);
  });

  it('rejects result transitions before an item is running', () => {
    expect(() => transitionLaoLetterBatchItem('queued', 'succeed')).toThrow(/transition/i);
    expect(() => transitionLaoLetterBatchItem('queued', 'fail')).toThrow(/transition/i);
    expect(() => transitionLaoLetterBatchItem('queued', 'skip')).toThrow(/transition/i);
  });
});
