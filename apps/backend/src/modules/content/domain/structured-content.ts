import { z } from 'zod';
import {
  ContentRevisionStatusSchema,
  StructuredContentTypeSchema,
  getContentCategoryDefinition,
  validateRevisionTransition,
  type ContentLanguage,
  type ContentRevisionStatus,
  type StructuredContentType,
} from './language-structure.js';

const nullablePositiveInteger = z.number().int().positive().nullable().optional();
const nullableText = z.string().nullable().optional();

const fieldSchemas = {
  zh_pinyin_element: z.object({
    elementType: z.enum(['initial', 'final', 'tone_mark', 'separator', 'other']),
    value: z.string().min(1).max(16),
    displayForm: z.string().min(1).max(16),
    sortOrder: z.number().int().min(0).nullable().optional(),
  }).strict(),
  zh_syllable: z.object({
    baseForm: z.string().min(1).max(32),
    tone: z.number().int().min(1).max(5),
    displayForm: z.string().min(1).max(32),
  }).strict(),
  zh_hanzi: z.object({
    character: z.string().min(1).max(4),
    traditionalCharacter: z.string().max(4).nullable().optional(),
    strokeCount: nullablePositiveInteger,
    radical: z.string().max(8).nullable().optional(),
  }).strict(),
  zh_word: z.object({
    simplified: z.string().min(1).max(128),
    traditional: z.string().max(128).nullable().optional(),
    pinyinText: z.string().max(256).nullable().optional(),
    wordClass: z.string().max(32).nullable().optional(),
    difficultyLevel: nullablePositiveInteger,
  }).strict(),
  zh_sentence: z.object({
    text: z.string().min(1),
    pinyinText: nullableText,
    difficultyLevel: nullablePositiveInteger,
  }).strict(),
  lo_letter: z.object({
    character: z.string().min(1).max(16),
    letterType: z.enum(['consonant', 'vowel', 'tone_mark', 'other']),
    letterClass: z.string().max(16).nullable().optional(),
    name: z.string().max(64).nullable().optional(),
    romanization: z.string().max(64).nullable().optional(),
    sortOrder: z.number().int().min(0).nullable().optional(),
  }).strict(),
  lo_syllable: z.object({
    text: z.string().min(1).max(64),
    romanization: z.string().max(128).nullable().optional(),
    tone: z.number().int().nullable().optional(),
    pronunciationKey: z.string().max(128).nullable().optional(),
    difficultyLevel: nullablePositiveInteger,
  }).strict(),
  lo_word: z.object({
    text: z.string().min(1).max(256),
    romanization: z.string().max(256).nullable().optional(),
    wordClass: z.string().max(32).nullable().optional(),
    difficultyLevel: nullablePositiveInteger,
  }).strict(),
  lo_sentence: z.object({
    text: z.string().min(1),
    romanization: nullableText,
    difficultyLevel: nullablePositiveInteger,
  }).strict(),
} satisfies Record<StructuredContentType, z.ZodType<Record<string, unknown>>>;

export const SnapshotCompositionItemSchema = z.object({
  contentId: z.uuid(),
  position: z.number().int().positive(),
  role: z.string().max(16).nullable().optional(),
  surfaceForm: z.string().nullable().optional(),
}).strict();
export type SnapshotCompositionItem = z.infer<typeof SnapshotCompositionItemSchema>;

const DictionaryMeaningSchema = z.object({
  language: z.enum(['zh', 'lo']),
  wordClass: z.string().trim().min(1).max(32).optional(),
  definition: z.string().trim().min(1),
  senseOrder: z.number().int().positive(),
}).strict();

