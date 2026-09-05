import { createHash } from 'node:crypto';
import { z } from 'zod';

export const LaoLetterTypeSchema = z.enum(['consonant', 'vowel', 'tone_mark', 'other']);
export const LaoLetterContentStatusSchema = z.enum(['active', 'disabled', 'archived']);
export const LaoLetterRevisionStatusFilterSchema = z.enum([
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'none',
]);
export const LaoLetterSortSchema = z.enum([
  'sort_order',
  'character',
  'name',
  'romanization',
  'updated_at',
]);
export const LaoLetterSortOrderSchema = z.enum(['asc', 'desc']);

const LaoLetterQueryInputSchema = z.object({
  q: z.string().optional(),
  letterType: z.array(LaoLetterTypeSchema).optional(),
  letterClass: z.array(z.string()).optional(),
  contentStatus: z.array(LaoLetterContentStatusSchema).optional(),
  revisionStatus: z.array(LaoLetterRevisionStatusFilterSchema).optional(),
  sort: LaoLetterSortSchema.optional(),
  order: LaoLetterSortOrderSchema.optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().min(1).max(500).optional(),
}).strict();

export type LaoLetterType = z.infer<typeof LaoLetterTypeSchema>;
export type LaoLetterContentStatus = z.infer<typeof LaoLetterContentStatusSchema>;
export type LaoLetterRevisionStatusFilter = z.infer<typeof LaoLetterRevisionStatusFilterSchema>;
export type LaoLetterSort = z.infer<typeof LaoLetterSortSchema>;
export type LaoLetterSortOrder = z.infer<typeof LaoLetterSortOrderSchema>;
export type LaoLetterQueryInput = z.input<typeof LaoLetterQueryInputSchema>;

export type NormalizedLaoLetterQuery = Readonly<{
  q?: string;
  letterType: readonly LaoLetterType[];
  letterClass: readonly string[];
  contentStatus: readonly LaoLetterContentStatus[];
  revisionStatus: readonly LaoLetterRevisionStatusFilter[];
  sort: LaoLetterSort;
  order: LaoLetterSortOrder;
}>;

function sortedUnique<Value extends string>(values: readonly Value[]): Value[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, 'en'));
}

function normalizeText(value: string): string {
  return value.normalize('NFC').trim();
}

export function normalizeLaoLetterQuery(input: LaoLetterQueryInput): NormalizedLaoLetterQuery {
  const parsed = LaoLetterQueryInputSchema.parse(input);
  const q = parsed.q === undefined ? undefined : normalizeText(parsed.q);
  if (q !== undefined && q.length > 128) {
    throw new TypeError('Lao-letter query q must be at most 128 characters');
  }
  const letterClass = sortedUnique((parsed.letterClass ?? []).map(normalizeText));
  if (letterClass.some((value) => value.length === 0)) {
    throw new TypeError('Lao-letter class filters must not be blank');
  }

  return {
    ...(q ? { q } : {}),
    letterType: sortedUnique(parsed.letterType ?? []),
    letterClass,
    contentStatus: sortedUnique(parsed.contentStatus ?? []),
    revisionStatus: sortedUnique(parsed.revisionStatus ?? []),
    sort: parsed.sort ?? 'sort_order',
    order: parsed.order ?? 'asc',
  };
}

function selectionPayload(
  query: NormalizedLaoLetterQuery,
  sortedContentIds: readonly string[],
): string {
  return [
    'zh-lao:lo-letter-selection:v1',
    `q=${query.q ?? ''}`,
    `letter_type=${query.letterType.join(',')}`,
    `letter_class=${query.letterClass.join(',')}`,
    `content_status=${query.contentStatus.join(',')}`,
    `revision_status=${query.revisionStatus.join(',')}`,
    `sort=${query.sort}`,
    `order=${query.order}`,
    'content_ids:',
    ...sortedContentIds,
  ].join('\n');
}

export function createLaoLetterSelectionHash(
  query: NormalizedLaoLetterQuery,
  contentIds: readonly string[],
): string {
  const sortedContentIds = z.array(z.uuid()).parse(contentIds)
    .map((value) => value.toLowerCase())
    .sort((left, right) => left.localeCompare(right, 'en'));
  if (new Set(sortedContentIds).size !== sortedContentIds.length) {
    throw new TypeError('Lao-letter selection contains duplicate Content UUIDs');
  }
  return createHash('sha256')
    .update(selectionPayload(query, sortedContentIds), 'utf8')
    .digest('hex');
}
