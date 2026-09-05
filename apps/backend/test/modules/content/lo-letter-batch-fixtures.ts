import { randomUUID } from 'node:crypto';
import type { DatabaseExecutor } from '../../../src/database/executor.js';
import {
  createSeededTestDatabase,
  type SeededTestDatabase,
} from '../../support/test-database.js';

export const LO_LETTER_BATCH_PERMISSIONS = [
  'content.lo_letters.read',
  'content.lo_letters.write',
  'content.lo_letters.review',
  'content.lo_letters.publish',
] as const;

export type LaoLetterFixtureContentStatus = 'active' | 'disabled' | 'archived';
export type LaoLetterFixtureRevisionStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export type LaoLetterFixtureOperator = Readonly<{
  id: string;
  authSubjectId: string;
  displayName: string;
  status: 'active' | 'disabled';
  permissions: readonly string[];
}>;

export type LaoLetterFixtureRow = Readonly<{
  databaseId: string;
  contentId: string;
  character: string;
  letterType: 'consonant' | 'vowel' | 'tone_mark' | 'other';
  letterClass: string | null;
  name: string;
  romanization: string;
  sortOrder: number;
  contentStatus: LaoLetterFixtureContentStatus;
  workingRevisionId: string | null;
  workingRevisionStatus: LaoLetterFixtureRevisionStatus | null;
  lockVersion: number | null;
}>;

export type LaoLetterBatchFixture = Readonly<{
  operators: readonly LaoLetterFixtureOperator[];
  letters: readonly LaoLetterFixtureRow[];
  pageSize: number;
}>;

export type LaoLetterBatchFixtureOptions = Readonly<{
  pageSize?: number;
  pageCount?: number;
  operatorCount?: number;
}>;

const letterTypes = ['consonant', 'vowel', 'tone_mark', 'other'] as const;
const letterClasses = ['cons_low', 'cons_middle', 'cons_high', null] as const;
const contentStatuses = ['active', 'disabled', 'archived'] as const;
const revisionStatuses = ['draft', 'pending_review', 'approved', 'rejected'] as const;

function positiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new TypeError(`${name} must be a positive safe integer`);
  }
  return value;
}

async function seedOperators(
  database: DatabaseExecutor,
  count: number,
): Promise<readonly LaoLetterFixtureOperator[]> {
  const operators: LaoLetterFixtureOperator[] = [];

  for (let index = 0; index < count; index += 1) {
    const operator: LaoLetterFixtureOperator = {
      id: randomUUID(),
      authSubjectId: randomUUID(),
      displayName: `Lao letter fixture operator ${index + 1}`,
      status: index === count - 1 && count > 2 ? 'disabled' : 'active',
      permissions: index === 0
        ? LO_LETTER_BATCH_PERMISSIONS
        : ['content.lo_letters.read'],
    };
    const roleId = randomUUID();

    await database.query(
      `INSERT INTO operations.operators (id, auth_subject_id, display_name, status)
       VALUES ($1, $2, $3, $4)`,
      [operator.id, operator.authSubjectId, operator.displayName, operator.status],
    );
    await database.query(
      `INSERT INTO operations.roles (id, code, name)
       VALUES ($1, $2, $3)`,
      [roleId, `lo_letter_fixture_${operator.id.replaceAll('-', '')}`, `Fixture role ${index + 1}`],
    );
    await database.query(
      `INSERT INTO operations.operator_roles (operator_id, role_id)
       VALUES ($1, $2)`,
      [operator.id, roleId],
    );
    for (const permission of operator.permissions) {
      await database.query(
        `INSERT INTO operations.role_permissions (role_id, permission_key)
         VALUES ($1, $2)`,
        [roleId, permission],
      );
    }

    operators.push(operator);
  }

  return operators;
}

