import type {
  CompositionItem,
  ContentLanguage,
  StructuredContentType,
} from '../../domain/language-structure.js';
import type {
  StructuredContent,
  StructuredContentRevision,
} from '../../domain/structured-content.js';

export interface ManagedStructuredContentView {
  id: string;
  language: ContentLanguage;
  contentType: StructuredContentType;
  status: string;
  revisionId: string | null;
  revisionNumber: number | null;
  revisionStatus: string | null;
  lockVersion: number | null;
  snapshot: Record<string, unknown> | null;
}

export interface StructuredRevisionView {
  revisionId: string;
  revisionNumber: number;
  status: string;
  snapshot: Record<string, unknown>;
  reviewRemark: string | null;
  reviewedAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
}

export interface ContentReferenceView {
  contentId: string;
  contentType: StructuredContentType;
  position: number | null;
}

export interface PublishedDictionaryWordView {
  id: string;
  language: ContentLanguage;
  revisionId: string;
  display: string;
  romanization: string | null;
  meanings?: readonly { language: ContentLanguage; wordClass: string | null; definition: string; senseOrder: number }[];
  examples?: readonly { sentenceId: string; display: string; romanization: string | null; sortOrder: number }[];
  equivalents?: readonly { targetContentId: string; display: string; romanization: string | null; relationType: string; confidence: number | null; isPrimary: boolean }[];
  relations?: readonly { targetContentId: string; display: string; romanization: string | null; relationType: string; sortOrder: number }[];
  tags?: readonly { code: string; name: string }[];
  /** Internal ordering metadata; HTTP routes deliberately do not serialize it. */
  searchOrder?: { tier: number; similarity: number };
}

export interface ContentIdempotencyRecord {
  requestHash: string;
  response: Record<string, unknown>;
}

export interface StructuredContentRepository {
  list(language: ContentLanguage, contentType: StructuredContentType): Promise<ManagedStructuredContentView[]>;
  listRevisions(contentId: string): Promise<StructuredRevisionView[]>;
  listReferences(contentId: string): Promise<ContentReferenceView[]>;
  findContent(id: string): Promise<StructuredContent | null>;
  findRevision(revisionId: string): Promise<StructuredContentRevision | null>;
  findActiveRevision(contentId: string): Promise<StructuredContentRevision | null>;
  findPublishedRevision(contentId: string): Promise<StructuredContentRevision | null>;
  resolveComposition(items: readonly { contentId: string; position: number }[]): Promise<CompositionItem[]>;
  findPublishedDictionaryWord(language: ContentLanguage, query: string): Promise<PublishedDictionaryWordView | null>;
  findPublishedDictionaryWordById(contentId: string): Promise<PublishedDictionaryWordView | null>;
  searchPublishedDictionaryWords(
    language: ContentLanguage, query: string, limit: number,
    after?: { tier: number; similarity: number; display: string; id: string },
  ): Promise<PublishedDictionaryWordView[]>;
  findIdempotencyRecord(operatorId: string, idempotencyKey: string): Promise<ContentIdempotencyRecord | null>;
  saveIdempotencyRecord(operatorId: string, idempotencyKey: string, requestHash: string, response: Record<string, unknown>): Promise<void>;
  saveNew(content: StructuredContent, revision: StructuredContentRevision): Promise<void>;
  saveRevision(revision: StructuredContentRevision): Promise<void>;
  publishAtomic(
    content: StructuredContent,
    targetRevision: StructuredContentRevision,
    previousPublishedRevision: StructuredContentRevision | null,
  ): Promise<void>;
}
