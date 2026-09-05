import type {
  CourseRevisionSnapshot,
  CurriculumRevisionStatus,
  LessonRevisionSnapshot,
  PublishedCurriculumView,
} from '../../domain/curriculum-revision.js';
import type { OperationsTransactionalAuditBoundary } from '../../../operations/public/index.js';

export type PublishCourseRevisionInput = Readonly<{
  courseId: string;
  revisionId: string;
  expectedLockVersion: number;
  operatorId: string;
  audit: OperationsTransactionalAuditBoundary;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
  idempotencyKey?: string | undefined;
}>;

export type CreateCourseDraftInput = Readonly<{
  learningLanguage: 'zh' | 'lo';
  snapshot: CourseRevisionSnapshot;
  operatorId: string;
  audit: OperationsTransactionalAuditBoundary;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
}>;

export type CreateLessonDraftInput = Readonly<{
  courseId: string;
  unitSortOrder: number;
  title: string;
  description?: string | undefined;
  sortOrder: number;
  snapshot: LessonRevisionSnapshot;
  operatorId: string;
  audit: OperationsTransactionalAuditBoundary;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
}>;

export type ReplaceCourseStructureInput = Readonly<{
  courseId: string;
  revisionId: string;
  expectedLockVersion: number;
  expectedUpdatedAt: string;
  snapshot: CourseRevisionSnapshot;
  operatorId: string;
  audit: OperationsTransactionalAuditBoundary;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
}>;

export type ReplaceLessonStructureInput = Readonly<{
  lessonId: string;
  revisionId: string;
  expectedLockVersion: number;
  expectedUpdatedAt: string;
  snapshot: LessonRevisionSnapshot;
  operatorId: string;
  audit: OperationsTransactionalAuditBoundary;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
}>;

export type DeriveCourseWorkingInput = Readonly<{
  courseId: string;
  expectedUpdatedAt: string;
  operatorId: string;
  audit: OperationsTransactionalAuditBoundary;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
}>;
export type DeriveLessonWorkingInput = Readonly<{
  lessonId: string;
  expectedUpdatedAt: string;
  operatorId: string;
  audit: OperationsTransactionalAuditBoundary;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
}>;

export type TransitionCourseRevisionInput = Readonly<{
  courseId: string;
  revisionId: string;
  expectedLockVersion: number;
  operatorId: string;
  audit: OperationsTransactionalAuditBoundary;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
  idempotencyKey?: string | undefined;
}>;

export type ReviewCourseRevisionInput = TransitionCourseRevisionInput & Readonly<{
  action: 'approve' | 'reject';
  remark?: string | undefined;
}>;

export type TransitionLessonRevisionInput = Readonly<{
  lessonId: string;
  revisionId: string;
  expectedLockVersion: number;
  operatorId: string;
  audit: OperationsTransactionalAuditBoundary;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
  idempotencyKey?: string | undefined;
}>;

export type ReviewLessonRevisionInput = TransitionLessonRevisionInput & Readonly<{
  action: 'approve' | 'reject';
  remark?: string | undefined;
}>;

export type ManagedCourseView = Readonly<{
  id: string;
  learningLanguage: 'zh' | 'lo';
  title: string;
  status: 'draft' | 'published' | 'archived';
  sortOrder: number;
  publishedRevisionId: string | null;
  workingRevisionId: string | null;
  workingRevisionStatus: CurriculumRevisionStatus | null;
  updatedAt?: string;
}>;

export type ManagedCourseDetail = ManagedCourseView & Readonly<{
  workingSnapshot: CourseRevisionSnapshot | null;
  publishedLessons: readonly Readonly<{ lessonId: string; revisionId: string; title: string; unitSortOrder: number; sortOrder: number; }>[];
  revisions: readonly Readonly<{
    id: string;
    number: number;
    status: CurriculumRevisionStatus;
    lockVersion: number;
    createdAt: string;
    reviewedAt: string | null;
    reviewRemark: string | null;
  }>[];
}>;

export type ManagedLessonDetail = Readonly<{
  id: string;
  courseId: string;
  unitSortOrder: number;
  title: string;
  description: string | null;
  sortOrder: number;
  status: 'draft' | 'published' | 'archived';
  publishedRevisionId: string | null;
  workingRevisionId: string | null;
  workingRevisionStatus: CurriculumRevisionStatus | null;
  updatedAt: string;
  workingSnapshot: LessonRevisionSnapshot | null;
  revisions: readonly Readonly<{
    id: string;
    number: number;
    status: CurriculumRevisionStatus;
    lockVersion: number;
    createdAt: string;
    reviewedAt: string | null;
    reviewRemark: string | null;
  }>[];
}>;

export interface CurriculumRepository {
  listPublishedCourses(language?: 'zh' | 'lo'): Promise<PublishedCurriculumView<CourseRevisionSnapshot>[]>;
  listManagedCourses(language?: 'zh' | 'lo'): Promise<ManagedCourseView[]>;
  getManagedCourseDetail?(courseId: string): Promise<ManagedCourseDetail | null>;
  getManagedLessonDetail?(lessonId: string): Promise<ManagedLessonDetail | null>;
  findPublishedCourse(courseId: string): Promise<PublishedCurriculumView<CourseRevisionSnapshot> | null>;
  findPublishedLesson(lessonId: string): Promise<PublishedCurriculumView<LessonRevisionSnapshot> | null>;
  createCourseDraft(input: CreateCourseDraftInput): Promise<Readonly<{ courseId: string; revisionId: string; lockVersion: number }>>;
  replaceCourseStructure(input: ReplaceCourseStructureInput): Promise<Readonly<{ lockVersion: number; updatedAt: string }>>;
  replaceLessonStructure(input: ReplaceLessonStructureInput): Promise<Readonly<{ lockVersion: number; updatedAt: string }>>;
  deriveCourseWorking(input: DeriveCourseWorkingInput): Promise<Readonly<{ revisionId: string; lockVersion: number; updatedAt: string }>>;
  deriveLessonWorking(input: DeriveLessonWorkingInput): Promise<Readonly<{ revisionId: string; lockVersion: number; updatedAt: string }>>;
  createLessonDraft(input: CreateLessonDraftInput): Promise<Readonly<{ lessonId: string; revisionId: string; lockVersion: number }>>;
  submitLessonRevision(input: TransitionLessonRevisionInput): Promise<void>;
  reviewLessonRevision(input: ReviewLessonRevisionInput): Promise<void>;
  publishLessonAtomic(input: TransitionLessonRevisionInput): Promise<void>;
  submitCourseRevision(input: TransitionCourseRevisionInput): Promise<void>;
  reviewCourseRevision(input: ReviewCourseRevisionInput): Promise<void>;
  publishCourseAtomic(input: PublishCourseRevisionInput): Promise<void>;
}
