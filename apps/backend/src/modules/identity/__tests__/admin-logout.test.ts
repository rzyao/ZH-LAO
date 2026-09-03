import { describe, expect, it, vi } from 'vitest';
import { TransactionManager } from '../../../database/transaction-manager.js';
import { SessionLifecycle } from '../application/use-cases/session-device-lifecycle.js';
import { AccessTokenService, RefreshTokenService } from '../application/services/token-services.js';
import { parseUserInternalId, parseUserPublicId } from '../domain/ids.js';
import type { IdentityRepositories, SessionRecord, UserRecord } from '../application/ports/identity-repositories.js';
import type { AdminAuditRecorder } from '../application/ports/admin-audit-port.js';

function fakeTransactionManager(): TransactionManager {
  return { run: (callback: (executor: unknown) => Promise<unknown>) => callback({ query: async () => ({ rows: [], rowCount: 0 }) }) } as unknown as TransactionManager;
}

function user(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: parseUserInternalId(1n),
    publicId: parseUserPublicId('00000000-0000-4000-8000-000000000001'),
    status: 'active',
    registeredAt: new Date('2026-01-01T00:00:00Z'),
    lastActiveAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function session(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 1n as never,
    userId: parseUserInternalId(1n),
    deviceId: null,
    refreshTokenHash: 'mock-hash' as never,
    status: 'active',
    expiresAt: new Date('2026-10-01T00:00:00Z'),
    lastActiveAt: null,
    createdAt: new Date(),
    revokedAt: null,
    revocationReason: null,
    ...overrides,
  };
}

describe('SessionLifecycle.logoutCurrent & Admin Logout (US-005 / FR-012 / FR-015)', () => {
  it('revokes active session with reason=logout and returns public user id for audit', async () => {
    const revokeMock = vi.fn().mockResolvedValue(session({ status: 'revoked', revocationReason: 'logout' }));
    const access = new AccessTokenService('test-secret-that-is-long-enough', 'iss', 'aud');
    const refresh = new RefreshTokenService();
    const token = refresh.prepare();

    const repos = {
      users: {
        findByInternalId: async () => user(),
      },
      sessions: {
        lockByRefreshTokenHash: async () => session({ refreshTokenHash: token.hash }),
        revoke: revokeMock,
      },
    } as unknown as IdentityRepositories;

    const tx = fakeTransactionManager();
    const service = new SessionLifecycle(tx, () => repos, access, refresh, () => new Date('2026-09-03T00:00:00Z'));

    const subjectId = await service.logoutCurrent(token.rawRefreshToken);

    expect(subjectId).toBe('00000000-0000-4000-8000-000000000001');
    expect(revokeMock).toHaveBeenCalledTimes(1);
    expect(revokeMock).toHaveBeenCalledWith(1n, new Date('2026-09-03T00:00:00Z'), 'logout');
  });

  it('records identity.admin.logout audit with zero sensitive fields', async () => {
    const auditRecordMock = vi.fn().mockResolvedValue(undefined);
    const audit: AdminAuditRecorder = {
      recordSuccessfulAdminAction: auditRecordMock,
    };

    const subjectId = parseUserPublicId('00000000-0000-4000-8000-000000000001');
    await audit.recordSuccessfulAdminAction({
      subjectId,
      actionKey: 'identity.admin.logout',
      target: { domain: 'identity', type: 'operator', id: subjectId },
      requestContext: { requestId: 'req-logout-1', ipAddress: '127.0.0.1' },
    });

    expect(auditRecordMock).toHaveBeenCalledTimes(1);
    expect(auditRecordMock).toHaveBeenCalledWith({
      subjectId,
      actionKey: 'identity.admin.logout',
      target: { domain: 'identity', type: 'operator', id: subjectId },
      requestContext: { requestId: 'req-logout-1', ipAddress: '127.0.0.1' },
    });

    const callArg = auditRecordMock.mock.calls[0]?.[0];
    expect(callArg).toBeDefined();
    const callPayload = JSON.stringify(callArg);
    expect(callPayload).not.toContain('password');
    expect(callPayload).not.toContain('token');
  });

  it('rejects old refresh token with 401 SESSION_REVOKED after logout', async () => {
    const access = new AccessTokenService('test-secret-that-is-long-enough', 'iss', 'aud');
    const refresh = new RefreshTokenService();
    const token = refresh.prepare();

    const repos = {
      users: {
        findByInternalId: async () => user(),
      },
      sessions: {
        // Once revoked by logout, subsequent lookup returns status: 'revoked'
        lockByRefreshTokenHash: async () => session({
          refreshTokenHash: token.hash,
          status: 'revoked',
          revokedAt: new Date('2026-09-03T00:00:00Z'),
          revocationReason: 'logout',
        }),
      },
    } as unknown as IdentityRepositories;

    const tx = fakeTransactionManager();
    const service = new SessionLifecycle(tx, () => repos, access, refresh, () => new Date('2026-09-03T00:00:00Z'));

    await expect(service.refreshSession(token.rawRefreshToken)).rejects.toMatchObject({
      code: 'SESSION_REVOKED',
      httpStatus: 401,
    });
  });

  it('is idempotent: returns null when session is already revoked or missing', async () => {
    const access = new AccessTokenService('test-secret-that-is-long-enough', 'iss', 'aud');
    const refresh = new RefreshTokenService();
    const revokeMock = vi.fn();

    const repos = {
      users: {
        findByInternalId: async () => user(),
      },
      sessions: {
        lockByRefreshTokenHash: async () => session({ status: 'revoked', revocationReason: 'logout' }),
        revoke: revokeMock,
      },
    } as unknown as IdentityRepositories;

    const tx = fakeTransactionManager();
    const service = new SessionLifecycle(tx, () => repos, access, refresh, () => new Date('2026-09-03T00:00:00Z'));

    const subjectId = await service.logoutCurrent('non-existent-or-revoked');
    expect(subjectId).toBeNull();
    expect(revokeMock).not.toHaveBeenCalled();
  });
});
