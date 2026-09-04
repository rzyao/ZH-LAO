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

export interface StructuredContentRepository {
  list(language: ContentLanguage, contentType: StructuredContentType): Promise<ManagedStructuredContentView[]>;
  listRevisions(contentId: string): Promise<StructuredRevisionView[]>;
  listReferences(contentId: string): Promise<ContentReferenceView[]>;
  findContent(id: string): Promise<StructuredContent | null>;
  findRevision(revisionId: string): Promise<StructuredContentRevision | null>;
  findActiveRevision(contentId: string): Promise<StructuredContentRevision | null>;
  findPublishedRevision(contentId: string): Promise<StructuredContentRevision | null>;
  resolveComposition(items: readonly { contentId: string; position: number }[]): Promise<CompositionItem[]>;
  saveNew(content: StructuredContent, revision: StructuredContentRevision): Promise<void>;
  saveRevision(revision: StructuredContentRevision): Promise<void>;
  publishAtomic(
    content: StructuredContent,
    targetRevision: StructuredContentRevision,
    previousPublishedRevision: StructuredContentRevision | null,
  ): Promise<void>;
}
