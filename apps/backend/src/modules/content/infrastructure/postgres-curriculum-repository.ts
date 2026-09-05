import type { DatabaseExecutor } from '../../../database/executor.js';
import type { TransactionManager } from '../../../database/transaction-manager.js';
import { createHash, randomUUID } from 'node:crypto';
import { AppError } from '../../../errors/app-error.js';
import { CONFLICT } from '../../../errors/business-codes.js';
import type { CreateCourseDraftInput, CreateLessonDraftInput, CurriculumRepository, DeriveCourseWorkingInput, DeriveLessonWorkingInput, ManagedCourseDetail, ManagedCourseView, ManagedLessonDetail, PublishCourseRevisionInput, ReplaceCourseStructureInput, ReplaceLessonStructureInput, ReviewCourseRevisionInput, ReviewLessonRevisionInput, TransitionCourseRevisionInput, TransitionLessonRevisionInput } from '../application/ports/curriculum-repository.js';
import {
  parseCourseRevisionSnapshot,
  parseLessonRevisionSnapshot,
  type CourseRevisionSnapshot,
  type LessonRevisionSnapshot,
  type PublishedCurriculumView,
} from '../domain/curriculum-revision.js';

type Row = Record<string, unknown>;

/**
 * Maps Content's internal pointer rows to safe UUID-facing read models.
 * The explicit pointer join deliberately rejects stale, draft, or cross-root
 * revisions rather than falling back to the latest revision number.
 */
export class PostgresCurriculumRepository implements CurriculumRepository {
  constructor(private readonly db: DatabaseExecutor, private readonly transactions?: TransactionManager) {}

  async createCourseDraft(input: CreateCourseDraftInput): Promise<Readonly<{ courseId: string; revisionId: string; lockVersion: number }>> {
    const courseId = randomUUID();
    const revisionId = randomUUID();
    const snapshot = parseCourseRevisionSnapshot(input.snapshot);
    return this.inTransaction(async (executor) => {
      const root = await executor.query<Row>(
        `INSERT INTO content.courses (public_id, learning_language, title, subtitle, description, status, sort_order)
         VALUES ($1, $2, $3, $4, $5, 'draft', $6) RETURNING id`,
        [courseId, input.learningLanguage, snapshot.title, snapshot.subtitle ?? null, snapshot.description ?? null, snapshot.sortOrder],
      );
      for (const unit of snapshot.units) {
        await executor.query(
          `INSERT INTO content.units (course_id, title, description, sort_order)
           VALUES ($1, $2, $3, $4)`,
          [root.rows[0]?.['id'], unit.title, unit.description ?? null, unit.sortOrder],
        );
      }
      await this.assertPublishedLessonPins(executor, snapshot, courseId);
      const revision = await executor.query<Row>(
        `INSERT INTO content.content_revisions (revision_public_id, entity_type, entity_id, revision_number, status, snapshot, created_by_operator_id)
         VALUES ($1, 'course', $2, 1, 'draft', $3::jsonb, $4) RETURNING id`,
        [revisionId, courseId, JSON.stringify(snapshot), input.operatorId],
      );
      await executor.query(`UPDATE content.courses SET working_revision_id=$1 WHERE id=$2`, [revision.rows[0]?.['id'], root.rows[0]?.['id']]);
      await input.audit.recordSuccessfulActionInTransaction(executor, {
        operatorId: input.operatorId, actionKey: 'content.curriculum.create', target: { domain: 'content', type: 'course', id: courseId },
        requestContext: { requestId: input.requestId, ipAddress: input.ipAddress }, details: { revision_id: revisionId },
      });
      return { courseId, revisionId, lockVersion: 0 };
    });
  }

  async createLessonDraft(input: CreateLessonDraftInput): Promise<Readonly<{ lessonId: string; revisionId: string; lockVersion: number }>> {
    const lessonId = randomUUID();
    const revisionId = randomUUID();
    const snapshot = parseLessonRevisionSnapshot(input.snapshot);
    return this.inTransaction(async (executor) => {
      const unit = await executor.query<Row>(
        `SELECT unit.id FROM content.units unit JOIN content.courses course ON course.id=unit.course_id
          WHERE course.public_id=$1 AND unit.sort_order=$2 AND course.status <> 'archived' FOR UPDATE`,
        [input.courseId, input.unitSortOrder],
      );
      if (!unit.rows[0]) throw new Error('课程单元不存在');
      await this.assertPublishedLessonItemPins(executor, snapshot);
      const root = await executor.query<Row>(
        `INSERT INTO content.lessons (public_id, unit_id, title, description, sort_order, status)
         VALUES ($1, $2, $3, $4, $5, 'draft') RETURNING id`,
        [lessonId, unit.rows[0]['id'], input.title, input.description ?? null, input.sortOrder],
      );
      const revision = await executor.query<Row>(
        `INSERT INTO content.content_revisions (revision_public_id, entity_type, entity_id, revision_number, status, snapshot, created_by_operator_id)
         VALUES ($1, 'lesson', $2, 1, 'draft', $3::jsonb, $4) RETURNING id`,
        [revisionId, lessonId, JSON.stringify(snapshot), input.operatorId],
      );
      await executor.query(`UPDATE content.lessons SET working_revision_id=$1 WHERE id=$2`, [revision.rows[0]?.['id'], root.rows[0]?.['id']]);
      await input.audit.recordSuccessfulActionInTransaction(executor, {
        operatorId: input.operatorId, actionKey: 'content.curriculum.create_lesson', target: { domain: 'content', type: 'lesson', id: lessonId },
        requestContext: { requestId: input.requestId, ipAddress: input.ipAddress }, details: { course_id: input.courseId, revision_id: revisionId },
      });
      return { lessonId, revisionId, lockVersion: 0 };
    });
  }

