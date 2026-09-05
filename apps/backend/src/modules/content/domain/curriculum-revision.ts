import { z } from 'zod';

const UuidSchema = z.uuid();

export const CurriculumRevisionStatusSchema = z.enum([
  'draft', 'pending_review', 'approved', 'published', 'rejected', 'superseded',
]);
export type CurriculumRevisionStatus = z.infer<typeof CurriculumRevisionStatusSchema>;

export const LessonReferenceSchema = z.object({
  lessonId: UuidSchema,
  revisionId: UuidSchema,
  title: z.string().min(1).max(128),
  sortOrder: z.number().int().positive(),
}).strict();

export const CourseRevisionSnapshotSchema = z.object({
  title: z.string().min(1).max(128),
  subtitle: z.string().max(256).nullable().optional(),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0),
  units: z.array(z.object({
    title: z.string().min(1).max(128),
    description: z.string().nullable().optional(),
    sortOrder: z.number().int().positive(),
    lessons: z.array(LessonReferenceSchema),
  }).strict()),
}).strict();
export type CourseRevisionSnapshot = z.infer<typeof CourseRevisionSnapshotSchema>;

export const LessonRevisionSnapshotSchema = z.object({
  sections: z.array(z.object({
    sectionType: z.enum(['introduction', 'knowledge', 'example', 'practice', 'summary', 'custom']),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    sortOrder: z.number().int().positive(),
    items: z.array(z.object({
      itemType: z.enum(['content', 'exercise']),
      entityId: UuidSchema,
      revisionId: UuidSchema,
      sortOrder: z.number().int().positive(),
    }).strict()),
  }).strict()),
}).strict();
export type LessonRevisionSnapshot = z.infer<typeof LessonRevisionSnapshotSchema>;

export interface PublishedCurriculumView<Snapshot> {
  id: string;
  revisionId: string;
  revisionNumber: number;
  snapshot: Snapshot;
}

export interface CurriculumAggregateProps {
  id: string;
  language: 'zh' | 'lo';
  availability: 'draft' | 'published' | 'archived';
  publishedRevisionId: string | null;
  workingRevisionId: string | null;
}

/** Domain-safe representation; storage pointer IDs remain internal to the repository. */
export class CurriculumAggregate {
  readonly id: string;
  readonly language: 'zh' | 'lo';
  readonly availability: 'draft' | 'published' | 'archived';
  readonly publishedRevisionId: string | null;
  readonly workingRevisionId: string | null;

  constructor(props: CurriculumAggregateProps) {
    this.id = UuidSchema.parse(props.id);
    this.language = z.enum(['zh', 'lo']).parse(props.language);
    this.availability = z.enum(['draft', 'published', 'archived']).parse(props.availability);
    this.publishedRevisionId = props.publishedRevisionId === null ? null : UuidSchema.parse(props.publishedRevisionId);
    this.workingRevisionId = props.workingRevisionId === null ? null : UuidSchema.parse(props.workingRevisionId);
    if (this.availability === 'published' && !this.publishedRevisionId) {
      throw new Error('已发布课程或课节必须具有正式 revision 指针');
    }
  }
}

export class CurriculumRevision<Snapshot> {
  private _status: CurriculumRevisionStatus;
  private _lockVersion: number;

  constructor(
    readonly id: string,
    readonly aggregateId: string,
    readonly revisionNumber: number,
    readonly snapshot: Snapshot,
    status: CurriculumRevisionStatus,
    lockVersion: number,
  ) {
    UuidSchema.parse(id);
    UuidSchema.parse(aggregateId);
    if (!Number.isInteger(revisionNumber) || revisionNumber <= 0) throw new Error('revisionNumber 必须为正整数');
    this._status = CurriculumRevisionStatusSchema.parse(status);
    if (!Number.isInteger(lockVersion) || lockVersion < 0) throw new Error('lockVersion 无效');
    this._lockVersion = lockVersion;
  }

  get status(): CurriculumRevisionStatus { return this._status; }
  get lockVersion(): number { return this._lockVersion; }

  submit(expectedLockVersion: number): void { this.transition('draft', 'pending_review', expectedLockVersion); }
  approve(expectedLockVersion: number): void { this.transition('pending_review', 'approved', expectedLockVersion); }
  reject(expectedLockVersion: number): void { this.transition('pending_review', 'rejected', expectedLockVersion); }
  reEdit(expectedLockVersion: number): void { this.transition('rejected', 'draft', expectedLockVersion); }
  publish(expectedLockVersion: number): void { this.transition('approved', 'published', expectedLockVersion); }
  supersede(expectedLockVersion: number): void { this.transition('published', 'superseded', expectedLockVersion); }

  private transition(from: CurriculumRevisionStatus, to: CurriculumRevisionStatus, expectedLockVersion: number): void {
    if (this._lockVersion !== expectedLockVersion) throw new Error('版本已被其他操作更新');
    if (this._status !== from) throw new Error(`不能从 ${this._status} 转换为 ${to}`);
    this._status = to;
    this._lockVersion += 1;
  }
}

export function assertPublishedRevisionReferences(references: readonly { entityId: string; revisionId: string; status: CurriculumRevisionStatus }[]): void {
  for (const reference of references) {
    UuidSchema.parse(reference.entityId);
    UuidSchema.parse(reference.revisionId);
    if (reference.status !== 'published') throw new Error(`引用版本尚未发布：${reference.revisionId}`);
  }
}

export function parseCourseRevisionSnapshot(input: unknown): CourseRevisionSnapshot {
  return CourseRevisionSnapshotSchema.parse(input);
}

export function parseLessonRevisionSnapshot(input: unknown): LessonRevisionSnapshot {
  return LessonRevisionSnapshotSchema.parse(input);
}