const DictionaryExampleSchema = z.object({
  sentenceContentId: z.uuid(),
  meaningLanguage: z.enum(['zh', 'lo']).optional(),
  meaningSenseOrder: z.number().int().positive().optional(),
  sortOrder: z.number().int().positive(),
}).strict().superRefine((value, context) => {
  const pointsToMeaning = value.meaningLanguage !== undefined || value.meaningSenseOrder !== undefined;
  if (pointsToMeaning && (value.meaningLanguage === undefined || value.meaningSenseOrder === undefined)) {
    context.addIssue({ code: 'custom', message: '例句释义引用必须同时提供语言和序号' });
  }
});

const DictionaryEquivalentSchema = z.object({
  targetContentId: z.uuid(),
  relationType: z.enum(['translation', 'equivalent', 'approximate']),
  confidence: z.number().min(0).max(100).optional(),
  isPrimary: z.boolean().optional(),
}).strict();

const DictionaryRelationSchema = z.object({
  targetContentId: z.uuid(),
  relationType: z.enum(['synonym', 'antonym', 'related', 'derived', 'variant']),
  sortOrder: z.number().int().positive(),
}).strict();

const DictionaryTagSchema = z.object({
  code: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(64),
}).strict();

function rejectDuplicates<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  label: string,
  context: z.RefinementCtx,
): void {
  const seen = new Set<string>();
  for (const item of items) {
    const key = keyOf(item);
    if (seen.has(key)) {
      context.addIssue({ code: 'custom', message: '存在重复' + label });
      return;
    }
    seen.add(key);
  }
}

export const DictionarySnapshotSchema = z.object({
  meanings: z.array(DictionaryMeaningSchema).default([]),
  examples: z.array(DictionaryExampleSchema).default([]),
  equivalents: z.array(DictionaryEquivalentSchema).default([]),
  relations: z.array(DictionaryRelationSchema).default([]),
  tags: z.array(DictionaryTagSchema).default([]),
}).strict().superRefine((value, context) => {
  rejectDuplicates(value.meanings, (item) => item.language + ':' + item.senseOrder, '释义', context);
  rejectDuplicates(
    value.examples,
    (item) => item.sentenceContentId + ':' + (item.meaningLanguage ?? '') + ':' + (item.meaningSenseOrder ?? ''),
    '例句',
    context,
  );
  rejectDuplicates(value.equivalents, (item) => item.targetContentId + ':' + item.relationType, '对应关系', context);
  rejectDuplicates(value.relations, (item) => item.targetContentId + ':' + item.relationType, '同语言关系', context);
  rejectDuplicates(value.tags, (item) => item.code, '标签', context);
});
export type DictionarySnapshot = z.infer<typeof DictionarySnapshotSchema>;

export interface StructuredContentSnapshot {
  fields: Record<string, unknown>;
  composition: SnapshotCompositionItem[];
  dictionary?: DictionarySnapshot;
}

export function parseStructuredContentSnapshot(
  contentType: StructuredContentType,
  input: unknown,
): StructuredContentSnapshot {
  const raw = z.object({
    fields: z.record(z.string(), z.unknown()),
    composition: z.array(SnapshotCompositionItemSchema).default([]),
    dictionary: DictionarySnapshotSchema.optional(),
  }).strict().parse(input);
  const fields = fieldSchemas[contentType].parse(raw.fields) as Record<string, unknown>;
  if (raw.dictionary && contentType !== 'zh_word' && contentType !== 'lo_word') {
    throw new Error('只有 Word 内容可以包含词典聚合');
  }
  return { fields, composition: raw.composition, ...(raw.dictionary ? { dictionary: raw.dictionary } : {}) };
}

