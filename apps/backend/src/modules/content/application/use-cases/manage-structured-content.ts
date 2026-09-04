import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  StructuredContentTypeSchema,
  getContentCategoryDefinition,
  validateComposition,
  type ContentLanguage,
  type StructuredContentType,
} from '../../domain/language-structure.js';
import {
  StructuredContent,
  StructuredContentRevision,
  parseStructuredContentSnapshot,
  type StructuredContentSnapshot,
} from '../../domain/structured-content.js';
import type { StructuredContentRepository } from '../ports/structured-content-repository.js';

export const StructuredContentCommandSchema = z.object({
  contentType: StructuredContentTypeSchema,
  snapshot: z.unknown(),
}).strict();

export class ManageStructuredContentUseCases {
  constructor(private readonly repository: StructuredContentRepository) {}

  async list(language: ContentLanguage, contentType: StructuredContentType) {
    this.assertLanguage(language, contentType);
    const items = await this.repository.list(language, contentType);
    return { items, total: items.length };
  }

  async history(language: ContentLanguage, contentType: StructuredContentType, contentId: string) {
    this.assertLanguage(language, contentType);
    const content = await this.repository.findContent(contentId);
    if (!content || content.contentType !== contentType) throw new Error('内容不存在');
    const items = await this.repository.listRevisions(contentId);
    return { items, total: items.length };
  }

  async references(language: ContentLanguage, contentType: StructuredContentType, contentId: string) {
    this.assertLanguage(language, contentType);
    const content = await this.repository.findContent(contentId);
    if (!content || content.contentType !== contentType) throw new Error('内容不存在');
    const items = await this.repository.listReferences(contentId);
    return { items, total: items.length };
  }

  async create(
    language: ContentLanguage,
    contentType: StructuredContentType,
    snapshotInput: unknown,
    operatorId: string,
  ): Promise<{ contentId: string; revisionId: string; status: 'draft' }> {
    this.assertLanguage(language, contentType);
    const snapshot = parseStructuredContentSnapshot(contentType, snapshotInput);
    await this.validateSnapshotComposition(contentType, snapshot, 'draft');
    const now = new Date();
    const contentId = randomUUID();
    const revisionId = randomUUID();
    const content = new StructuredContent({
      id: contentId,
      language,
      contentType,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
    const revision = new StructuredContentRevision({
      id: revisionId,
      contentId,
      revisionNumber: 1,
      contentType,
      snapshot,
      status: 'draft',
      createdByOperatorId: operatorId,
      lockVersion: 0,
      createdAt: now,
      updatedAt: now,
    });
    await this.repository.saveNew(content, revision);
    return { contentId, revisionId, status: 'draft' };
  }

  async update(
    contentId: string,
    revisionId: string,
    snapshotInput: unknown,
    expectedLockVersion: number,
  ): Promise<{ status: 'draft'; lockVersion: number }> {
    const revision = await this.requireRevision(contentId, revisionId);
    const snapshot = parseStructuredContentSnapshot(revision.contentType, snapshotInput);
    await this.validateSnapshotComposition(revision.contentType, snapshot, 'draft');
    revision.update(snapshot, expectedLockVersion);
    await this.repository.saveRevision(revision);
    return { status: 'draft', lockVersion: revision.lockVersion };
  }

  async derive(contentId: string, operatorId: string): Promise<{ revisionId: string; status: 'draft' }> {
    if (await this.repository.findActiveRevision(contentId)) {
      throw new Error('当前内容已有活动工作版本');
    }
    const published = await this.repository.findPublishedRevision(contentId);
    if (!published) throw new Error('当前内容没有可派生的正式版本');
    const now = new Date();
    const revision = new StructuredContentRevision({
      id: randomUUID(),
      contentId,
      revisionNumber: published.revisionNumber + 1,
      contentType: published.contentType,
      snapshot: published.snapshot,
      status: 'draft',
      createdByOperatorId: operatorId,
      lockVersion: 0,
      createdAt: now,
      updatedAt: now,
    });
    await this.repository.saveRevision(revision);
    return { revisionId: revision.id, status: 'draft' };
  }

  async submit(contentId: string, revisionId: string): Promise<{ status: 'pending_review' }> {
    const revision = await this.requireRevision(contentId, revisionId);
    await this.validateSnapshotComposition(revision.contentType, revision.snapshot, 'submit');
    revision.submit();
    await this.repository.saveRevision(revision);
    return { status: 'pending_review' };
  }

  async review(
    contentId: string,
    revisionId: string,
    action: 'approve' | 'reject',
    operatorId: string,
    remark?: string,
  ): Promise<{ status: 'approved' | 'rejected' }> {
    const revision = await this.requireRevision(contentId, revisionId);
    if (action === 'approve') revision.approve(operatorId);
    else revision.reject(operatorId, remark ?? '');
    await this.repository.saveRevision(revision);
    return { status: action === 'approve' ? 'approved' : 'rejected' };
  }

  async reEdit(contentId: string, revisionId: string): Promise<{ status: 'draft'; lockVersion: number }> {
    const revision = await this.requireRevision(contentId, revisionId);
    revision.reEdit();
    await this.repository.saveRevision(revision);
    return { status: 'draft', lockVersion: revision.lockVersion };
  }

  async publish(contentId: string, revisionId: string): Promise<{ status: 'published' }> {
    const content = await this.repository.findContent(contentId);
    if (!content) throw new Error('内容不存在');
    const revision = await this.requireRevision(contentId, revisionId);
    await this.validateSnapshotComposition(revision.contentType, revision.snapshot, 'publish');
    const previousPublished = await this.repository.findPublishedRevision(contentId);
    revision.publish();
    if (previousPublished) previousPublished.supersede();
    await this.repository.publishAtomic(content, revision, previousPublished);
    return { status: 'published' };
  }

  private assertLanguage(language: ContentLanguage, contentType: StructuredContentType): void {
    if (getContentCategoryDefinition(contentType).language !== language) {
      throw new Error(`内容语言与类型不匹配：${language}/${contentType}`);
    }
  }

  private async requireRevision(contentId: string, revisionId: string): Promise<StructuredContentRevision> {
    const revision = await this.repository.findRevision(revisionId);
    if (!revision || revision.contentId !== contentId) throw new Error('内容版本不存在');
    return revision;
  }

  private async validateSnapshotComposition(
    contentType: StructuredContentType,
    snapshot: StructuredContentSnapshot,
    stage: 'draft' | 'submit' | 'publish',
  ): Promise<void> {
    const resolved = await this.repository.resolveComposition(snapshot.composition);
    validateComposition({ parentContentType: contentType, stage, items: resolved });
  }
}
