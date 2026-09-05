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
  DictionarySnapshotSchema,
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
    const snapshot = parseStructuredContentSnapshot(contentType, snapshotInput);
    await this.validateSnapshotComposition(content, snapshot, 'draft');
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
    const content = await this.requireContent(contentId);
    const snapshot = parseStructuredContentSnapshot(revision.contentType, snapshotInput);
    await this.validateSnapshotComposition(content, snapshot, 'draft');
    revision.update(snapshot, expectedLockVersion);
    await this.repository.saveRevision(revision);
    return { status: 'draft', lockVersion: revision.lockVersion };
  }

  async dictionaryContext(contentId: string): Promise<StructuredContent> {
    const content = await this.repository.findContent(contentId);
    if (!content || (content.contentType !== 'zh_word' && content.contentType !== 'lo_word')) {
      throw new Error('词典 Word 内容不存在');
    }
    return content;
  }

  async replaceDictionarySection(
    contentId: string,
    section: 'meanings' | 'examples' | 'equivalents' | 'relations' | 'tags',
    values: unknown,
    expectedLockVersion: number,
  ): Promise<{ status: 'draft'; lockVersion: number }> {
    return this.replaceDictionarySections(contentId, { [section]: values }, expectedLockVersion);
  }

  async replaceDictionarySections(
    contentId: string,
    sections: Partial<Record<'meanings' | 'examples' | 'equivalents' | 'relations' | 'tags', unknown>>,
    expectedLockVersion: number,
  ): Promise<{ status: 'draft'; lockVersion: number }> {
    await this.dictionaryContext(contentId);
    const revision = await this.repository.findActiveRevision(contentId);
    if (!revision) throw new Error('当前内容没有活动工作版本');
    const dictionary = DictionarySnapshotSchema.parse({
      ...(revision.snapshot.dictionary ?? {}),
      ...sections,
    });
    return this.update(contentId, revision.id, {
      ...revision.snapshot,
      dictionary,
    }, expectedLockVersion);
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
    await this.validateSnapshotComposition(await this.requireContent(contentId), revision.snapshot, 'submit');
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
    await this.validateSnapshotComposition(content, revision.snapshot, 'publish');
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

  private async requireContent(contentId: string): Promise<StructuredContent> {
    const content = await this.repository.findContent(contentId);
    if (!content) throw new Error('内容不存在');
    return content;
  }

  private async validateSnapshotComposition(
    content: StructuredContent,
    snapshot: StructuredContentSnapshot,
    stage: 'draft' | 'submit' | 'publish',
  ): Promise<void> {
    const resolved = await this.repository.resolveComposition(snapshot.composition);
    validateComposition({ parentContentType: content.contentType, stage, items: resolved });
    if (!snapshot.dictionary) return;
    const targets = [
      ...snapshot.dictionary.examples.map((item) => item.sentenceContentId),
      ...snapshot.dictionary.equivalents.map((item) => item.targetContentId),
      ...snapshot.dictionary.relations.map((item) => item.targetContentId),
    ];
    const uniqueTargets = [...new Set(targets)];
    const resolvedTargets = new Map(await Promise.all(uniqueTargets.map(async (id) => [id, await this.repository.findContent(id)] as const)));
    for (const example of snapshot.dictionary.examples) {
      this.assertDictionaryTarget(content, example.sentenceContentId, resolvedTargets.get(example.sentenceContentId), 'example');
      if (example.meaningLanguage && !snapshot.dictionary.meanings.some((meaning) =>
        meaning.language === example.meaningLanguage && meaning.senseOrder === example.meaningSenseOrder,
      )) throw new Error('例句引用的释义不存在');
    }
    for (const equivalent of snapshot.dictionary.equivalents) {
      const target = resolvedTargets.get(equivalent.targetContentId);
      this.assertDictionaryTarget(content, equivalent.targetContentId, target, 'equivalent');
      if (target!.contentType !== 'zh_word' && target!.contentType !== 'lo_word') throw new Error('对应关系目标必须是 Word');
      if (target!.language === content.language) throw new Error('对应关系必须跨语言');
    }
    for (const relation of snapshot.dictionary.relations) {
      const target = resolvedTargets.get(relation.targetContentId);
      this.assertDictionaryTarget(content, relation.targetContentId, target, 'relation');
      if (target!.contentType !== content.contentType || target!.language !== content.language) throw new Error('同语言关系目标类型或语言错误');
    }
    if (stage !== 'draft') {
      for (const targetId of uniqueTargets) {
        const target = resolvedTargets.get(targetId)!;
        if (target.status !== 'active' || !await this.repository.findPublishedRevision(targetId)) {
          throw new Error('词典目标尚未正式发布或不可用');
        }
      }
    }
  }

  private assertDictionaryTarget(
    parent: StructuredContent,
    targetId: string,
    target: StructuredContent | null | undefined,
    kind: 'example' | 'equivalent' | 'relation',
  ): void {
    if (!target) throw new Error('词典目标不存在');
    if (targetId === parent.id) throw new Error('词典关系不允许自引用');
    if (kind === 'example' && target.contentType !== 'zh_sentence' && target.contentType !== 'lo_sentence') {
      throw new Error('例句目标必须是 Sentence');
    }
  }
}
