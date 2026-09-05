import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { AppError } from '../../../../errors/app-error.js';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import type { TransactionManager } from '../../../../database/transaction-manager.js';
import type { UserPublicId } from '../../domain/index.js';
import type { IdentityRepositories } from '../ports/index.js';
import type { AdminAuditRecorder } from '../ports/admin-audit-port.js';

const HASH_PREFIX = 'scrypt';
const KEY_LENGTH = 64;

function hashAdminPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url');
  const derived = scryptSync(password, salt, KEY_LENGTH).toString('base64url');
  return `${HASH_PREFIX}$${salt}$${derived}`;
}

function temporaryPassword(): string {
  // base64url has a high-entropy mix of letters and digits and is never persisted or logged.
  return randomBytes(24).toString('base64url');
}

function verifyAdminPassword(password: string, encoded: string): boolean {
  const [prefix, salt, expectedEncoded] = encoded.split('$');
  if (prefix !== HASH_PREFIX || !salt || !expectedEncoded) return false;
  try {
    const expected = Buffer.from(expectedEncoded, 'base64url');
    const actual = scryptSync(password, salt, KEY_LENGTH);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export type ChangeAdminPasswordResult = Readonly<{ changed: boolean; sessionRevoked: boolean }>;
export type ChangeAdminPasswordContext = Readonly<{ requestId?: string; ipAddress?: string }>;
export type ResetAdminPasswordResult = Readonly<{ temporaryPassword: string; sessionRevoked: boolean }>;

/**
 * Admin password lifecycle operations (FR-011 / US-004).
 *
 * On success every active session of the user is revoked with reason
 * `password_changed` so the operator must re-authenticate. Only success is
 * recorded as an operator audit; failures surface as AppError (401/400).
 */
export class AdminCredentialOperations {
  constructor(
    private readonly transactions: TransactionManager,
    private readonly repositories: (executor: DatabaseExecutor) => IdentityRepositories,
    private readonly audit?: AdminAuditRecorder,
  ) {}

  async changePassword(
    subjectId: UserPublicId,
    currentPassword: string,
    newPassword: string,
    ctx?: ChangeAdminPasswordContext,
  ): Promise<ChangeAdminPasswordResult> {
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(newPassword)) {
      throw new AppError({ code: 'VALIDATION_ERROR', message: 'New password must be 8-128 characters and contain at least one letter and one digit', httpStatus: 400 });
    }
    if (currentPassword === newPassword) {
      throw new AppError({ code: 'VALIDATION_ERROR', message: 'New password must differ from the current password', httpStatus: 400 });
    }

    const result = await this.transactions.run(async executor => {
      const user = await this.repositories(executor).users.findByPublicId(subjectId);
      if (!user) throw new AppError({ code: 'UNAUTHENTICATED', message: 'Authentication required', httpStatus: 401 });

      const credentials = await executor.query<{ user_id: string; password_hash: string }>(
        `SELECT user_id, password_hash FROM identity.admin_credentials WHERE user_id = $1`,
        [user.id.toString()],
      );
      const row = credentials.rows[0];
      if (!row || !verifyAdminPassword(currentPassword, row.password_hash)) {
        throw new AppError({ code: 'INVALID_CREDENTIAL', message: 'Invalid credentials', httpStatus: 401 });
      }

      await executor.query(
        `UPDATE identity.admin_credentials SET password_hash = $2, password_change_required = false, updated_at = now() WHERE user_id = $1`,
        [user.id.toString(), hashAdminPassword(newPassword)],
      );
      const revoked = await this.repositories(executor).sessions.revokeAllByUserId(user.id, new Date(), 'password_changed');
      return { changed: true, sessionRevoked: revoked > 0 };
    });

    if (this.audit) {
      await this.audit.recordSuccessfulAdminAction({
        subjectId,
        actionKey: 'identity.admin_password.change',
        target: { domain: 'identity', type: 'operator', id: subjectId },
        requestContext: { requestId: ctx?.requestId, ipAddress: ctx?.ipAddress },
      });
    }
    return result;
  }

  /** Narrow cross-domain port: caller owns the surrounding transaction and audit. */
  async resetPasswordInTransaction(executor: DatabaseExecutor, subjectId: UserPublicId): Promise<ResetAdminPasswordResult> {
    const user = await this.repositories(executor).users.findByPublicId(subjectId);
    if (!user || user.status !== 'active') {
      throw new AppError({ code: 'OPERATOR_AUTH_SUBJECT_INACTIVE', message: 'Identity subject is not active', httpStatus: 409 });
    }
    const secret = temporaryPassword();
    const updated = await executor.query(
      `UPDATE identity.admin_credentials
       SET password_hash = $2, password_change_required = true, updated_at = now()
       WHERE user_id = $1`,
      [user.id.toString(), hashAdminPassword(secret)],
    );
    if (updated.rowCount !== 1) {
      throw new AppError({ code: 'OPERATOR_AUTH_SUBJECT_NOT_FOUND', message: 'Admin credentials not found', httpStatus: 400 });
    }
    const revoked = await this.repositories(executor).sessions.revokeAllByUserId(user.id, new Date(), 'password_reset');
    return { temporaryPassword: secret, sessionRevoked: revoked > 0 };
  }
}
