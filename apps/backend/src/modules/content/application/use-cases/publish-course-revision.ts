import type { CreateCourseDraftInput, CreateLessonDraftInput, DeriveCourseWorkingInput, DeriveLessonWorkingInput, PublishCourseRevisionInput, ReplaceCourseStructureInput, ReplaceLessonStructureInput, CurriculumRepository, ReviewCourseRevisionInput, ReviewLessonRevisionInput, TransitionCourseRevisionInput, TransitionLessonRevisionInput } from '../ports/curriculum-repository.js';

/**
 * The repository owns the lock, lifecycle transition, root-pointer swap, and
 * in-transaction audit write. Keeping the orchestration here prevents HTTP
 * handlers from composing a partial publication sequence.
 */
export class PublishCourseRevisionUseCase {
  constructor(private readonly repository: CurriculumRepository) {}

  async execute(input: PublishCourseRevisionInput): Promise<void> {
    await this.repository.publishCourseAtomic(input);
  }
}

export class CreateCourseDraftUseCase {
  constructor(private readonly repository: CurriculumRepository) {}
  execute(input: CreateCourseDraftInput): Promise<Readonly<{ courseId: string; revisionId: string; lockVersion: number }>> {
    return this.repository.createCourseDraft(input);
  }
}

export class CreateLessonDraftUseCase {
  constructor(private readonly repository: CurriculumRepository) {}
  execute(input: CreateLessonDraftInput): Promise<Readonly<{ lessonId: string; revisionId: string; lockVersion: number }>> {
    return this.repository.createLessonDraft(input);
  }
}

export class ReplaceCourseStructureUseCase {
  constructor(private readonly repository: CurriculumRepository) {}
  execute(input: ReplaceCourseStructureInput): Promise<Readonly<{ lockVersion: number; updatedAt: string }>> {
    return this.repository.replaceCourseStructure(input)
  }
}

export class ReplaceLessonStructureUseCase {
  constructor(private readonly repository: CurriculumRepository) {}
  execute(input: ReplaceLessonStructureInput): Promise<Readonly<{ lockVersion: number; updatedAt: string }>> {
    return this.repository.replaceLessonStructure(input)
  }
}

export class DeriveCourseWorkingUseCase {
  constructor(private readonly repository: CurriculumRepository) {}
  execute(input: DeriveCourseWorkingInput): Promise<Readonly<{ revisionId: string; lockVersion: number; updatedAt: string }>> {
    return this.repository.deriveCourseWorking(input)
  }
}

export class DeriveLessonWorkingUseCase {
  constructor(private readonly repository: CurriculumRepository) {}
  execute(input: DeriveLessonWorkingInput): Promise<Readonly<{ revisionId: string; lockVersion: number; updatedAt: string }>> {
    return this.repository.deriveLessonWorking(input)
  }
}

export class SubmitCourseRevisionUseCase {
  constructor(private readonly repository: CurriculumRepository) {}
  execute(input: TransitionCourseRevisionInput): Promise<void> { return this.repository.submitCourseRevision(input); }
}

export class ReviewCourseRevisionUseCase {
  constructor(private readonly repository: CurriculumRepository) {}
  execute(input: ReviewCourseRevisionInput): Promise<void> { return this.repository.reviewCourseRevision(input); }
}

export class SubmitLessonRevisionUseCase {
  constructor(private readonly repository: CurriculumRepository) {}
  execute(input: TransitionLessonRevisionInput): Promise<void> { return this.repository.submitLessonRevision(input) }
}

export class ReviewLessonRevisionUseCase {
  constructor(private readonly repository: CurriculumRepository) {}
  execute(input: ReviewLessonRevisionInput): Promise<void> { return this.repository.reviewLessonRevision(input) }
}

export class PublishLessonRevisionUseCase {
  constructor(private readonly repository: CurriculumRepository) {}
  execute(input: TransitionLessonRevisionInput): Promise<void> { return this.repository.publishLessonAtomic(input) }
}