  async replaceCourseStructure(input: ReplaceCourseStructureInput): Promise<Readonly<{ lockVersion: number; updatedAt: string }>> {
    const snapshot = parseCourseRevisionSnapshot(input.snapshot);
    const expectedUpdatedAt = new Date(input.expectedUpdatedAt);
    if (Number.isNaN(expectedUpdatedAt.getTime())) throw new Error('expectedUpdatedAt 无效');
    return this.inTransaction(async (executor) => {
      const root = await executor.query<Row>(`SELECT id, updated_at FROM content.courses WHERE public_id=$1 AND status='draft' FOR UPDATE`, [input.courseId]);
      const rootRow = root.rows[0];
      if (!rootRow || new Date(String(rootRow['updated_at'])).getTime() !== expectedUpdatedAt.getTime()) throw new Error('课程已被其他操作更新');
      const revision = await executor.query<Row>(`SELECT id FROM content.content_revisions WHERE revision_public_id=$1 AND entity_type='course' AND entity_id=$2 AND status='draft' AND lock_version=$3 FOR UPDATE`, [input.revisionId, input.courseId, input.expectedLockVersion]);
      if (!revision.rows[0]) throw new Error('版本不存在、状态非法或已被其他操作更新');
      for (const unit of snapshot.units) {
        await executor.query(`INSERT INTO content.units (course_id, title, description, sort_order) VALUES ($1, $2, $3, $4) ON CONFLICT (course_id, sort_order) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description, updated_at=now()`, [rootRow['id'], unit.title, unit.description ?? null, unit.sortOrder]);
      }
      await this.assertPublishedLessonPins(executor, snapshot, input.courseId);
      const changed = await executor.query(`UPDATE content.content_revisions SET snapshot=$1::jsonb, lock_version=lock_version+1, updated_at=now() WHERE id=$2 AND lock_version=$3`, [JSON.stringify(snapshot), revision.rows[0]['id'], input.expectedLockVersion]);
      if (changed.rowCount !== 1) throw new Error('版本已被其他操作更新');
      const updated = await executor.query<Row>(`UPDATE content.courses SET title=$1, subtitle=$2, description=$3, sort_order=$4, updated_at=now() WHERE id=$5 RETURNING updated_at`, [snapshot.title, snapshot.subtitle ?? null, snapshot.description ?? null, snapshot.sortOrder, rootRow['id']]);
      const updatedAt = new Date(String(updated.rows[0]?.['updated_at'])).toISOString();
      await input.audit.recordSuccessfulActionInTransaction(executor, { operatorId: input.operatorId, actionKey: 'content.curriculum.replace_structure', target: { domain: 'content', type: 'course', id: input.courseId }, requestContext: { requestId: input.requestId, ipAddress: input.ipAddress }, details: { revision_id: input.revisionId } });
      return { lockVersion: input.expectedLockVersion + 1, updatedAt };
    });
  }

  async replaceLessonStructure(input: ReplaceLessonStructureInput): Promise<Readonly<{ lockVersion: number; updatedAt: string }>> {
    const snapshot = parseLessonRevisionSnapshot(input.snapshot);
    const expectedUpdatedAt = new Date(input.expectedUpdatedAt);
    if (Number.isNaN(expectedUpdatedAt.getTime())) throw new Error('expectedUpdatedAt 无效');
    return this.inTransaction(async (executor) => {
      const root = await executor.query<Row>(`SELECT id, updated_at FROM content.lessons WHERE public_id=$1 AND status='draft' FOR UPDATE`, [input.lessonId]);
      const rootRow = root.rows[0];
      if (!rootRow || new Date(String(rootRow['updated_at'])).getTime() !== expectedUpdatedAt.getTime()) throw new Error('课节已被其他操作更新');
      const revision = await executor.query<Row>(`SELECT id FROM content.content_revisions WHERE revision_public_id=$1 AND entity_type='lesson' AND entity_id=$2 AND status='draft' AND lock_version=$3 FOR UPDATE`, [input.revisionId, input.lessonId, input.expectedLockVersion]);
      if (!revision.rows[0]) throw new Error('版本不存在、状态非法或已被其他操作更新');
      await this.assertPublishedLessonItemPins(executor, snapshot);
      const changed = await executor.query(`UPDATE content.content_revisions SET snapshot=$1::jsonb, lock_version=lock_version+1, updated_at=now() WHERE id=$2 AND lock_version=$3`, [JSON.stringify(snapshot), revision.rows[0]['id'], input.expectedLockVersion]);
      if (changed.rowCount !== 1) throw new Error('版本已被其他操作更新');
      const updated = await executor.query<Row>(`UPDATE content.lessons SET updated_at=now() WHERE id=$1 RETURNING updated_at`, [rootRow['id']]);
      const updatedAt = new Date(String(updated.rows[0]?.['updated_at'])).toISOString();
      await input.audit.recordSuccessfulActionInTransaction(executor, { operatorId: input.operatorId, actionKey: 'content.curriculum.replace_lesson_structure', target: { domain: 'content', type: 'lesson', id: input.lessonId }, requestContext: { requestId: input.requestId, ipAddress: input.ipAddress }, details: { revision_id: input.revisionId } });
      return { lockVersion: input.expectedLockVersion + 1, updatedAt };
    });
  }

