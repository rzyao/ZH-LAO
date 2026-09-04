import { z } from 'zod';

export const ContentLanguageSchema = z.enum(['zh', 'lo']);
export type ContentLanguage = z.infer<typeof ContentLanguageSchema>;

export const StructuredContentTypeSchema = z.enum([
  'zh_pinyin_element',
  'zh_syllable',
  'zh_hanzi',
  'zh_word',
  'zh_sentence',
  'lo_letter',
  'lo_syllable',
  'lo_word',
  'lo_sentence',
]);
export type StructuredContentType = z.infer<typeof StructuredContentTypeSchema>;

export interface ContentCategoryDefinition {
  language: ContentLanguage;
  contentType: StructuredContentType;
  label: string;
  childContentType: StructuredContentType | null;
  childLabel: string | null;
  permissionResource: string;
}

export const CONTENT_CATEGORY_DEFINITIONS: Readonly<Record<ContentLanguage, readonly ContentCategoryDefinition[]>> = {
  zh: [
    { language: 'zh', contentType: 'zh_pinyin_element', label: '中文拼音元素', childContentType: null, childLabel: null, permissionResource: 'zh_pinyin_elements' },
    { language: 'zh', contentType: 'zh_syllable', label: '中文音节', childContentType: 'zh_pinyin_element', childLabel: '中文拼音元素', permissionResource: 'zh_syllables' },
    { language: 'zh', contentType: 'zh_hanzi', label: '汉字', childContentType: 'zh_syllable', childLabel: '中文音节', permissionResource: 'zh_hanzi' },
    { language: 'zh', contentType: 'zh_word', label: '中文词语', childContentType: 'zh_hanzi', childLabel: '汉字', permissionResource: 'zh_words' },
    { language: 'zh', contentType: 'zh_sentence', label: '中文句子', childContentType: 'zh_word', childLabel: '中文词语', permissionResource: 'zh_sentences' },
  ],
  lo: [
    { language: 'lo', contentType: 'lo_letter', label: '老挝语字母', childContentType: null, childLabel: null, permissionResource: 'lo_letters' },
    { language: 'lo', contentType: 'lo_syllable', label: '老挝语音节', childContentType: 'lo_letter', childLabel: '老挝语字母', permissionResource: 'lo_syllables' },
    { language: 'lo', contentType: 'lo_word', label: '老挝语词语', childContentType: 'lo_syllable', childLabel: '老挝语音节', permissionResource: 'lo_words' },
    { language: 'lo', contentType: 'lo_sentence', label: '老挝语句子', childContentType: 'lo_word', childLabel: '老挝语词语', permissionResource: 'lo_sentences' },
  ],
};

const definitionsByType = new Map<StructuredContentType, ContentCategoryDefinition>(
  [...CONTENT_CATEGORY_DEFINITIONS.zh, ...CONTENT_CATEGORY_DEFINITIONS.lo]
    .map((definition) => [definition.contentType, definition]),
);

export function getContentCategoryDefinition(contentType: StructuredContentType): ContentCategoryDefinition {
  const definition = definitionsByType.get(contentType);
  if (!definition) {
    throw new Error(`未知内容类型：${contentType}`);
  }
  return definition;
}

export interface CompositionItem {
  contentId: string;
  contentType: StructuredContentType;
  position: number;
  publishedRevisionId: string | null;
}

export interface ValidateCompositionInput {
  parentContentType: StructuredContentType;
  stage: 'draft' | 'submit' | 'publish';
  items: readonly CompositionItem[];
}

export function validateComposition(input: ValidateCompositionInput): void {
  const definition = getContentCategoryDefinition(input.parentContentType);

  if (definition.childContentType === null) {
    if (input.items.length > 0) {
      throw new Error(`${definition.label}不允许包含组成项`);
    }
    return;
  }

  if (input.stage !== 'draft' && input.items.length === 0) {
    throw new Error(`${definition.label}的组成项不能为空`);
  }

  const invalidType = input.items.find((item) => item.contentType !== definition.childContentType);
  if (invalidType) {
    throw new Error(`${definition.label}只能引用${definition.childLabel ?? definition.childContentType}`);
  }

  if (input.stage !== 'draft') {
    const positions = input.items.map((item) => item.position).sort((left, right) => left - right);
    const positionsAreContiguous = positions.every((position, index) => position === index + 1);
    if (!positionsAreContiguous) {
      throw new Error('组成位置必须从 1 开始连续排列');
    }

    const unpublishedIds = input.items
      .filter((item) => item.publishedRevisionId === null)
      .map((item) => item.contentId);
    if (unpublishedIds.length > 0) {
      throw new Error(`下级依赖尚未发布：${unpublishedIds.join('、')}`);
    }
  }
}

export const ContentRevisionStatusSchema = z.enum([
  'draft',
  'pending_review',
  'approved',
  'published',
  'rejected',
  'superseded',
]);
export type ContentRevisionStatus = z.infer<typeof ContentRevisionStatusSchema>;

export const ContentRevisionActionSchema = z.enum([
  'submit',
  'approve',
  'reject',
  're_edit',
  'publish',
  'supersede',
]);
export type ContentRevisionAction = z.infer<typeof ContentRevisionActionSchema>;

const revisionTransitions: Readonly<Record<ContentRevisionStatus, Partial<Record<ContentRevisionAction, ContentRevisionStatus>>>> = {
  draft: { submit: 'pending_review' },
  pending_review: { approve: 'approved', reject: 'rejected' },
  approved: { re_edit: 'draft', publish: 'published' },
  published: { supersede: 'superseded' },
  rejected: { re_edit: 'draft' },
  superseded: {},
};

export function validateRevisionTransition(
  currentStatus: ContentRevisionStatus,
  action: ContentRevisionAction,
): ContentRevisionStatus {
  const nextStatus = revisionTransitions[currentStatus][action];
  if (!nextStatus) {
    throw new Error(`不允许的版本状态变更：${currentStatus} → ${action}`);
  }
  return nextStatus;
}