export interface StructuredContentProps {
  id: string;
  language: ContentLanguage;
  contentType: StructuredContentType;
  status: 'active' | 'disabled' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export class StructuredContent {
  readonly id: string;
  readonly language: ContentLanguage;
  readonly contentType: StructuredContentType;
  readonly status: 'active' | 'disabled' | 'archived';
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: StructuredContentProps) {
    StructuredContentTypeSchema.parse(props.contentType);
    const definition = getContentCategoryDefinition(props.contentType);
    if (definition.language !== props.language) {
      throw new Error(`内容语言与类型不匹配：${props.language}/${props.contentType}`);
    }
    this.id = props.id;
    this.language = props.language;
    this.contentType = props.contentType;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}

export interface StructuredContentRevisionProps {
  id: string;
  contentId: string;
  revisionNumber: number;
  contentType: StructuredContentType;
  snapshot: StructuredContentSnapshot;
  status: ContentRevisionStatus;
  createdByOperatorId: string | null;
  reviewedByOperatorId?: string | null;
  reviewRemark?: string | null;
  reviewedAt?: Date | null;
  publishedAt?: Date | null;
  lockVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export class StructuredContentRevision {
  readonly id: string;
  readonly contentId: string;
  readonly revisionNumber: number;
  readonly contentType: StructuredContentType;
  readonly createdByOperatorId: string | null;
  readonly createdAt: Date;
  private _snapshot: StructuredContentSnapshot;
  private _status: ContentRevisionStatus;
  private _reviewedByOperatorId: string | null;
  private _reviewRemark: string | null;
  private _reviewedAt: Date | null;
  private _publishedAt: Date | null;
  private _lockVersion: number;
  private _updatedAt: Date;

  constructor(props: StructuredContentRevisionProps) {
    ContentRevisionStatusSchema.parse(props.status);
    this.id = props.id;
    this.contentId = props.contentId;
    this.revisionNumber = props.revisionNumber;
    this.contentType = props.contentType;
    this.createdByOperatorId = props.createdByOperatorId;
    this.createdAt = props.createdAt;
    this._snapshot = parseStructuredContentSnapshot(props.contentType, props.snapshot);
    this._status = props.status;
    this._reviewedByOperatorId = props.reviewedByOperatorId ?? null;
    this._reviewRemark = props.reviewRemark ?? null;
    this._reviewedAt = props.reviewedAt ?? null;
    this._publishedAt = props.publishedAt ?? null;
    this._lockVersion = props.lockVersion;
    this._updatedAt = props.updatedAt;
  }

  get snapshot(): StructuredContentSnapshot { return this._snapshot; }
  get status(): ContentRevisionStatus { return this._status; }
  get reviewedByOperatorId(): string | null { return this._reviewedByOperatorId; }
  get reviewRemark(): string | null { return this._reviewRemark; }
  get reviewedAt(): Date | null { return this._reviewedAt; }
  get publishedAt(): Date | null { return this._publishedAt; }
  get lockVersion(): number { return this._lockVersion; }
  get updatedAt(): Date { return this._updatedAt; }

  update(snapshot: StructuredContentSnapshot, expectedLockVersion: number): void {
    if (this._status !== 'draft') throw new Error('只有草稿版本可以修改');
    if (this._lockVersion !== expectedLockVersion) throw new Error('版本已被其他操作更新');
    this._snapshot = parseStructuredContentSnapshot(this.contentType, snapshot);
    this.touch();
  }

  submit(): void { this.move('submit'); }
  approve(operatorId: string): void {
    this.move('approve');
    this._reviewedByOperatorId = operatorId;
    this._reviewedAt = new Date();
  }
  reject(operatorId: string, remark: string): void {
    if (!remark.trim()) throw new Error('驳回原因不能为空');
    this.move('reject');
    this._reviewedByOperatorId = operatorId;
    this._reviewRemark = remark;
    this._reviewedAt = new Date();
  }
  reEdit(): void { this.move('re_edit'); }
  publish(publishedAt = new Date()): void {
    this.move('publish');
    this._publishedAt = publishedAt;
  }
  supersede(): void { this.move('supersede'); }

  private move(action: 'submit' | 'approve' | 'reject' | 're_edit' | 'publish' | 'supersede'): void {
    this._status = validateRevisionTransition(this._status, action);
    this.touch();
  }

  private touch(): void {
    this._lockVersion += 1;
    this._updatedAt = new Date();
  }
}
