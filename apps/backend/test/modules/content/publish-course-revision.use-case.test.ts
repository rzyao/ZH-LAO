import { describe, expect, it, vi } from 'vitest';
import { PublishCourseRevisionUseCase } from '../../../src/modules/content/application/use-cases/publish-course-revision.js';

describe('PublishCourseRevisionUseCase', () => {
  it('delegates the complete atomic command to the curriculum repository', async () => {
    const publishCourseAtomic = vi.fn().mockResolvedValue(undefined);
    const useCase = new PublishCourseRevisionUseCase({ publishCourseAtomic } as never);
    const input = {
      courseId: 'c1735e3c-20e7-4122-8d50-561f9d11f661',
      revisionId: '541f4508-2734-4570-86ed-6e501e263f1c',
      expectedLockVersion: 2,
      operatorId: '10818fd3-011a-4c73-8d7e-9ec3a5f7662b',
      audit: {} as never,
    };

    await useCase.execute(input);

    expect(publishCourseAtomic).toHaveBeenCalledWith(input);
  });
});
