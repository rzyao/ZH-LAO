import { z } from 'zod'

export type ContentLanguageCode = 'zh' | 'lo'
export type StructuredContentType =
  | 'zh_pinyin_element' | 'zh_syllable' | 'zh_hanzi' | 'zh_word' | 'zh_sentence'
  | 'lo_letter' | 'lo_syllable' | 'lo_word' | 'lo_sentence'

export type FieldDefinition = Readonly<{
  key: string
  label: string
  kind: 'text' | 'number' | 'select'
  required?: boolean
  options?: readonly Readonly<{ value: string; label: string }>[]
  defaultValue?: string | number
}>

export type ContentCategoryConfig = Readonly<{
  contentType: StructuredContentType
  languageCode: ContentLanguageCode
  languageLabel: '中文' | '老挝语'
  categoryLabel: string
  description: string
  testId: string
  apiPath: string
  permissionResource: string
  displayField: string
  fields: readonly FieldDefinition[]
  dependencyType?: StructuredContentType
  dependencyLabel?: string
}>

const difficulty: FieldDefinition = { key: 'difficultyLevel', label: '难度等级', kind: 'number', defaultValue: 1 }

export const CONTENT_CATEGORY_CONFIGS: Readonly<Record<StructuredContentType, ContentCategoryConfig>> = {
  zh_pinyin_element: {
    contentType: 'zh_pinyin_element', languageCode: 'zh', languageLabel: '中文', categoryLabel: '拼音',
    description: '维护组成中文音节的拼音基础元素。', testId: 'content-zh-pinyin-page', apiPath: 'zh/pinyin-elements',
    permissionResource: 'zh_pinyin_elements', displayField: 'displayForm',
    fields: [
      { key: 'elementType', label: '元素类型', kind: 'select', required: true, defaultValue: 'initial', options: [
        { value: 'initial', label: '声母' }, { value: 'final', label: '韵母' }, { value: 'tone_mark', label: '声调标记' },
        { value: 'separator', label: '分隔符' }, { value: 'other', label: '其他' },
      ] },
      { key: 'value', label: '规范值', kind: 'text', required: true },
      { key: 'displayForm', label: '展示形式', kind: 'text', required: true },
      { key: 'sortOrder', label: '排序号', kind: 'number', defaultValue: 0 },
    ],
  },
  zh_syllable: {
    contentType: 'zh_syllable', languageCode: 'zh', languageLabel: '中文', categoryLabel: '中文音节',
    description: '维护由拼音元素按顺序组成的中文音节；本页中的音节即发音知识。', testId: 'content-zh-syllables-page', apiPath: 'zh/syllables',
    permissionResource: 'zh_syllables', displayField: 'displayForm', dependencyType: 'zh_pinyin_element', dependencyLabel: '拼音元素',
    fields: [{ key: 'baseForm', label: '无调形式', kind: 'text', required: true }, { key: 'tone', label: '声调（1—5）', kind: 'number', required: true, defaultValue: 1 }, { key: 'displayForm', label: '展示形式', kind: 'text', required: true }],
  },
  zh_hanzi: {
    contentType: 'zh_hanzi', languageCode: 'zh', languageLabel: '中文', categoryLabel: '汉字',
    description: '维护汉字及其一个或多个中文音节，第一项作为主要读音。', testId: 'content-zh-hanzi-page', apiPath: 'zh/hanzi',
    permissionResource: 'zh_hanzi', displayField: 'character', dependencyType: 'zh_syllable', dependencyLabel: '中文音节',
    fields: [{ key: 'character', label: '简体汉字', kind: 'text', required: true }, { key: 'traditionalCharacter', label: '繁体汉字', kind: 'text' }, { key: 'strokeCount', label: '笔画数', kind: 'number' }, { key: 'radical', label: '部首', kind: 'text' }],
  },
  zh_word: {
    contentType: 'zh_word', languageCode: 'zh', languageLabel: '中文', categoryLabel: '词语',
    description: '维护中文词语及按位置排列的汉字组成。', testId: 'content-zh-words-page', apiPath: 'zh/words',
    permissionResource: 'zh_words', displayField: 'simplified', dependencyType: 'zh_hanzi', dependencyLabel: '汉字',
    fields: [{ key: 'simplified', label: '简体词语', kind: 'text', required: true }, { key: 'traditional', label: '繁体词语', kind: 'text' }, { key: 'pinyinText', label: '拼音文本', kind: 'text' }, { key: 'wordClass', label: '词性', kind: 'text' }, difficulty],
  },
  zh_sentence: {
    contentType: 'zh_sentence', languageCode: 'zh', languageLabel: '中文', categoryLabel: '句子',
    description: '维护中文句子及按位置排列的词语引用。', testId: 'content-zh-sentences-page', apiPath: 'zh/sentences',
    permissionResource: 'zh_sentences', displayField: 'text', dependencyType: 'zh_word', dependencyLabel: '中文词语',
    fields: [{ key: 'text', label: '句子正文', kind: 'text', required: true }, { key: 'pinyinText', label: '拼音文本', kind: 'text' }, difficulty],
  },
  lo_letter: {
    contentType: 'lo_letter', languageCode: 'lo', languageLabel: '老挝语', categoryLabel: '字母',
    description: '维护老挝语字母、声调符号及其他正字法标记。', testId: 'content-lo-letters-page', apiPath: 'lo/letters',
    permissionResource: 'lo_letters', displayField: 'character',
    fields: [
      { key: 'character', label: '字符', kind: 'text', required: true },
      { key: 'letterType', label: '字母类型', kind: 'select', required: true, defaultValue: 'consonant', options: [
        { value: 'consonant', label: '辅音' }, { value: 'vowel', label: '元音' }, { value: 'tone_mark', label: '声调符号' }, { value: 'other', label: '其他标记' },
      ] },
      { key: 'letterClass', label: '字母分类', kind: 'text' }, { key: 'name', label: '名称', kind: 'text' },
      { key: 'romanization', label: '转写', kind: 'text' }, { key: 'sortOrder', label: '排序号', kind: 'number', defaultValue: 0 },
    ],
  },
  lo_syllable: {
    contentType: 'lo_syllable', languageCode: 'lo', languageLabel: '老挝语', categoryLabel: '音节',
    description: '维护由老挝语字母按顺序组成的音节。', testId: 'content-lo-syllables-page', apiPath: 'lo/syllables',
    permissionResource: 'lo_syllables', displayField: 'text', dependencyType: 'lo_letter', dependencyLabel: '老挝语字母',
    fields: [{ key: 'text', label: '音节', kind: 'text', required: true }, { key: 'romanization', label: '转写', kind: 'text' }, { key: 'tone', label: '声调', kind: 'number' }, { key: 'pronunciationKey', label: '发音键', kind: 'text' }, difficulty],
  },
  lo_word: {
    contentType: 'lo_word', languageCode: 'lo', languageLabel: '老挝语', categoryLabel: '词语',
    description: '维护老挝语词语及按位置排列的音节组成。', testId: 'content-lo-words-page', apiPath: 'lo/words',
    permissionResource: 'lo_words', displayField: 'text', dependencyType: 'lo_syllable', dependencyLabel: '老挝语音节',
    fields: [{ key: 'text', label: '词语', kind: 'text', required: true }, { key: 'romanization', label: '转写', kind: 'text' }, { key: 'wordClass', label: '词性', kind: 'text' }, difficulty],
  },
  lo_sentence: {
    contentType: 'lo_sentence', languageCode: 'lo', languageLabel: '老挝语', categoryLabel: '句子',
    description: '维护老挝语句子及按位置排列的词语引用。', testId: 'content-lo-sentences-page', apiPath: 'lo/sentences',
    permissionResource: 'lo_sentences', displayField: 'text', dependencyType: 'lo_word', dependencyLabel: '老挝语词语',
    fields: [{ key: 'text', label: '句子正文', kind: 'text', required: true }, { key: 'romanization', label: '转写', kind: 'text' }, difficulty],
  },
}

