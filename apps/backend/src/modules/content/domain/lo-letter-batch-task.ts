export const LO_LETTER_BATCH_ACTIONS = [
  'submit_review',
  'approve',
  'reject',
  'publish',
  'archive',
] as const;

export type LaoLetterBatchAction = typeof LO_LETTER_BATCH_ACTIONS[number];
export type LaoLetterBatchPermission =
  | 'content.lo_letters.write'
  | 'content.lo_letters.review'
  | 'content.lo_letters.publish';

export type LaoLetterBatchActionPolicy = Readonly<{
  permission: LaoLetterBatchPermission;
  requiresReason: boolean;
}>;

const actionPolicies: Readonly<Record<LaoLetterBatchAction, LaoLetterBatchActionPolicy>> = {
  submit_review: { permission: 'content.lo_letters.write', requiresReason: false },
  approve: { permission: 'content.lo_letters.review', requiresReason: false },
  reject: { permission: 'content.lo_letters.review', requiresReason: true },
  publish: { permission: 'content.lo_letters.publish', requiresReason: false },
  archive: { permission: 'content.lo_letters.write', requiresReason: true },
};

export function getLaoLetterBatchActionPolicy(
  action: LaoLetterBatchAction,
): LaoLetterBatchActionPolicy {
  return actionPolicies[action];
}

export function normalizeLaoLetterBatchReason(
  action: LaoLetterBatchAction,
  reason: string | undefined,
): string | null {
  const policy = getLaoLetterBatchActionPolicy(action);
  const normalized = reason?.trim();
  if (policy.requiresReason) {
    if (!normalized) throw new TypeError(`Batch action ${action} requires a non-empty reason`);
    return normalized;
  }
  if (reason !== undefined) {
    throw new TypeError(`Batch action ${action} does not accept a reason`);
  }
  return null;
}

export type LaoLetterBatchTaskStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'completed_with_issues'
  | 'failed';
export type LaoLetterBatchTaskEvent =
  | 'start'
  | 'complete'
  | 'complete_with_issues'
  | 'fail'
  | 'retry';

export function transitionLaoLetterBatchTask(
  status: LaoLetterBatchTaskStatus,
  event: LaoLetterBatchTaskEvent,
  context: Readonly<{ failedItemCount?: number }> = {},
): LaoLetterBatchTaskStatus {
  if (event === 'retry') {
    if ((status !== 'completed_with_issues' && status !== 'failed')
      || !Number.isSafeInteger(context.failedItemCount)
      || (context.failedItemCount ?? 0) < 1) {
      throw new Error(`Invalid batch task retry transition from ${status}`);
    }
    return 'queued';
  }
  if (event === 'start' && status === 'queued') return 'running';
  if (event === 'fail' && (status === 'queued' || status === 'running')) return 'failed';
  if (status === 'running' && event === 'complete') return 'completed';
  if (status === 'running' && event === 'complete_with_issues') return 'completed_with_issues';
  throw new Error(`Invalid batch task transition: ${status} -> ${event}`);
}

export type LaoLetterBatchItemStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'skipped';
export type LaoLetterBatchItemEvent = 'start' | 'succeed' | 'fail' | 'skip' | 'retry';

export function transitionLaoLetterBatchItem(
  status: LaoLetterBatchItemStatus,
  event: LaoLetterBatchItemEvent,
): LaoLetterBatchItemStatus {
  if (status === 'queued' && event === 'start') return 'running';
  if (status === 'running' && event === 'succeed') return 'succeeded';
  if (status === 'running' && event === 'fail') return 'failed';
  if (status === 'running' && event === 'skip') return 'skipped';
  if (status === 'failed' && event === 'retry') return 'queued';
  throw new Error(`Invalid batch item transition: ${status} -> ${event}`);
}
