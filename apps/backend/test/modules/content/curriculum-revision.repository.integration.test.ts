import { randomUUID } from 'node:crypto';
import pg from 'pg';
import pino from 'pino';
import { afterEach, describe, expect, it } from 'vitest';
import { PostgresCurriculumRepository } from '../../../src/modules/content/infrastructure/postgres-curriculum-repository.js';
import { TransactionManager } from '../../../src/database/transaction-manager.js';
import { createTestDatabase, type TestDatabase } from '../../support/test-database.js';

const adminUrl = process.env.ADMIN_DATABASE_URL;
const databases: TestDatabase[] = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.dispose()));
});

describe.skipIf(!adminUrl)('PostgresCurriculumRepository', () => {
  it('reads current course only through its published revision pointer', async () => {
    const database = await createTestDatabase(adminUrl!, 'curriculum-repository');
    databases.push(database);
    const client = new pg.Client({ connectionString: database.url });
    await client.connect();
    try {
      const courseId = randomUUID();
      const publishedRevisionId = randomUUID();
      const draftRevisionId = randomUUID();
      await client.query(`
        INSERT INTO content.content_revisions (
          revision_public_id, entity_type, entity_id, revision_number, status, snapshot, published_at
        ) VALUES ($1, 'course', $2, 1, 'published', $3::jsonb, now())
      `, [publishedRevisionId, courseId, JSON.stringify({ title: '课程', sortOrder: 0, units: [] })]);
      await client.query(`
        INSERT INTO content.content_revisions (
          revision_public_id, entity_type, entity_id, revision_number, status, snapshot
        ) VALUES ($1, 'course', $2, 2, 'draft', $3::jsonb)
      `, [draftRevisionId, courseId, JSON.stringify({ title: '课程', sortOrder: 0, units: [{ title: '未发布单元', sortOrder: 1, lessons: [] }] })]);
      await client.query(`
        INSERT INTO content.courses (public_id, learning_language, title, status, published_revision_id, working_revision_id)
        SELECT $1, 'zh', '课程', 'published', published.id, draft.id
          FROM content.content_revisions published, content.content_revisions draft
         WHERE published.revision_public_id = $2 AND draft.revision_public_id = $3
      `, [courseId, publishedRevisionId, draftRevisionId]);
      await client.query(
        `INSERT INTO content.courses (public_id, learning_language, title, status)
         VALUES ($1, 'zh', '草稿课程', 'draft')`,
        [randomUUID()],
      );

      const repository = new PostgresCurriculumRepository(client);
      const current = await repository.findPublishedCourse(courseId);
      expect(current).toMatchObject({ id: courseId, revisionId: publishedRevisionId, snapshot: { title: '课程', units: [] } });
      expect(current?.revisionId).not.toBe(draftRevisionId);
      expect((await repository.listPublishedCourses('zh')).map((course) => course.id)).toEqual([courseId]);
    } finally {
      await client.end();
    }
  });

  it('publishes an approved Course revision atomically through the root pointer', async () => {
    const database = await createTestDatabase(adminUrl!, 'curriculum-publish');
    databases.push(database);
    const pool = new pg.Pool({ connectionString: database.url });
    try {
      const courseId = randomUUID();
      const revisionId = randomUUID();
      await pool.query(`
        INSERT INTO content.content_revisions (revision_public_id, entity_type, entity_id, revision_number, status, snapshot, lock_version)
        VALUES ($1, 'course', $2, 1, 'approved', $3::jsonb, 0)
      `, [revisionId, courseId, JSON.stringify({ title: '正式课程', sortOrder: 2, units: [] })]);
      await pool.query(`
        INSERT INTO content.courses (public_id, learning_language, title, status, working_revision_id)
        SELECT $1, 'zh', '草稿课程', 'draft', id FROM content.content_revisions WHERE revision_public_id = $2
      `, [courseId, revisionId]);
      let audited = false;
      const repository = new PostgresCurriculumRepository(pool, new TransactionManager(pool, pino({ level: 'silent' })));
      await repository.publishCourseAtomic({
        courseId, revisionId, expectedLockVersion: 0, operatorId: randomUUID(),
        audit: { recordSuccessfulActionInTransaction: async () => { audited = true; } },
      });
      const current = await pool.query(`
        SELECT c.status, c.working_revision_id, r.revision_public_id, r.status AS revision_status
        FROM content.courses c JOIN content.content_revisions r ON r.id = c.published_revision_id
        WHERE c.public_id = $1`, [courseId]);
      expect(current.rows).toEqual([{
        status: 'published', working_revision_id: null, revision_public_id: revisionId, revision_status: 'published',
      }]);
      expect(audited).toBe(true);
    } finally {
      await pool.end();
    }
  });

  it('replays a lifecycle command once and rejects an idempotency-key payload conflict', async () => {
    const database = await createTestDatabase(adminUrl!, 'curriculum-idempotency');
    databases.push(database);
    const pool = new pg.Pool({ connectionString: database.url });
    try {
      const courseId = randomUUID(); const revisionId = randomUUID(); const operatorId = randomUUID();
      await pool.query(`INSERT INTO content.content_revisions (revision_public_id, entity_type, entity_id, revision_number, status, snapshot, lock_version) VALUES ($1, 'course', $2, 1, 'approved', $3::jsonb, 0)`, [revisionId, courseId, JSON.stringify({ title: '幂等课程', sortOrder: 1, units: [] })]);
      await pool.query(`INSERT INTO content.courses (public_id, learning_language, title, status, working_revision_id) SELECT $1, 'zh', '幂等课程', 'draft', id FROM content.content_revisions WHERE revision_public_id=$2`, [courseId, revisionId]);
      let auditCount = 0;
      const repository = new PostgresCurriculumRepository(pool, new TransactionManager(pool, pino({ level: 'silent' })));
      const input = { courseId, revisionId, expectedLockVersion: 0, operatorId, idempotencyKey: 'publish-once', audit: { recordSuccessfulActionInTransaction: async () => { auditCount += 1; } } };
      await repository.publishCourseAtomic(input);
      await repository.publishCourseAtomic(input);
      expect(auditCount).toBe(1);
      await expect(repository.publishCourseAtomic({ ...input, expectedLockVersion: 1 })).rejects.toMatchObject({ code: 'CONFLICT' });
      expect((await pool.query(`SELECT count(*)::int AS count FROM content.curriculum_command_receipts WHERE aggregate_id=$1`, [courseId])).rows[0]?.count).toBe(1);
    } finally { await pool.end(); }
  });

  it('creates, submits, approves, and publishes a course revision with increasing optimistic locks', async () => {
    const database = await createTestDatabase(adminUrl!, 'curriculum-lifecycle');
    databases.push(database);
    const pool = new pg.Pool({ connectionString: database.url });
    try {
      const repository = new PostgresCurriculumRepository(pool, new TransactionManager(pool, pino({ level: 'silent' })));
      const operatorId = randomUUID();
      const actions: string[] = [];
      const audit = { recordSuccessfulActionInTransaction: async (_executor: unknown, input: { actionKey: string }) => { actions.push(input.actionKey); } };
      const created = await repository.createCourseDraft({
        learningLanguage: 'lo', operatorId, audit,
        snapshot: { title: '新课程', subtitle: '基础', sortOrder: 1, units: [{ title: '第一单元', sortOrder: 1, lessons: [] }] },
      });
      const lesson = await repository.createLessonDraft({
        courseId: created.courseId, unitSortOrder: 1, title: '第一课', sortOrder: 1, snapshot: { sections: [] }, operatorId, audit,
      });
      const createdLesson = await pool.query(`SELECT status, working_revision_id FROM content.lessons lesson WHERE lesson.public_id=$1`, [lesson.lessonId]);
      expect(createdLesson.rows[0]).toMatchObject({ status: 'draft' });
      expect(createdLesson.rows[0]?.working_revision_id).not.toBeNull();
      await repository.submitLessonRevision({ lessonId: lesson.lessonId, revisionId: lesson.revisionId, expectedLockVersion: 0, operatorId, audit });
      await repository.reviewLessonRevision({ lessonId: lesson.lessonId, revisionId: lesson.revisionId, expectedLockVersion: 1, action: 'approve', operatorId, audit });
      await repository.publishLessonAtomic({ lessonId: lesson.lessonId, revisionId: lesson.revisionId, expectedLockVersion: 2, operatorId, audit });
      expect(await repository.findPublishedLesson(lesson.lessonId)).toMatchObject({ id: lesson.lessonId, revisionId: lesson.revisionId, snapshot: { sections: [] } });
      const root = await pool.query(`SELECT updated_at FROM content.courses WHERE public_id=$1`, [created.courseId]);
      const replacement = await repository.replaceCourseStructure({
        courseId: created.courseId, revisionId: created.revisionId, expectedLockVersion: 0, expectedUpdatedAt: new Date(String(root.rows[0]?.updated_at)).toISOString(), operatorId, audit,
        snapshot: { title: '新课程', subtitle: '基础', sortOrder: 1, units: [{ title: '第一单元', sortOrder: 1, lessons: [{ lessonId: lesson.lessonId, revisionId: lesson.revisionId, title: '第一课', sortOrder: 1 }] }] },
      });
      expect(replacement.lockVersion).toBe(1);
      await repository.submitCourseRevision({ courseId: created.courseId, revisionId: created.revisionId, expectedLockVersion: 1, operatorId, audit });
      await repository.reviewCourseRevision({ courseId: created.courseId, revisionId: created.revisionId, expectedLockVersion: 2, action: 'approve', operatorId, audit });
      await repository.publishCourseAtomic({ courseId: created.courseId, revisionId: created.revisionId, expectedLockVersion: 3, operatorId, audit });

      expect(await repository.findPublishedCourse(created.courseId)).toMatchObject({
        id: created.courseId, revisionId: created.revisionId, snapshot: { title: '新课程' },
      });
      const publishedRoot = await pool.query(`SELECT updated_at FROM content.courses WHERE public_id=$1`, [created.courseId]);
      const derived = await repository.deriveCourseWorking({ courseId: created.courseId, expectedUpdatedAt: new Date(String(publishedRoot.rows[0]?.updated_at)).toISOString(), operatorId, audit });
      expect(derived.lockVersion).toBe(0);
      expect((await repository.findPublishedCourse(created.courseId))?.revisionId).toBe(created.revisionId);
      expect((await pool.query(`SELECT status FROM content.content_revisions WHERE revision_public_id=$1`, [derived.revisionId])).rows[0]).toEqual({ status: 'draft' });
      const publishedLessonRoot = await pool.query(`SELECT updated_at FROM content.lessons WHERE public_id=$1`, [lesson.lessonId]);
      const derivedLesson = await repository.deriveLessonWorking({ lessonId: lesson.lessonId, expectedUpdatedAt: new Date(String(publishedLessonRoot.rows[0]?.updated_at)).toISOString(), operatorId, audit });
      expect((await repository.findPublishedLesson(lesson.lessonId))?.revisionId).toBe(lesson.revisionId);
      expect((await pool.query(`SELECT status FROM content.content_revisions WHERE revision_public_id=$1`, [derivedLesson.revisionId])).rows[0]).toEqual({ status: 'draft' });
      const units = await pool.query(`SELECT unit.title, unit.sort_order FROM content.units unit JOIN content.courses course ON course.id=unit.course_id WHERE course.public_id=$1`, [created.courseId]);
      expect(units.rows).toEqual([{ title: '第一单元', sort_order: 1 }]);
      expect(actions).toEqual([
        'content.curriculum.create', 'content.curriculum.create_lesson', 'content.curriculum.submit_lesson_review', 'content.curriculum.review_lesson', 'content.curriculum.publish_lesson', 'content.curriculum.replace_structure', 'content.curriculum.submit_review', 'content.curriculum.review', 'content.curriculum.publish', 'content.curriculum.derive_working', 'content.curriculum.derive_lesson_working',
      ]);
    } finally {
      await pool.end();
    }
  });

  it('rolls back a draft creation that pins a lesson revision which is not published', async () => {
    const database = await createTestDatabase(adminUrl!, 'curriculum-invalid-pin');
    databases.push(database);
    const pool = new pg.Pool({ connectionString: database.url });
    try {
      const lessonId = randomUUID();
      const draftLessonRevisionId = randomUUID();
      await pool.query(
        `INSERT INTO content.content_revisions (revision_public_id, entity_type, entity_id, revision_number, status, snapshot)
         VALUES ($1, 'lesson', $2, 1, 'draft', '{"sections": []}'::jsonb)`,
        [draftLessonRevisionId, lessonId],
      );
      const repository = new PostgresCurriculumRepository(pool, new TransactionManager(pool, pino({ level: 'silent' })));
      await expect(repository.createCourseDraft({
        learningLanguage: 'zh', operatorId: randomUUID(), audit: { recordSuccessfulActionInTransaction: async () => undefined },
        snapshot: { title: '不应创建', sortOrder: 0, units: [{ title: '单元', sortOrder: 1, lessons: [{ lessonId, revisionId: draftLessonRevisionId, title: '草稿课节', sortOrder: 1 }] }] },
      })).rejects.toThrow('课程引用了未发布、不匹配或不属于该单元的课节版本');
      const count = await pool.query(`SELECT count(*)::int AS count FROM content.courses WHERE title = '不应创建'`);
      expect(count.rows[0]?.count).toBe(0);
    } finally {
      await pool.end();
    }
  });

  it('rejects a published lesson revision pinned under a different lesson UUID', async () => {
    const database = await createTestDatabase(adminUrl!, 'curriculum-mismatched-pin');
    databases.push(database);
    const pool = new pg.Pool({ connectionString: database.url });
    try {
      const actualLessonId = randomUUID();
      const mismatchedLessonId = randomUUID();
      const publishedRevisionId = randomUUID();
      await pool.query(
        `INSERT INTO content.content_revisions (revision_public_id, entity_type, entity_id, revision_number, status, snapshot, published_at)
         VALUES ($1, 'lesson', $2, 1, 'published', '{"sections": []}'::jsonb, now())`,
        [publishedRevisionId, actualLessonId],
      );
      const repository = new PostgresCurriculumRepository(pool, new TransactionManager(pool, pino({ level: 'silent' })));
      await expect(repository.createCourseDraft({
        learningLanguage: 'zh', operatorId: randomUUID(), audit: { recordSuccessfulActionInTransaction: async () => undefined },
        snapshot: { title: '错误实体绑定', sortOrder: 0, units: [{ title: '单元', sortOrder: 1, lessons: [{ lessonId: mismatchedLessonId, revisionId: publishedRevisionId, title: '错配课节', sortOrder: 1 }] }] },
      })).rejects.toThrow('课程引用了未发布、不匹配或不属于该单元的课节版本');
    } finally {
      await pool.end();
    }
  });

  it('rejects a lesson item whose published content revision belongs to another entity', async () => {
    const database = await createTestDatabase(adminUrl!, 'lesson-mismatched-content-pin');
    databases.push(database);
    const pool = new pg.Pool({ connectionString: database.url });
    try {
      const courseId = randomUUID();
      const revisionId = randomUUID();
      const actualContentId = randomUUID();
      const mismatchedContentId = randomUUID();
      await pool.query(`INSERT INTO content.courses (public_id, learning_language, title) VALUES ($1, 'zh', '课程')`, [courseId]);
      await pool.query(`INSERT INTO content.units (course_id, title, sort_order) SELECT id, '单元', 1 FROM content.courses WHERE public_id=$1`, [courseId]);
      await pool.query(
        `INSERT INTO content.content_revisions (revision_public_id, entity_type, entity_id, revision_number, status, snapshot, published_at)
         VALUES ($1, 'content', $2, 1, 'published', '{}'::jsonb, now())`,
        [revisionId, actualContentId],
      );
      const repository = new PostgresCurriculumRepository(pool, new TransactionManager(pool, pino({ level: 'silent' })));
      await expect(repository.createLessonDraft({
        courseId, unitSortOrder: 1, title: '课节', sortOrder: 1, operatorId: randomUUID(), audit: { recordSuccessfulActionInTransaction: async () => undefined },
        snapshot: { sections: [{ sectionType: 'knowledge', sortOrder: 1, items: [{ itemType: 'content', entityId: mismatchedContentId, revisionId, sortOrder: 1 }] }] },
      })).rejects.toThrow('课节引用了未发布或不匹配的内容版本');
      expect((await pool.query(`SELECT count(*)::int AS count FROM content.lessons WHERE title='课节'`)).rows[0]?.count).toBe(0);
    } finally {
      await pool.end();
    }
  });
});