export interface ManagedStructuredContent {
  id: string
  language: ContentLanguageCode
  contentType: StructuredContentType
  status: string
  revisionId: string | null
  revisionNumber: number | null
  revisionStatus: 'draft' | 'pending_review' | 'approved' | 'published' | 'rejected' | 'superseded' | null
  lockVersion: number | null
  snapshot: { fields: Record<string, unknown>; composition: Array<{ contentId: string; position: number; role?: string; surfaceForm?: string }> } | null
}

export interface ManagedStructuredContentList { items: ManagedStructuredContent[]; total: number }
export interface StructuredRevisionItem { revisionId: string; revisionNumber: number; status: string; snapshot: { fields: Record<string, unknown>; composition: Array<{ contentId: string; position: number }> }; reviewRemark: string | null; reviewedAt: string | null; publishedAt: string | null; createdAt: string }
export interface ContentReferenceItem { contentId: string; contentType: StructuredContentType; position: number | null }

export const LaoLetterTypeSchema = z.enum(['consonant', 'vowel', 'tone_mark', 'other'])
export const LaoLetterContentStatusSchema = z.enum(['active', 'disabled', 'archived'])
export const LaoLetterRevisionStatusSchema = z.enum(['draft', 'pending_review', 'approved', 'rejected', 'none'])
export const LaoLetterSortSchema = z.enum(['sort_order', 'character', 'name', 'romanization', 'updated_at'])
export const LaoLetterOrderSchema = z.enum(['asc', 'desc'])
export const LaoLetterBatchActionSchema = z.enum(['submit_review', 'approve', 'reject', 'publish', 'archive'])