  async deriveCourseWorking(input: DeriveCourseWorkingInput): Promise<Readonly<{ revisionId: string; lockVersion: number; updatedAt: string }>> {
    const expectedUpdatedAt = new Date(input.expectedUpdatedAt);
    if (Number.isNaN(expectedUpdatedAt.getTime())) throw new Error('expectedUpdatedAt 无效');
    const revisionId = randomUUID();
    return this.inTransaction(async (executor) => {
      const root = await executor.query<Row>(`SELECT id, updated_at, published_revision_id, working_revision_id FROM content.courses WHERE public_id=$1 AND status='published' FOR UPDATE`, [input.courseId]);
      const rootRow = root.rows[0];
      if (!rootRow || new Date(String(rootRow['updated_at'])).getTime() !== expectedUpdatedAt.getTime()) throw new Error('课程已被其他操作更新');
      if (rootRow['working_revision_id']) throw new Error('课程已有活动工作版本');
      const published = await executor.query<Row>(`SELECT id, snapshot, revision_number FROM content.content_revisions WHERE id=$1 AND entity_type='course' AND entity_id=$2 AND status='published' FOR UPDATE`, [rootRow['published_revision_id'], input.courseId]);
      const publishedRow = published.rows[0];
      if (!publishedRow) throw new Error('课程缺少合法已发布版本');
      const derived = await executor.query<Row>(`INSERT INTO content.content_revisions (revision_public_id, entity_type, entity_id, revision_number, status, snapshot, created_by_operator_id, supersedes_revision_id) VALUES ($1, 'course', $2, $3, 'draft', $4::jsonb, $5, $6) RETURNING id`, [revisionId, input.courseId, Number(publishedRow['revision_number']) + 1, JSON.stringify(this.parseJson(publishedRow['snapshot'])), input.operatorId, publishedRow['id']]);
      const updated = await executor.query<Row>(`UPDATE content.courses SET working_revision_id=$1, updated_at=now() WHERE id=$2 RETURNING updated_at`, [derived.rows[0]?.['id'], rootRow['id']]);
      const updatedAt = new Date(String(updated.rows[0]?.['updated_at'])).toISOString();
      await input.audit.recordSuccessfulActionInTransaction(executor, { operatorId: input.operatorId, actionKey: 'content.curriculum.derive_working', target: { domain: 'content', type: 'course', id: input.courseId }, requestContext: { requestId: input.requestId, ipAddress: input.ipAddress }, details: { revision_id: revisionId, supersedes_revision_id: rootRow['published_revision_id'] } });
      return { revisionId, lockVersion: 0, updatedAt };
    });
  }

  async deriveLessonWorking(input: DeriveLessonWorkingInput): Promise<Readonly<{ revisionId: string; lockVersion: number; updatedAt: string }>> {
    const expectedUpdatedAt = new Date(input.expectedUpdatedAt);
    if (Number.isNaN(expectedUpdatedAt.getTime())) throw new Error('expectedUpdatedAt 无效');
    const revisionId = randomUUID();
    return this.inTransaction(async (executor) => {
      const root = await executor.query<Row>(`SELECT id, updated_at, published_revision_id, working_revision_id FROM content.lessons WHERE public_id=$1 AND status='published' FOR UPDATE`, [input.lessonId]);
      const rootRow = root.rows[0];
      if (!rootRow || new Date(String(rootRow['updated_at'])).getTime() !== expectedUpdatedAt.getTime()) throw new Error('课节已被其他操作更新');
      if (rootRow['working_revision_id']) throw new Error('课节已有活动工作版本');
      const published = await executor.query<Row>(`SELECT id, snapshot, revision_number FROM content.content_revisions WHERE id=$1 AND entity_type='lesson' AND entity_id=$2 AND status='published' FOR UPDATE`, [rootRow['published_revision_id'], input.lessonId]);
      const row = published.rows[0]; if (!row) throw new Error('课节缺少合法已发布版本');
      const derived = await executor.query<Row>(`INSERT INTO content.content_revisions (revision_public_id, entity_type, entity_id, revision_number, status, snapshot, created_by_operator_id, supersedes_revision_id) VALUES ($1, 'lesson', $2, $3, 'draft', $4::jsonb, $5, $6) RETURNING id`, [revisionId, input.lessonId, Number(row['revision_number']) + 1, JSON.stringify(this.parseJson(row['snapshot'])), input.operatorId, row['id']]);
      const updated = await executor.query<Row>(`UPDATE content.lessons SET working_revision_id=$1, updated_at=now() WHERE id=$2 RETURNING updated_at`, [derived.rows[0]?.['id'], rootRow['id']]);
      const updatedAt = new Date(String(updated.rows[0]?.['updated_at'])).toISOString();
      await input.audit.recordSuccessfulActionInTransaction(executor, { operatorId: input.operatorId, actionKey: 'content.curriculum.derive_lesson_working', target: { domain: 'content', type: 'lesson', id: input.lessonId }, requestContext: { requestId: input.requestId, ipAddress: input.ipAddress }, details: { revision_id: revisionId } });
      return { revisionId, lockVersion: 0, updatedAt };
    });
  }

