import { describe, expect, it, vi } from 'vitest';
import type { QueryResult } from '../../../database/executor.js';
import type { Logger } from 'pino';
import { TransactionManager } from '../../../database/transaction-manager.js';
import { AdminCredentialOperations } from '../application/use-cases/admin-credential-ops.js';
import { hashAdminPassword } from '../application/use-cases/admin-authentication.js';
import { parseUserInternalId, parseUserPublicId } from '../domain/ids.js';
import type { IdentityRepositories, UserRecord } from '../application/ports/identity-repositories.js';
import type { AdminAuditRecorder } from '../application/ports/admin-audit-port.js';

const silentLogger = { silent: true } as unknown as Logger;

function fakeUser(): UserRecord {
  return {
    id: parseUserInternalId(1n),
    publicId: parseUserPublicId('00000000-0000-4000-8000-000000000001'),
    status: 'active',
    registeredAt: new Date('2026-01-01T00:00:00Z'),
    lastActiveAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
}

describe('AdminCredentialOperations - changePassword (US-004 / FR-011 / FR-015)', () => {
  it('changes password, updates hash, revokes all sessions with password_changed, and records audit', async () => {
    const executedQueries: Array<{ text: string; values?: readonly unknown[] }> = [];
    const currentHash = hashAdminPassword('OldPassword123');
    const revokeAllByUserId = vi.fn().mockResolvedValue(2);
    const auditRecordMock = vi.fn().mockResolvedValue(undefined);

    const audit: AdminAuditRecorder = {
      recordSuccessfulAdminAction: auditRecordMock,
    };

    const repos: IdentityRepositories = {
      users: {
        findByPublicId: async () => fakeUser(),
      } as never,
      sessions: {
        revokeAllByUserId,
      } as never,
    } as never;

    const tx = new TransactionManager({
      connect: async () => ({
        query: async (text: string, values?: readonly unknown[]) => {
          executedQueries.push(values ? { text, values } : { text });
          if (text.includes('SELECT user_id, password_hash FROM identity.admin_credentials')) {
            return { rows: [{ user_id: '1', password_hash: currentHash }], rowCount: 1 } as unknown as QueryResult;
          }
          if (text.includes('UPDATE identity.admin_credentials')) {
            return { rows: [], rowCount: 1 } as unknown as QueryResult;
          }
          return { rows: [], rowCount: 0 } as unknown as QueryResult;
        },
        release: () => undefined,
      }) as never,
    } as never, silentLogger);

    const ops = new AdminCredentialOperations(tx, () => repos, audit);
    const subjectId = parseUserPublicId('00000000-0000-4000-8000-000000000001');

    const result = await ops.changePassword(subjectId, 'OldPassword123', 'NewSecret456!', {
      requestId: 'req-pw-1',
      ipAddress: '127.0.0.1',
    });

    expect(result).toEqual({ changed: true, sessionRevoked: true });
    expect(revokeAllByUserId).toHaveBeenCalledTimes(1);
    expect(revokeAllByUserId).toHaveBeenCalledWith(1n, expect.any(Date), 'password_changed');

    const updateQuery = executedQueries.find(q => q.text.includes('UPDATE identity.admin_credentials'));
    expect(updateQuery).toBeDefined();
    expect(updateQuery?.values?.[0]).toBe('1');
    expect(String(updateQuery?.values?.[1] ?? '')).toMatch(/^scrypt\$/);
    expect(updateQuery?.values?.[1]).not.toBe(currentHash);

    // Audit verification
    expect(auditRecordMock).toHaveBeenCalledTimes(1);
    expect(auditRecordMock).toHaveBeenCalledWith({
      subjectId,
      actionKey: 'identity.admin_password.change',
      target: { domain: 'identity', type: 'operator', id: subjectId },
      requestContext: { requestId: 'req-pw-1', ipAddress: '127.0.0.1' },
    });

    // Zero sensitive credentials in audit payload
    const firstCall = auditRecordMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    const auditPayload = JSON.stringify(firstCall?.[0]);
    expect(auditPayload).not.toContain('OldPassword123');
    expect(auditPayload).not.toContain('NewSecret456!');
    const callArg = (firstCall?.[0] ?? {}) as Record<string, unknown>;
    expect(callArg['password']).toBeUndefined();
    expect(callArg['newPassword']).toBeUndefined();
    expect(callArg['token']).toBeUndefined();
  });

  it('rejects with 401 INVALID_CREDENTIAL when current password is incorrect', async () => {
    const currentHash = hashAdminPassword('CorrectPassword1');
    const auditRecordMock = vi.fn();
    const revokeAllByUserId = vi.fn();

    const repos: IdentityRepositories = {
      users: {
        findByPublicId: async () => fakeUser(),
      } as never,
      sessions: {
        revokeAllByUserId,
      } as never,
    } as never;

    const tx = new TransactionManager({
      connect: async () => ({
        query: async (text: string) => {
          if (text.includes('SELECT user_id, password_hash FROM identity.admin_credentials')) {
            return { rows: [{ user_id: '1', password_hash: currentHash }], rowCount: 1 } as unknown as QueryResult;
          }
          return { rows: [], rowCount: 0 } as unknown as QueryResult;
        },
        release: () => undefined,
      }) as never,
    } as never, silentLogger);

    const ops = new AdminCredentialOperations(tx, () => repos, { recordSuccessfulAdminAction: auditRecordMock });
    const subjectId = parseUserPublicId('00000000-0000-4000-8000-000000000001');

    await expect(ops.changePassword(subjectId, 'WrongPassword1', 'NewSecret456!')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIAL',
      httpStatus: 401,
    });

    expect(revokeAllByUserId).not.toHaveBeenCalled();
    expect(auditRecordMock).not.toHaveBeenCalled();
  });

  it('rejects with 400 VALIDATION_ERROR when new password is too weak (no digit or under 8 chars)', async () => {
    const ops = new AdminCredentialOperations({} as never, () => ({} as never));
    const subjectId = parseUserPublicId('00000000-0000-4000-8000-000000000001');

    // Too short (< 8)
    await expect(ops.changePassword(subjectId, 'OldPassword1', 'Short1')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      httpStatus: 400,
    });

    // No digits
    await expect(ops.changePassword(subjectId, 'OldPassword1', 'NoDigitsHere')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      httpStatus: 400,
    });

    // No letters
    await expect(ops.changePassword(subjectId, 'OldPassword1', '1234567890')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      httpStatus: 400,
    });
  });

  it('rejects with 400 VALIDATION_ERROR when new password is identical to current password', async () => {
    const ops = new AdminCredentialOperations({} as never, () => ({} as never));
    const subjectId = parseUserPublicId('00000000-0000-4000-8000-000000000001');

    await expect(ops.changePassword(subjectId, 'SamePassword1', 'SamePassword1')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      httpStatus: 400,
    });
  });
});