const commaSeparated = <const Values extends readonly [string, ...string[]]>(values: Values) => z.union([
  z.string(),
  z.array(z.string()),
]).transform((value): Values[number][] => {
  const entries = typeof value === 'string' ? value.split(',') : value
  return z.array(z.enum(values)).parse(entries)
}).transform((values) => [...new Set(values)].sort((left, right) => left.localeCompare(right, 'en')))

const normalizedSearchText = z.string().max(128).transform((value) => value.normalize('NFC').trim())

export const LaoLetterSearchSchema = z.object({
  q: normalizedSearchText.optional(),
  letter_type: commaSeparated(['consonant', 'vowel', 'tone_mark', 'other']).default([]),
  letter_class: commaSeparated(['cons_low', 'cons_middle', 'cons_high']).default([]),
  content_status: commaSeparated(['active', 'disabled', 'archived']).default([]),
  revision_status: commaSeparated(['draft', 'pending_review', 'approved', 'rejected', 'none']).default([]),
  sort: LaoLetterSortSchema.default('sort_order'),
  order: LaoLetterOrderSchema.default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(500).default(50),
}).strict().transform((value) => ({
  ...(value.q ? { q: value.q } : {}),
  letter_type: value.letter_type,
  letter_class: value.letter_class,
  content_status: value.content_status,
  revision_status: value.revision_status,
  sort: value.sort,
  order: value.order,
  page: value.page,
  page_size: value.page_size,
}))

export type LaoLetterSearch = z.output<typeof LaoLetterSearchSchema>
export type LaoLetterSearchInput = Readonly<{
  q?: string
  letter_type?: readonly string[] | string
  letter_class?: readonly string[] | string
  content_status?: readonly string[] | string
  revision_status?: readonly string[] | string
  sort?: z.infer<typeof LaoLetterSortSchema>
  order?: z.infer<typeof LaoLetterOrderSchema>
  page?: number | string
  page_size?: number | string
}>

export const LaoLetterListItemSchema = z.object({
  content_id: z.uuid(),
  character: z.string().min(1).max(16),
  letter_type: LaoLetterTypeSchema,
  letter_class: z.string().nullable(),
  name: z.string().nullable(),
  romanization: z.string().nullable(),
  sort_order: z.number().int().nullable(),
  content_status: LaoLetterContentStatusSchema,
  working_revision_id: z.uuid().nullable(),
  working_revision_status: LaoLetterRevisionStatusSchema.exclude(['none']).nullable(),
  lock_version: z.number().int().min(0).nullable(),
  updated_at: z.iso.datetime({ offset: true }),
  available_actions: z.array(LaoLetterBatchActionSchema),
}).strict()

export const LaoLetterListDataSchema = z.object({
  items: z.array(LaoLetterListItemSchema),
  page: z.number().int().min(1),
  page_size: z.number().int().min(1).max(500),
  total: z.number().int().min(0),
  batch_actions: z.array(LaoLetterBatchActionSchema),
}).strict()