  async submitLessonRevision(input: TransitionLessonRevisionInput): Promise<void> {
    await this.transitionLessonRevision(input, 'draft', 'pending_review', 'content.curriculum.submit_lesson_review');
  }

  async reviewLessonRevision(input: ReviewLessonRevisionInput): Promise<void> {
    if (input.action === 'reject' && !input.remark?.trim()) throw new Error('驳回必须提供原因');
    await this.withLifecycleReceipt(input, 'lesson', 'lesson.review', { action: input.action, remark: input.remark?.trim() ?? null }, async (executor) => {
      const next = input.action === 'approve' ? 'approved' : 'rejected';
      const changed = await executor.query(
        `UPDATE content.content_revisions SET status=$1, reviewed_by_operator_id=$2, review_remark=$3, reviewed_at=now(), lock_version=lock_version+1, updated_at=now()
          WHERE revision_public_id=$4 AND entity_type='lesson' AND entity_id=$5 AND status='pending_review' AND lock_version=$6`,
        [next, input.operatorId, input.remark?.trim() ?? null, input.revisionId, input.lessonId, input.expectedLockVersion],
      );
      if (changed.rowCount !== 1) throw new Error('版本不存在、状态非法或已被其他操作更新');
      await input.audit.recordSuccessfulActionInTransaction(executor, {
        operatorId: input.operatorId, actionKey: 'content.curriculum.review_lesson', target: { domain: 'content', type: 'lesson', id: input.lessonId },
        requestContext: { requestId: input.requestId, ipAddress: input.ipAddress }, details: { revision_id: input.revisionId, action: input.action },
      });
    });
  }

  async publishLessonAtomic(input: TransitionLessonRevisionInput): Promise<void> {
    await this.withLifecycleReceipt(input, 'lesson', 'lesson.publish', {}, async (executor) => {
      const root = await executor.query<Row>(`SELECT id, published_revision_id FROM content.lessons WHERE public_id=$1 AND status <> 'archived' FOR UPDATE`, [input.lessonId]);
      if (!root.rows[0]) throw new Error('课节不存在');
      const target = await executor.query<Row>(`SELECT id, snapshot FROM content.content_revisions WHERE revision_public_id=$1 AND entity_type='lesson' AND entity_id=$2 AND status='approved' AND lock_version=$3 FOR UPDATE`, [input.revisionId, input.lessonId, input.expectedLockVersion]);
      const revision = target.rows[0];
      if (!revision) throw new Error('版本不存在、未批准或已被其他操作更新');
      await this.assertPublishedLessonItemPins(executor, parseLessonRevisionSnapshot(this.parseJson(revision['snapshot'])));
      const oldId = root.rows[0]['published_revision_id'];
      if (oldId) await executor.query(`UPDATE content.content_revisions SET status='superseded', published_at=NULL, lock_version=lock_version+1, updated_at=now() WHERE id=$1 AND status='published'`, [oldId]);
      const published = await executor.query(`UPDATE content.content_revisions SET status='published', published_at=now(), lock_version=lock_version+1, updated_at=now() WHERE id=$1 AND status='approved' AND lock_version=$2`, [revision['id'], input.expectedLockVersion]);
      if (published.rowCount !== 1) throw new Error('版本已被其他操作更新');
      await executor.query(`UPDATE content.lessons SET published_revision_id=$1, working_revision_id=NULL, status='published', published_at=now(), updated_at=now() WHERE public_id=$2`, [revision['id'], input.lessonId]);
      await input.audit.recordSuccessfulActionInTransaction(executor, {
        operatorId: input.operatorId, actionKey: 'content.curriculum.publish_lesson', target: { domain: 'content', type: 'lesson', id: input.lessonId },
        requestContext: { requestId: input.requestId, ipAddress: input.ipAddress }, details: { revision_id: input.revisionId },
      });
    });
  }

