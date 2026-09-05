export const LO_LETTER_TEST_IDS = {
  active: '10000000-0000-4000-8000-000000000001',
  pending: '10000000-0000-4000-8000-000000000002',
  archived: '10000000-0000-4000-8000-000000000003',
  taskActive: '20000000-0000-4000-8000-000000000001',
  taskComplete: '20000000-0000-4000-8000-000000000002',
} as const

export const laoLetterListFixture = {
  items: [
    {
      content_id: LO_LETTER_TEST_IDS.active,
      character: 'ກ',
      letter_type: 'consonant',
      letter_class: 'cons_middle',
      name: 'ko',
      romanization: 'k',
      sort_order: 1,
      content_status: 'active',
      working_revision_id: null,
      working_revision_status: null,
      lock_version: null,
      updated_at: '2026-09-05T01:00:00.000Z',
      available_actions: ['archive'],
    },
    {
      content_id: LO_LETTER_TEST_IDS.pending,
      character: 'ຂ',
      letter_type: 'consonant',
      letter_class: 'cons_high',
      name: 'kho',
      romanization: 'kh',
      sort_order: 2,
      content_status: 'active',
      working_revision_id: '11000000-0000-4000-8000-000000000002',
      working_revision_status: 'pending_review',
      lock_version: 1,
      updated_at: '2026-09-05T01:01:00.000Z',
      available_actions: ['approve', 'reject', 'archive'],
    },
    {
      content_id: LO_LETTER_TEST_IDS.archived,
      character: 'ຄ',
      letter_type: 'consonant',
      letter_class: 'cons_low',
      name: 'kho tam',
      romanization: 'kh',
      sort_order: 3,
      content_status: 'archived',
      working_revision_id: '11000000-0000-4000-8000-000000000003',
      working_revision_status: 'rejected',
      lock_version: 2,
      updated_at: '2026-09-05T01:02:00.000Z',
      available_actions: ['submit_review'],
    },
  ],
  page: 1,
  page_size: 50,
  total: 126,
  batch_actions: ['submit_review', 'approve', 'reject', 'publish', 'archive'],
} as const

export const laoLetterSelectionPreviewFixture = {
  query: {
    q: 'ກ',
    letter_type: ['consonant'],
    letter_class: ['cons_high', 'cons_middle'],
    content_status: ['active'],
    revision_status: ['pending_review'],
    sort: 'sort_order',
    order: 'asc',
  },
  expected_count: 126,
  selection_hash: 'a'.repeat(64),
} as const

export const laoLetterTaskSummaryFixtures = {
  active: {
    task_id: LO_LETTER_TEST_IDS.taskActive,
    action: 'approve',
    selection_mode: 'query_all',
    status: 'running',
    target_count: 126,
    processed_count: 50,
    succeeded_count: 48,
    failed_count: 1,
    skipped_count: 1,
    created_at: '2026-09-05T02:00:00.000Z',
    started_at: '2026-09-05T02:00:01.000Z',
    completed_at: null,
    last_error_code: null,
  },
  completedWithIssues: {
    task_id: LO_LETTER_TEST_IDS.taskComplete,
    action: 'reject',
    selection_mode: 'explicit_ids',
    status: 'completed_with_issues',
    target_count: 3,
    processed_count: 3,
    succeeded_count: 1,
    failed_count: 1,
    skipped_count: 1,
    created_at: '2026-09-05T03:00:00.000Z',
    started_at: '2026-09-05T03:00:01.000Z',
    completed_at: '2026-09-05T03:00:03.000Z',
    last_error_code: null,
  },
} as const

export const laoLetterTaskListFixture = {
  items: [
    laoLetterTaskSummaryFixtures.active,
    laoLetterTaskSummaryFixtures.completedWithIssues,
  ],
  page: 1,
  page_size: 20,
  total: 2,
} as const

export const laoLetterTaskDetailFixture = {
  task: laoLetterTaskSummaryFixtures.completedWithIssues,
  items: [
    {
      item_no: 1,
      content_id: LO_LETTER_TEST_IDS.active,
      revision_id: '11000000-0000-4000-8000-000000000001',
      status: 'succeeded',
      error_code: null,
      error_message: null,
      retry_count: 0,
      completed_at: '2026-09-05T03:00:02.000Z',
    },
    {
      item_no: 2,
      content_id: LO_LETTER_TEST_IDS.pending,
      revision_id: '11000000-0000-4000-8000-000000000002',
      status: 'failed',
      error_code: 'INVALID_STATE',
      error_message: '当前状态不允许执行该操作',
      retry_count: 1,
      completed_at: '2026-09-05T03:00:02.500Z',
    },
    {
      item_no: 3,
      content_id: LO_LETTER_TEST_IDS.archived,
      revision_id: null,
      status: 'skipped',
      error_code: 'FORBIDDEN',
      error_message: '权限已变更',
      retry_count: 0,
      completed_at: '2026-09-05T03:00:03.000Z',
    },
  ],
  page: 1,
  page_size: 20,
  total: 3,
} as const

export const laoLetterApiFixtures = {
  list: laoLetterListFixture,
  selectionPreview: laoLetterSelectionPreviewFixture,
  taskList: laoLetterTaskListFixture,
  taskDetail: laoLetterTaskDetailFixture,
} as const