export const LaoLetterSelectionQuerySchema = z.object({
  q: normalizedSearchText.optional(),
  letter_type: z.array(LaoLetterTypeSchema),
  letter_class: z.array(z.enum(['cons_low', 'cons_middle', 'cons_high'])),
  content_status: z.array(LaoLetterContentStatusSchema),
  revision_status: z.array(LaoLetterRevisionStatusSchema),
  sort: LaoLetterSortSchema,
  order: LaoLetterOrderSchema,
}).strict()

export const LaoLetterSelectionPreviewSchema = z.object({
  query: LaoLetterSelectionQuerySchema,
  expected_count: z.number().int().min(0),
  selection_hash: z.string().regex(/^[a-f0-9]{64}$/u),
}).strict()

export const LaoLetterBatchTaskStatusSchema = z.enum(['queued', 'running', 'completed', 'completed_with_issues', 'failed'])
export const LaoLetterBatchItemStatusSchema = z.enum(['queued', 'running', 'succeeded', 'failed', 'skipped'])
export const LaoLetterBatchTaskSummarySchema = z.object({
  task_id: z.uuid(),
  action: LaoLetterBatchActionSchema,
  selection_mode: z.enum(['explicit_ids', 'query_all']),
  status: LaoLetterBatchTaskStatusSchema,
  target_count: z.number().int().positive(),
  processed_count: z.number().int().min(0),
  succeeded_count: z.number().int().min(0),
  failed_count: z.number().int().min(0),
  skipped_count: z.number().int().min(0),
  last_error_code: z.string().nullable().optional(),
  created_at: z.iso.datetime({ offset: true }),
  started_at: z.iso.datetime({ offset: true }).nullable().optional(),
  completed_at: z.iso.datetime({ offset: true }).nullable().optional(),
}).strict()
export const LaoLetterBatchTaskListSchema = z.object({
  items: z.array(LaoLetterBatchTaskSummarySchema),
  page: z.number().int().positive(),
  page_size: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
}).strict()
export const LaoLetterBatchTaskItemSchema = z.object({
  item_no: z.number().int().positive(),
  content_id: z.uuid(),
  revision_id: z.uuid().nullable().optional(),
  status: LaoLetterBatchItemStatusSchema,
  error_code: z.string().nullable().optional(),
  error_message: z.string().nullable().optional(),
  retry_count: z.number().int().min(0),
  completed_at: z.iso.datetime({ offset: true }).nullable().optional(),
}).strict()
export const LaoLetterBatchTaskDetailSchema = z.object({
  task: LaoLetterBatchTaskSummarySchema,
  items: z.array(LaoLetterBatchTaskItemSchema),
  page: z.number().int().positive(),
  page_size: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
}).strict()

export type LaoLetterListItem = z.infer<typeof LaoLetterListItemSchema>
export type LaoLetterListData = z.infer<typeof LaoLetterListDataSchema>
export type LaoLetterSelectionQuery = z.infer<typeof LaoLetterSelectionQuerySchema>
export type LaoLetterSelectionPreview = z.infer<typeof LaoLetterSelectionPreviewSchema>
export type LaoLetterBatchTaskSummary = z.infer<typeof LaoLetterBatchTaskSummarySchema>
export type LaoLetterBatchTaskList = z.infer<typeof LaoLetterBatchTaskListSchema>
export type LaoLetterBatchTaskDetail = z.infer<typeof LaoLetterBatchTaskDetailSchema>
export type LaoLetterBatchItemStatus = z.infer<typeof LaoLetterBatchItemStatusSchema>

export function normalizeLaoLetterSearch(input: LaoLetterSearchInput): LaoLetterSearch {
  return LaoLetterSearchSchema.parse(input)
}

export function laoLetterSelectionQuery(input: LaoLetterSearchInput): LaoLetterSelectionQuery {
  const query = normalizeLaoLetterSearch(input)
  return {
    ...(query.q === undefined ? {} : { q: query.q }),
    letter_type: query.letter_type,
    letter_class: query.letter_class,
    content_status: query.content_status,
    revision_status: query.revision_status,
    sort: query.sort,
    order: query.order,
  }
}