  async submitCourseRevision(input: TransitionCourseRevisionInput): Promise<void> {
    await this.transitionCourseRevision(input, 'draft', 'pending_review', 'content.curriculum.submit_review');
  }

  async reviewCourseRevision(input: ReviewCourseRevisionInput): Promise<void> {
    if (input.action === 'reject' && !input.remark?.trim()) throw new Error('驳回必须提供原因');
    await this.withLifecycleReceipt(input, 'course', 'course.review', { action: input.action, remark: input.remark?.trim() ?? null }, async (executor) => {
      const next = input.action === 'approve' ? 'approved' : 'rejected';
      const changed = await executor.query(
        `UPDATE content.content_revisions SET status=$1, reviewed_by_operator_id=$2, review_remark=$3, reviewed_at=now(), lock_version=lock_version+1, updated_at=now()
          WHERE revision_public_id=$4 AND entity_type='course' AND entity_id=$5 AND status='pending_review' AND lock_version=$6`,
        [next, input.operatorId, input.remark?.trim() ?? null, input.revisionId, input.courseId, input.expectedLockVersion],
      );
      if (changed.rowCount !== 1) throw new Error('版本不存在、状态非法或已被其他操作更新');
      await input.audit.recordSuccessfulActionInTransaction(executor, {
        operatorId: input.operatorId, actionKey: 'content.curriculum.review', target: { domain: 'content', type: 'course', id: input.courseId },
        requestContext: { requestId: input.requestId, ipAddress: input.ipAddress }, details: { revision_id: input.revisionId, action: input.action },
      });
    });
  }

  async publishCourseAtomic(input: PublishCourseRevisionInput): Promise<void> {
    await this.withLifecycleReceipt(input, 'course', 'course.publish', {}, async (executor) => {
      const root = await executor.query<Row>(`SELECT id, published_revision_id FROM content.courses WHERE public_id = $1 AND status <> 'archived' FOR UPDATE`, [input.courseId]);
      if (!root.rows[0]) throw new Error('课程不存在');
      const target = await executor.query<Row>(`SELECT id, snapshot FROM content.content_revisions WHERE revision_public_id=$1 AND entity_type='course' AND entity_id=$2 AND status='approved' AND lock_version=$3 FOR UPDATE`, [input.revisionId, input.courseId, input.expectedLockVersion]);
      const revision = target.rows[0];
      if (!revision) throw new Error('版本不存在、未批准或已被其他操作更新');
      const snapshot = parseCourseRevisionSnapshot(this.parseJson(revision['snapshot']));
      await this.assertPublishedLessonPins(executor, snapshot, input.courseId);
      const oldId = root.rows[0]['published_revision_id'];
      if (oldId) await executor.query(`UPDATE content.content_revisions SET status='superseded', published_at=NULL, lock_version=lock_version+1, updated_at=now() WHERE id=$1 AND status='published'`, [oldId]);
      const published = await executor.query(`UPDATE content.content_revisions SET status='published', published_at=now(), lock_version=lock_version+1, updated_at=now() WHERE id=$1 AND status='approved' AND lock_version=$2`, [revision['id'], input.expectedLockVersion]);
      if (published.rowCount !== 1) throw new Error('版本已被其他操作更新');
      await executor.query(`UPDATE content.courses SET published_revision_id=$1, working_revision_id=NULL, status='published', title=$2, subtitle=$3, description=$4, sort_order=$5, updated_at=now() WHERE public_id=$6`, [revision['id'], snapshot.title, snapshot.subtitle ?? null, snapshot.description ?? null, snapshot.sortOrder, input.courseId]);
      await input.audit.recordSuccessfulActionInTransaction(executor, { operatorId: input.operatorId, actionKey: 'content.curriculum.publish', target: { domain: 'content', type: 'course', id: input.courseId }, requestContext: { requestId: input.requestId, ipAddress: input.ipAddress }, details: { revision_id: input.revisionId } });
    });
  }

  async findPublishedCourse(courseId: string): Promise<PublishedCurriculumView<CourseRevisionSnapshot> | null> {
    const row = await this.findPublished('courses', 'course', courseId);
    return row ? {
      id: courseId,
      revisionId: String(row['revision_public_id']),
      revisionNumber: Number(row['revision_number']),
      snapshot: parseCourseRevisionSnapshot(this.parseJson(row['snapshot'])),
    } : null;
  }

  async listPublishedCourses(language?: 'zh' | 'lo'): Promise<PublishedCurriculumView<CourseRevisionSnapshot>[]> {
    const result = await this.db.query<Row>(
      `SELECT root.public_id, revision.revision_public_id, revision.revision_number, revision.snapshot
         FROM content.courses root
         JOIN content.content_revisions revision ON revision.id = root.published_revision_id
        WHERE root.status = 'published'
          AND revision.entity_type = 'course'
          AND revision.entity_id = root.public_id
          AND revision.status = 'published'
          AND ($1::varchar IS NULL OR root.learning_language = $1)
        ORDER BY root.sort_order, root.public_id`,
      [language ?? null],
    );
    return result.rows.map((row) => ({
      id: String(row['public_id']),
      revisionId: String(row['revision_public_id']),
      revisionNumber: Number(row['revision_number']),
      snapshot: parseCourseRevisionSnapshot(this.parseJson(row['snapshot'])),
    }));
  }