async function seedLetters(
  database: DatabaseExecutor,
  total: number,
  creatorId: string,
): Promise<readonly LaoLetterFixtureRow[]> {
  const letters: LaoLetterFixtureRow[] = [];

  for (let index = 0; index < total; index += 1) {
    const position = index + 1;
    const contentId = randomUUID();
    const character = `ລ${String(position).padStart(4, '0')}`;
    const letterType = letterTypes[index % letterTypes.length]!;
    const letterClass = letterClasses[index % letterClasses.length]!;
    const contentStatus = contentStatuses[index % contentStatuses.length]!;
    const name = `fixture-letter-${String(position).padStart(4, '0')}`;
    const romanization = `l${position}`;
    const createdAt = new Date(Date.UTC(2026, 0, 1, 0, position));
    const contentResult = await database.query<{ id: string }>(
      `INSERT INTO content.contents (
         public_id, language, content_type, status, created_at, updated_at
       ) VALUES ($1, 'lo', 'lo_letter', $2, $3, $3)
       RETURNING id`,
      [contentId, contentStatus, createdAt],
    );
    const databaseId = contentResult.rows[0]?.id;
    if (!databaseId) throw new Error('Lao-letter fixture content insert returned no id');

    await database.query(
      `INSERT INTO content.lo_letters (
         content_id, character, letter_type, letter_class, name, romanization, sort_order
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [databaseId, character, letterType, letterClass, name, romanization, position],
    );

    const hasWorkingRevision = index % 2 === 0;
    const workingRevisionStatus = hasWorkingRevision
      ? revisionStatuses[Math.floor(index / 2) % revisionStatuses.length]!
      : null;
    const workingRevisionId = hasWorkingRevision ? randomUUID() : null;
    const lockVersion = hasWorkingRevision ? index % 3 : null;

    if (workingRevisionId && workingRevisionStatus !== null && lockVersion !== null) {
      const snapshot = {
        fields: {
          character: `${character}-draft`,
          letterType,
          letterClass,
          name: `${name}-draft`,
          romanization: `${romanization}-draft`,
          sortOrder: position,
        },
        composition: [],
      };
      const isRejected = workingRevisionStatus === 'rejected';
      const wasReviewed = workingRevisionStatus === 'approved' || isRejected;

      await database.query(
        `INSERT INTO content.content_revisions (
           revision_public_id, entity_type, entity_id, revision_number, status, snapshot,
           created_by_operator_id, reviewed_by_operator_id, review_remark, reviewed_at,
           lock_version, created_at, updated_at
         ) VALUES ($1, 'content', $2, 1, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
        [
          workingRevisionId,
          contentId,
          workingRevisionStatus,
          JSON.stringify(snapshot),
          creatorId,
          wasReviewed ? creatorId : null,
          isRejected ? 'Fixture rejection reason' : null,
          wasReviewed ? createdAt : null,
          lockVersion,
          createdAt,
        ],
      );
    }

    letters.push({
      databaseId,
      contentId,
      character,
      letterType,
      letterClass,
      name,
      romanization,
      sortOrder: position,
      contentStatus,
      workingRevisionId,
      workingRevisionStatus,
      lockVersion,
    });
  }

  return letters;
}

export async function seedLaoLetterBatchFixture(
  database: DatabaseExecutor,
  options: LaoLetterBatchFixtureOptions = {},
): Promise<LaoLetterBatchFixture> {
  const pageSize = positiveInteger(options.pageSize ?? 50, 'pageSize');
  const pageCount = positiveInteger(options.pageCount ?? 2, 'pageCount');
  const operatorCount = positiveInteger(options.operatorCount ?? 2, 'operatorCount');
  const operators = await seedOperators(database, operatorCount);
  const creator = operators[0];
  if (!creator) throw new Error('Lao-letter fixture requires a creator Operator');
  const letters = await seedLetters(database, pageSize * pageCount + 1, creator.id);

  return { operators, letters, pageSize };
}

export function createLaoLetterBatchTestDatabase(
  adminUrl: string,
  options: LaoLetterBatchFixtureOptions = {},
): Promise<SeededTestDatabase<LaoLetterBatchFixture>> {
  return createSeededTestDatabase(
    adminUrl,
    'lo_letter_batch',
    (database) => seedLaoLetterBatchFixture(database, options),
  );
}
