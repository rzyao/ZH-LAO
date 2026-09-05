import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';
import type { DatabaseExecutor } from '../../../src/database/executor.js';
import { buildApp } from '../../../src/bootstrap/build-app.js';
import { registerContentRoutes } from '../../../src/modules/content/http/composition.js';

const courseId = '00000000-0000-4000-8000-000000000011';
const revisionId = '00000000-0000-4000-8000-000000000012';

describe('Curriculum admin routes', () => {
  it('enforces curriculum permissions and sends lifecycle commands with UUIDs and lock versions', async () => {
    const createCourseDraft = vi.fn().mockResolvedValue({ courseId, revisionId, lockVersion: 0 });
    const createLessonDraft = vi.fn().mockResolvedValue({ lessonId: '00000000-0000-4000-8000-000000000013', revisionId: '00000000-0000-4000-8000-000000000014', lockVersion: 0 });
    const replaceCourseStructure = vi.fn().mockResolvedValue({ lockVersion: 1, updatedAt: '2026-09-05T00:00:00.000Z' });
    const submitCourseRevision = vi.fn().mockResolvedValue(undefined);
    const reviewCourseRevision = vi.fn().mockResolvedValue(undefined);
    const publishCourseAtomic = vi.fn().mockResolvedValue(undefined);
    const submitLessonRevision = vi.fn().mockResolvedValue(undefined);
    const reviewLessonRevision = vi.fn().mockResolvedValue(undefined);
    const publishLessonAtomic = vi.fn().mockResolvedValue(undefined);
    const permissions: string[] = [];
    const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
    await registerContentRoutes(app, {
      contentRepository: {} as never,
      curriculumRepository: {
        listPublishedCourses: async () => [], listManagedCourses: async () => [{ id: courseId, learningLanguage: 'zh' as const, title: '课程', status: 'draft' as const, sortOrder: 0, publishedRevisionId: null, workingRevisionId: revisionId, workingRevisionStatus: 'draft' as const }], getManagedCourseDetail: async () => ({ id: courseId, learningLanguage: 'zh' as const, title: '课程', status: 'draft' as const, sortOrder: 0, publishedRevisionId: null, workingRevisionId: revisionId, workingRevisionStatus: 'draft' as const, workingSnapshot: { title: '课程', sortOrder: 0, units: [] }, publishedLessons: [], revisions: [{ id: revisionId, number: 1, status: 'draft' as const, lockVersion: 0, createdAt: '2026-09-05T00:00:00.000Z', reviewedAt: null, reviewRemark: null }] }), getManagedLessonDetail: async (lessonId) => ({ id: lessonId, courseId, unitSortOrder: 1, title: '第一课', description: null, sortOrder: 1, status: 'draft' as const, publishedRevisionId: null, workingRevisionId: '00000000-0000-4000-8000-000000000014', workingRevisionStatus: 'draft' as const, updatedAt: '2026-09-05T00:00:00.000Z', workingSnapshot: { sections: [] }, revisions: [{ id: '00000000-0000-4000-8000-000000000014', number: 1, status: 'draft' as const, lockVersion: 0, createdAt: '2026-09-05T00:00:00.000Z', reviewedAt: null, reviewRemark: null }] }), findPublishedCourse: async () => null, findPublishedLesson: async () => null,
        createCourseDraft, createLessonDraft, submitCourseRevision, reviewCourseRevision, publishCourseAtomic,
        replaceCourseStructure, replaceLessonStructure: async () => ({ lockVersion: 1, updatedAt: '2026-09-05T00:00:00.000Z' }),
        deriveCourseWorking: async () => ({ revisionId: '00000000-0000-4000-8000-000000000015', lockVersion: 0, updatedAt: '2026-09-05T00:00:00.000Z' }),
        deriveLessonWorking: async () => ({ revisionId: '00000000-0000-4000-8000-000000000016', lockVersion: 0, updatedAt: '2026-09-05T00:00:00.000Z' }),
        submitLessonRevision, reviewLessonRevision, publishLessonAtomic,
      },
      authentication: { authenticate: async () => ({ subjectId: '00000000-0000-4000-8000-000000000099' as never }) },
      authorizer: { requirePermission: async (_context, permission) => { permissions.push(permission); return { operatorId: '00000000-0000-4000-8000-000000000098', authSubjectId: 'subject' }; } },
      audit: { recordSuccessfulAction: async () => undefined },
      transactionalAudit: { recordSuccessfulActionInTransaction: async () => undefined },
    });

    const listed = await app.inject({ method: 'GET', url: '/api/v1/admin/content/courses?learningLanguage=zh' });
    expect(listed.json()).toMatchObject({ data: [{ id: courseId, workingRevisionStatus: 'draft' }] });
    const detail = await app.inject({ method: 'GET', url: `/api/v1/admin/content/courses/${courseId}` });
    expect(detail.json()).toMatchObject({ data: { id: courseId, revisions: [{ id: revisionId, lockVersion: 0 }] } });
    const create = await app.inject({ method: 'POST', url: '/api/v1/admin/content/courses', payload: { learningLanguage: 'zh', snapshot: { title: '课程', sortOrder: 0, units: [] } } });
    expect(create.statusCode).toBe(200);
    expect(create.json()).toMatchObject({ data: { courseId, revisionId, lockVersion: 0 } });
    const structure = await app.inject({ method: 'PUT', url: `/api/v1/admin/content/courses/${courseId}/structure`, payload: { revisionId, expectedLockVersion: 0, expectedUpdatedAt: '2026-09-05T00:00:00.000Z', snapshot: { title: '课程', sortOrder: 0, units: [] } } });
    expect(structure.json()).toMatchObject({ data: { lockVersion: 1 } });
    const lesson = await app.inject({ method: 'POST', url: '/api/v1/admin/content/lessons', payload: { courseId, unitSortOrder: 1, title: '第一课', sortOrder: 1, snapshot: { sections: [] } } });
    expect(lesson.json()).toMatchObject({ data: { lessonId: '00000000-0000-4000-8000-000000000013' } });
    const lessonId = '00000000-0000-4000-8000-000000000013';
    const lessonRevisionId = '00000000-0000-4000-8000-000000000014';
    const lessonDetail = await app.inject({ method: 'GET', url: `/api/v1/admin/content/lessons/${lessonId}` });
    expect(lessonDetail.json()).toMatchObject({ data: { id: lessonId, workingSnapshot: { sections: [] } } });
    const lessonStructure = await app.inject({ method: 'PUT', url: `/api/v1/admin/content/lessons/${lessonId}/structure`, payload: { revisionId: lessonRevisionId, expectedLockVersion: 0, expectedUpdatedAt: '2026-09-05T00:00:00.000Z', snapshot: { sections: [] } } });
    expect(lessonStructure.json()).toMatchObject({ data: { lockVersion: 1 } });
    const lessonSubmit = await app.inject({ method: 'POST', url: `/api/v1/admin/content/lessons/${lessonId}/revisions/${lessonRevisionId}/submit`, headers: { 'idempotency-key': 'lesson-submit-1' }, payload: { expectedLockVersion: 0 } });
    const lessonReview = await app.inject({ method: 'POST', url: `/api/v1/admin/content/lessons/${lessonId}/revisions/${lessonRevisionId}/review`, headers: { 'idempotency-key': 'lesson-review-1' }, payload: { expectedLockVersion: 1, action: 'approve' } });
    const lessonPublish = await app.inject({ method: 'POST', url: `/api/v1/admin/content/lessons/${lessonId}/revisions/${lessonRevisionId}/publish`, headers: { 'idempotency-key': 'lesson-publish-1' }, payload: { expectedLockVersion: 2 } });
    expect([lessonSubmit, lessonReview, lessonPublish].map((response) => response.json().code)).toEqual(['OK', 'OK', 'OK']);
    const submit = await app.inject({ method: 'POST', url: `/api/v1/admin/content/courses/${courseId}/revisions/${revisionId}/submit`, headers: { 'idempotency-key': 'course-submit-1' }, payload: { expectedLockVersion: 0 } });
    const review = await app.inject({ method: 'POST', url: `/api/v1/admin/content/courses/${courseId}/revisions/${revisionId}/review`, headers: { 'idempotency-key': 'course-review-1' }, payload: { expectedLockVersion: 1, action: 'approve' } });
    const publish = await app.inject({ method: 'POST', url: `/api/v1/admin/content/courses/${courseId}/revisions/${revisionId}/publish`, headers: { 'idempotency-key': 'course-publish-1' }, payload: { expectedLockVersion: 2 } });
    expect([submit, review, publish].map((response) => response.statusCode)).toEqual([200, 200, 200]);
    expect(permissions).toEqual(['content.curriculum.read', 'content.curriculum.read', 'content.curriculum.write', 'content.curriculum.write', 'content.curriculum.write', 'content.curriculum.read', 'content.curriculum.write', 'content.curriculum.write', 'content.curriculum.publish', 'content.curriculum.publish', 'content.curriculum.write', 'content.curriculum.publish', 'content.curriculum.publish']);
    expect(replaceCourseStructure).toHaveBeenCalledWith(expect.objectContaining({ courseId, revisionId, expectedLockVersion: 0, expectedUpdatedAt: '2026-09-05T00:00:00.000Z' }));
    expect(createLessonDraft).toHaveBeenCalledWith(expect.objectContaining({ courseId, unitSortOrder: 1, title: '第一课' }));
    expect(submitLessonRevision).toHaveBeenCalledWith(expect.objectContaining({ lessonId, revisionId: lessonRevisionId, expectedLockVersion: 0, idempotencyKey: 'lesson-submit-1' }));
    expect(reviewLessonRevision).toHaveBeenCalledWith(expect.objectContaining({ lessonId, revisionId: lessonRevisionId, expectedLockVersion: 1, action: 'approve' }));
    expect(publishLessonAtomic).toHaveBeenCalledWith(expect.objectContaining({ lessonId, revisionId: lessonRevisionId, expectedLockVersion: 2 }));
    expect(submitCourseRevision).toHaveBeenCalledWith(expect.objectContaining({ courseId, revisionId, expectedLockVersion: 0, idempotencyKey: 'course-submit-1' }));
    expect(reviewCourseRevision).toHaveBeenCalledWith(expect.objectContaining({ courseId, revisionId, expectedLockVersion: 1, action: 'approve' }));
    expect(publishCourseAtomic).toHaveBeenCalledWith(expect.objectContaining({ courseId, revisionId, expectedLockVersion: 2 }));
    await app.close();
  });

  it('rejects a review rejection without a reason before mutating the repository', async () => {
    const reviewCourseRevision = vi.fn();
    const app = buildApp({ logger: pino({ level: 'silent' }), database: {} as DatabaseExecutor });
    await registerContentRoutes(app, {
      contentRepository: {} as never,
      curriculumRepository: {
        listPublishedCourses: async () => [], listManagedCourses: async () => [], findPublishedCourse: async () => null, findPublishedLesson: async () => null,
        createCourseDraft: async () => ({ courseId, revisionId, lockVersion: 0 }), submitCourseRevision: async () => undefined,
        reviewCourseRevision, publishCourseAtomic: async () => undefined,
        createLessonDraft: async () => ({ lessonId: '00000000-0000-4000-8000-000000000013', revisionId: '00000000-0000-4000-8000-000000000014', lockVersion: 0 }),
        replaceCourseStructure: async () => ({ lockVersion: 1, updatedAt: '2026-09-05T00:00:00.000Z' }), replaceLessonStructure: async () => ({ lockVersion: 1, updatedAt: '2026-09-05T00:00:00.000Z' }),
        deriveCourseWorking: async () => ({ revisionId: '00000000-0000-4000-8000-000000000015', lockVersion: 0, updatedAt: '2026-09-05T00:00:00.000Z' }),
        deriveLessonWorking: async () => ({ revisionId: '00000000-0000-4000-8000-000000000016', lockVersion: 0, updatedAt: '2026-09-05T00:00:00.000Z' }),
        submitLessonRevision: async () => undefined, reviewLessonRevision: async () => undefined, publishLessonAtomic: async () => undefined,
      },
      authentication: { authenticate: async () => ({ subjectId: '00000000-0000-4000-8000-000000000099' as never }) },
      authorizer: { requirePermission: async () => ({ operatorId: '00000000-0000-4000-8000-000000000098', authSubjectId: 'subject' }) },
      audit: { recordSuccessfulAction: async () => undefined },
      transactionalAudit: { recordSuccessfulActionInTransaction: async () => undefined },
    });
    const response = await app.inject({ method: 'POST', url: `/api/v1/admin/content/courses/${courseId}/revisions/${revisionId}/review`, payload: { expectedLockVersion: 1, action: 'reject' } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(reviewCourseRevision).not.toHaveBeenCalled();
    await app.close();
  });
});