  async listManagedCourses(language?: 'zh' | 'lo'): Promise<ManagedCourseView[]> {
    const result = await this.db.query<Row>(
      `SELECT root.public_id, root.learning_language, root.title, root.status, root.sort_order, root.updated_at,
              published.revision_public_id AS published_revision_id,
              working.revision_public_id AS working_revision_id, working.status AS working_revision_status
         FROM content.courses root
         LEFT JOIN content.content_revisions published ON published.id=root.published_revision_id
         LEFT JOIN content.content_revisions working ON working.id=root.working_revision_id
        WHERE ($1::varchar IS NULL OR root.learning_language=$1)
        ORDER BY root.sort_order, root.public_id`,
      [language ?? null],
    );
    return result.rows.map((row) => ({
      id: String(row['public_id']), learningLanguage: row['learning_language'] as 'zh' | 'lo', title: String(row['title']),
      status: row['status'] as ManagedCourseView['status'], sortOrder: Number(row['sort_order']),
      publishedRevisionId: row['published_revision_id'] ? String(row['published_revision_id']) : null,
      workingRevisionId: row['working_revision_id'] ? String(row['working_revision_id']) : null,
      workingRevisionStatus: row['working_revision_status'] as ManagedCourseView['workingRevisionStatus'],
      updatedAt: new Date(String(row['updated_at'])).toISOString(),
    }));
  }

  async getManagedCourseDetail(courseId: string): Promise<ManagedCourseDetail | null> {
    const course = (await this.listManagedCourses()).find((item) => item.id === courseId);
    if (!course) return null;
    const revisions = await this.db.query<Row>(
      `SELECT revision_public_id, revision_number, status, lock_version, created_at, reviewed_at, review_remark, snapshot
         FROM content.content_revisions
        WHERE entity_type='course' AND entity_id=$1
        ORDER BY revision_number DESC`,
      [courseId],
    );
    const publishedLessons = await this.db.query<Row>(
      `SELECT lesson.public_id AS lesson_id, revision.revision_public_id AS revision_id, lesson.title,
              unit.sort_order AS unit_sort_order, lesson.sort_order
         FROM content.lessons lesson
         JOIN content.units unit ON unit.id=lesson.unit_id
         JOIN content.content_revisions revision ON revision.id=lesson.published_revision_id
        WHERE unit.course_id=(SELECT id FROM content.courses WHERE public_id=$1)
          AND lesson.status='published' AND revision.entity_type='lesson' AND revision.status='published'
        ORDER BY unit.sort_order, lesson.sort_order, lesson.public_id`, [courseId]);
    return {
      ...course,
      workingSnapshot: (() => {
        const working = revisions.rows.find((row) => String(row['revision_public_id']) === course.workingRevisionId);
        return working ? parseCourseRevisionSnapshot(this.parseJson(working['snapshot'])) : null;
      })(),
      publishedLessons: publishedLessons.rows.map((row) => ({ lessonId: String(row['lesson_id']), revisionId: String(row['revision_id']), title: String(row['title']), unitSortOrder: Number(row['unit_sort_order']), sortOrder: Number(row['sort_order']) })),
      revisions: revisions.rows.map((row) => ({
        id: String(row['revision_public_id']), number: Number(row['revision_number']),
        status: row['status'] as ManagedCourseDetail['revisions'][number]['status'], lockVersion: Number(row['lock_version']),
        createdAt: new Date(String(row['created_at'])).toISOString(),
        reviewedAt: row['reviewed_at'] ? new Date(String(row['reviewed_at'])).toISOString() : null,
        reviewRemark: row['review_remark'] ? String(row['review_remark']) : null,
      })),
    };
  }

  async getManagedLessonDetail(lessonId: string): Promise<ManagedLessonDetail | null> {
    const roots = await this.db.query<Row>(
      `SELECT lesson.public_id, course.public_id AS course_id, unit.sort_order AS unit_sort_order,
              lesson.title, lesson.description, lesson.sort_order, lesson.status, lesson.updated_at,
              published.revision_public_id AS published_revision_id,
              working.revision_public_id AS working_revision_id, working.status AS working_revision_status
         FROM content.lessons lesson
         JOIN content.units unit ON unit.id=lesson.unit_id
         JOIN content.courses course ON course.id=unit.course_id
         LEFT JOIN content.content_revisions published ON published.id=lesson.published_revision_id
         LEFT JOIN content.content_revisions working ON working.id=lesson.working_revision_id
        WHERE lesson.public_id=$1`, [lessonId]);
    const root = roots.rows[0];
    if (!root) return null;
    const revisions = await this.db.query<Row>(
      `SELECT revision_public_id, revision_number, status, lock_version, created_at, reviewed_at, review_remark, snapshot
         FROM content.content_revisions WHERE entity_type='lesson' AND entity_id=$1 ORDER BY revision_number DESC`, [lessonId]);
    const workingRevisionId = root['working_revision_id'] ? String(root['working_revision_id']) : null;
    return {
      id: String(root['public_id']), courseId: String(root['course_id']), unitSortOrder: Number(root['unit_sort_order']),
      title: String(root['title']), description: root['description'] ? String(root['description']) : null,
      sortOrder: Number(root['sort_order']), status: root['status'] as ManagedLessonDetail['status'],
      publishedRevisionId: root['published_revision_id'] ? String(root['published_revision_id']) : null,
      workingRevisionId, workingRevisionStatus: root['working_revision_status'] as ManagedLessonDetail['workingRevisionStatus'],
      updatedAt: new Date(String(root['updated_at'])).toISOString(),
      workingSnapshot: (() => { const working = revisions.rows.find((row) => String(row['revision_public_id']) === workingRevisionId); return working ? parseLessonRevisionSnapshot(this.parseJson(working['snapshot'])) : null; })(),
      revisions: revisions.rows.map((row) => ({ id: String(row['revision_public_id']), number: Number(row['revision_number']), status: row['status'] as ManagedLessonDetail['revisions'][number]['status'], lockVersion: Number(row['lock_version']), createdAt: new Date(String(row['created_at'])).toISOString(), reviewedAt: row['reviewed_at'] ? new Date(String(row['reviewed_at'])).toISOString() : null, reviewRemark: row['review_remark'] ? String(row['review_remark']) : null })),
    };
  }

  async findPublishedLesson(lessonId: string): Promise<PublishedCurriculumView<LessonRevisionSnapshot> | null> {
    const row = await this.findPublished('lessons', 'lesson', lessonId);
    return row ? {
      id: lessonId,
      revisionId: String(row['revision_public_id']),
      revisionNumber: Number(row['revision_number']),
      snapshot: parseLessonRevisionSnapshot(this.parseJson(row['snapshot'])),
    } : null;
  }

  private async findPublished(table: 'courses' | 'lessons', entityType: 'course' | 'lesson', entityId: string): Promise<Row | null> {
    const result = await this.db.query<Row>(
      `SELECT revision.revision_public_id, revision.revision_number, revision.snapshot
         FROM content.${table} root
         JOIN content.content_revisions revision ON revision.id = root.published_revision_id
        WHERE root.public_id = $1
          AND root.status = 'published'
          AND revision.entity_type = $2
          AND revision.entity_id = root.public_id
          AND revision.status = 'published'`,
      [entityId, entityType],
    );
    return result.rows[0] ?? null;
  }

  private parseJson(value: unknown): unknown {
    return typeof value === 'string' ? JSON.parse(value) : value;
  }

  private async transitionCourseRevision(input: TransitionCourseRevisionInput, from: 'draft', to: 'pending_review', actionKey: string): Promise<void> {
    await this.withLifecycleReceipt(input, 'course', 'course.submit', {}, async (executor) => {
      const changed = await executor.query(
        `UPDATE content.content_revisions SET status=$1, lock_version=lock_version+1, updated_at=now()
          WHERE revision_public_id=$2 AND entity_type='course' AND entity_id=$3 AND status=$4 AND lock_version=$5`,
        [to, input.revisionId, input.courseId, from, input.expectedLockVersion],
      );
      if (changed.rowCount !== 1) throw new Error('版本不存在、状态非法或已被其他操作更新');
      await input.audit.recordSuccessfulActionInTransaction(executor, {
        operatorId: input.operatorId, actionKey, target: { domain: 'content', type: 'course', id: input.courseId },
        requestContext: { requestId: input.requestId, ipAddress: input.ipAddress }, details: { revision_id: input.revisionId },
      });
    });
  }

  private async transitionLessonRevision(input: TransitionLessonRevisionInput, from: 'draft', to: 'pending_review', actionKey: string): Promise<void> {
    await this.withLifecycleReceipt(input, 'lesson', 'lesson.submit', {}, async (executor) => {
      const changed = await executor.query(
        `UPDATE content.content_revisions SET status=$1, lock_version=lock_version+1, updated_at=now()
          WHERE revision_public_id=$2 AND entity_type='lesson' AND entity_id=$3 AND status=$4 AND lock_version=$5`,
        [to, input.revisionId, input.lessonId, from, input.expectedLockVersion],
      );
      if (changed.rowCount !== 1) throw new Error('版本不存在、状态非法或已被其他操作更新');
      await input.audit.recordSuccessfulActionInTransaction(executor, {
        operatorId: input.operatorId, actionKey, target: { domain: 'content', type: 'lesson', id: input.lessonId },
        requestContext: { requestId: input.requestId, ipAddress: input.ipAddress }, details: { revision_id: input.revisionId },
      });
    });
  }

  private async withLifecycleReceipt(
    input: TransitionCourseRevisionInput | TransitionLessonRevisionInput,
    aggregateType: 'course' | 'lesson',
    command: 'course.submit' | 'course.review' | 'course.publish' | 'lesson.submit' | 'lesson.review' | 'lesson.publish',
    extra: Record<string, unknown>,
    work: (executor: DatabaseExecutor) => Promise<void>,
  ): Promise<void> {
    if (!input.idempotencyKey) return this.inTransaction(work);
    const aggregateId = aggregateType === 'course'
      ? (input as TransitionCourseRevisionInput).courseId
      : (input as TransitionLessonRevisionInput).lessonId;
    const fingerprint = createHash('sha256').update(JSON.stringify({ aggregateId, revisionId: input.revisionId, expectedLockVersion: input.expectedLockVersion, ...extra })).digest('hex');
    await this.inTransaction(async (executor) => {
      const inserted = await executor.query<Row>(
        `INSERT INTO content.curriculum_command_receipts (operator_id, aggregate_type, aggregate_id, command, idempotency_key, request_fingerprint, response_payload)
         VALUES ($1, $2, $3, $4, $5, $6, '{}'::jsonb)
         ON CONFLICT (operator_id, aggregate_type, aggregate_id, command, idempotency_key) DO NOTHING RETURNING id`,
        [input.operatorId, aggregateType, aggregateId, command, input.idempotencyKey, fingerprint],
      );
      if (!inserted.rows[0]) {
        const existing = await executor.query<Row>(
          `SELECT request_fingerprint FROM content.curriculum_command_receipts WHERE operator_id=$1 AND aggregate_type=$2 AND aggregate_id=$3 AND command=$4 AND idempotency_key=$5 FOR UPDATE`,
          [input.operatorId, aggregateType, aggregateId, command, input.idempotencyKey],
        );
        if (existing.rows[0]?.['request_fingerprint'] !== fingerprint) throw new AppError({ code: CONFLICT, message: 'Idempotency key request conflict', httpStatus: 409 });
        return;
      }
      await work(executor);
      await executor.query(`UPDATE content.curriculum_command_receipts SET response_payload=$1::jsonb, updated_at=now() WHERE id=$2`, [JSON.stringify({ aggregateId, revisionId: input.revisionId, command }), inserted.rows[0]['id']]);
    });
  }

  private async assertPublishedLessonPins(executor: DatabaseExecutor, snapshot: CourseRevisionSnapshot, courseId: string): Promise<void> {
    const pins = snapshot.units.flatMap((unit) => unit.lessons.map((lesson) => ({ ...lesson, unitSortOrder: unit.sortOrder })));
    const ids = pins.map((lesson) => lesson.revisionId);
    if (!ids.length) return;
    const valid = await executor.query<Row>(
      `SELECT revision.revision_public_id, revision.entity_id, course.public_id AS course_id, unit.sort_order AS unit_sort_order
         FROM content.content_revisions revision
         JOIN content.lessons lesson ON lesson.public_id=revision.entity_id
         JOIN content.units unit ON unit.id=lesson.unit_id
         JOIN content.courses course ON course.id=unit.course_id
        WHERE revision.revision_public_id = ANY($1::uuid[]) AND revision.entity_type='lesson' AND revision.status='published'`,
      [ids],
    );
    const referenceByRevision = new Map(valid.rows.map((row) => [String(row['revision_public_id']), { lessonId: String(row['entity_id']), courseId: String(row['course_id']), unitSortOrder: Number(row['unit_sort_order']) }]));
    if (referenceByRevision.size !== new Set(ids).size || pins.some((pin) => {
      const resolved = referenceByRevision.get(pin.revisionId);
      return !resolved || resolved.lessonId !== pin.lessonId || resolved.courseId !== courseId || resolved.unitSortOrder !== pin.unitSortOrder;
    })) {
      throw new Error('课程引用了未发布、不匹配或不属于该单元的课节版本');
    }
  }

  private async assertPublishedLessonItemPins(executor: DatabaseExecutor, snapshot: LessonRevisionSnapshot): Promise<void> {
    const pins = snapshot.sections.flatMap((section) => section.items);
    if (!pins.length) return;
    const ids = pins.map((item) => item.revisionId);
    const rows = await executor.query<Row>(
      `SELECT revision_public_id, entity_id, entity_type FROM content.content_revisions
        WHERE revision_public_id=ANY($1::uuid[]) AND status='published' AND entity_type IN ('content', 'exercise')`,
      [ids],
    );
    const referenceByRevision = new Map(rows.rows.map((row) => [String(row['revision_public_id']), { entityId: String(row['entity_id']), entityType: String(row['entity_type']) }]));
    if (referenceByRevision.size !== new Set(ids).size || pins.some((pin) => {
      const resolved = referenceByRevision.get(pin.revisionId);
      return !resolved || resolved.entityId !== pin.entityId || resolved.entityType !== pin.itemType;
    })) throw new Error('课节引用了未发布或不匹配的内容版本');
  }

  private inTransaction<T>(work: (executor: DatabaseExecutor) => Promise<T>): Promise<T> {
    if (!this.transactions) throw new Error('课程写操作需要事务管理器');
    return this.transactions.run(work);
  }
}
