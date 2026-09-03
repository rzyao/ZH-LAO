import { describe, expect, it, vi } from 'vitest';
import type { DatabaseExecutor, QueryResult } from '../../../database/executor.js';
import type { Logger } from 'pino';
import { AppError } from '../../../errors/app-error.js';
import { TransactionManager } from '../../../database/transaction-manager.js';
import { hashAdminPassword, AdminAuthenticationService } from '../application/use-cases/admin-authentication.js';
import { AccessTokenService, RefreshTokenService } from '../application/services/token-services.js';
import { InMemoryLoginRateLimiter } from '../application/services/login-rate-limiter.js';
import type { LoginRateLimiter } from '../application/services/login-rate-limiter.js';
import type { SecurityLog } from '../application/services/security-log.js';
import type { AdminAuditRecorder } from '../application/ports/admin-audit-port.js';
import { parseUserInternalId, parseUserPublicId } from '../domain/ids.js';
import type { IdentityRepositories, SessionRecord, UserRecord } from '../application/ports/identity-repositories.js';
import type { UserInternalId } from '../domain/index.js';

const silentLogger = { silent: true } as unknown as Logger;

/** Minimal fake pool: connect() returns a fake client whose query() routes to the handler. */
function fakeTransactionManager(handler: (text: string, values?: readonly unknown[]) => QueryResult): TransactionManager {
  const client = {
    query: async (text: string, values?: unknown[]) => handler(text, values),
    release: () => undefined,
  } as never;
  const pool = { connect: async () => client } as never;
  return new TransactionManager(pool as never, silentLogger);
}

/** Build an in-memory repository set with the provided user + credential expectations. */
function fakeRepositories(overrides: Partial<{
  lockByInternalId: (id: UserInternalId) => Promise<UserRecord | null>;
  updateLastActiveAt: (id: UserInternalId) => Promise<UserRecord | null>;
  createSession: () => Promise<SessionRecord>;
}> = {}): { repositories: (e: DatabaseExecutor) => IdentityRepositories } {
  const user: UserRecord = {
    id: parseUserInternalId(1n),
    publicId: parseUserPublicId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
    status: 'active',
    registeredAt: new Date('2026-01-01T00:00:00Z'),
    lastActiveAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
  const session: SessionRecord = {
    id: 1n as never,
    userId: user.id,
    deviceId: null,
    refreshTokenHash: 'hash' as never,
    status: 'active',
    expiresAt: new Date('2026-10-01T00:00:00Z'),
    lastActiveAt: null,
    createdAt: new Date(),
    revokedAt: null,
    revocationReason: null,
  };
  const repositories: IdentityRepositories = {
    users: {
      findByPublicId: async () => user,
      findByInternalId: async () => user,
      create: async () => user,
      lockByPublicId: async () => user,
      lockByInternalId: overrides.lockByInternalId ? async (id: UserInternalId) => overrides.lockByInternalId!(id) : async () => user,
      updateLastActiveAt: overrides.updateLastActiveAt ? async (id: UserInternalId) => overrides.updateLastActiveAt!(id) : async () => user,
      updateStatus: async () => user,
    },
    authIdentities: {} as never,
    basicProfiles: {} as never,
    learningProfiles: {} as never,
    otpChallenges: {} as never,
    devices: {} as never,
    sessions: {
      create: overrides.createSession ? async () => overrides.createSession!() : async () => session,
    } as never,
  };
  return { repositories: () => repositories };
}

function buildService(options: {
  rateLimiter?: LoginRateLimiter;
  securityLog?: SecurityLog;
  audit?: AdminAuditRecorder;
  password?: string;
  status?: string;
}) {
  const now = () => new Date('2026-09-03T00:00:00Z');
  const access = new AccessTokenService('test-secret-that-is-long-enough-for-hmac', 'iss', 'aud');
  const refresh = new RefreshTokenService();
  const { repositories } = fakeRepositories();
  const transactions = fakeTransactionManager(() => {
    return {
      rows: [{ user_id: '1', public_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', password_hash: hashAdminPassword(options.password ?? 'correct-password'), status: options.status ?? 'active' }],
      rowCount: 1,
    } as unknown as QueryResult;
  });
  const service = new AdminAuthenticationService(
    transactions,
    repositories,
    access,
    refresh,
    now,
    { ...(options.audit ? { audit: options.audit } : {}), ...(options.rateLimiter ? { rateLimiter: options.rateLimiter } : {}), ...(options.securityLog ? { securityLog: options.securityLog } : {}) },
  );
  return { service, access, refresh, transactions };
}

describe('AdminAuthenticationService.login (US-001 / FR-001..006 / FR-017)', () => {
  it('logs in with correct credentials, creates an active session, and issues tokens', async () => {
    let createdSession = false;
    const { repositories } = fakeRepositories({ createSession: () => { createdSession = true; return Promise.resolve({} as SessionRecord); } });
    const transactions = fakeTransactionManager(() => ({ rows: [{ user_id: '1', public_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', password_hash: hashAdminPassword('correct-password'), status: 'active' }] }) as unknown as QueryResult);
    const service = new AdminAuthenticationService(transactions, repositories, new AccessTokenService('s', 'i', 'a'), new RefreshTokenService(), () => new Date());
    const result = await service.login('admin', 'correct-password', { ipAddress: '127.0.0.1' });
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.expiresIn).toBe(900);
    expect(createdSession).toBe(true);
    expect(result.userPublicId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  });

  it('returns the same INVALID_CREDENTIAL for wrong password and unknown username (FR-004 anti-enumeration)', async () => {
    const wrong = buildService({ password: 'other-password' });
    const wrongError = await wrong.service.login('admin', 'wrong-password').catch((e) => e) as AppError;
    expect(wrongError.code).toBe('INVALID_CREDENTIAL');
    expect(wrongError.httpStatus).toBe(401);

    // Unknown username: no row -> same error path.
    const unknownTx = fakeTransactionManager(() => ({ rows: [], rowCount: 0 }) as unknown as QueryResult);
    const unknown = new AdminAuthenticationService(unknownTx, fakeRepositories().repositories, new AccessTokenService('s', 'i', 'a'), new RefreshTokenService(), () => new Date());
    const unknownError = await unknown.login('nobody', 'whatever').catch((e) => e) as AppError;
    expect(unknownError.code).toBe('INVALID_CREDENTIAL');
    expect(unknownError.httpStatus).toBe(401);
  });

  it('rejects disabled and closed accounts with 403 (FR-005)', async () => {
    for (const status of ['disabled', 'closed'] as const) {
      const { service } = buildService({ status });
      const error = await service.login('admin', 'correct-password').catch((e) => e) as AppError;
      expect(error.httpStatus).toBe(403);
      expect(error.code).toBe(status === 'disabled' ? 'ACCOUNT_DISABLED' : 'ACCOUNT_CLOSED');
    }
  });

  it('throttles repeated failures to 429 LOGIN_RATE_LIMITED and clears on success (FR-017)', async () => {
    const rateLimiter = new InMemoryLoginRateLimiter({ usernameThreshold: 3, ipThreshold: 3 });
    const { service } = buildService({ rateLimiter, password: 'correct-password' });
    for (let i = 0; i < 3; i += 1) {
      const error = await service.login('admin', 'wrong').catch((e) => e) as AppError;
      expect(error.code).toBe('INVALID_CREDENTIAL');
    }
    const limited = await service.login('admin', 'correct-password').catch((e) => e) as AppError;
    expect(limited.code).toBe('LOGIN_RATE_LIMITED');
    expect(limited.httpStatus).toBe(429);
  });

  it('records the success audit on login and does NOT audit failures (FR-015 / audit.md semantics)', async () => {
    const audit: AdminAuditRecorder = { recordSuccessfulAdminAction: vi.fn(async () => {}) };
    const success = buildService({ audit, password: 'correct-password' });
    await success.service.login('admin', 'correct-password', { ipAddress: '10.0.0.1', requestId: 'req-1' });
    expect(audit.recordSuccessfulAdminAction).toHaveBeenCalledWith(expect.objectContaining({
      subjectId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      actionKey: 'identity.admin.login',
      requestContext: { requestId: 'req-1', ipAddress: '10.0.0.1' },
    }));

    // Failure path must not call audit.
    const audit2: AdminAuditRecorder = { recordSuccessfulAdminAction: vi.fn(async () => {}) };
    const failing = buildService({ audit: audit2, password: 'correct-password' });
    await failing.service.login('admin', 'wrong-password').catch(() => undefined);
    expect(audit2.recordSuccessfulAdminAction).not.toHaveBeenCalled();
  });

  it('normalizes username to lowercase+trim so " Admin " matches stored "admin" (FR-002)', async () => {
    let queried = '';
    const transactions = fakeTransactionManager((text) => {
      if (text.includes('admin_credentials')) queried = text;
      return { rows: [{ user_id: '1', public_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', password_hash: hashAdminPassword('p'), status: 'active' }] } as unknown as QueryResult;
    });
    const { repositories } = fakeRepositories();
    const service = new AdminAuthenticationService(transactions, repositories, new AccessTokenService('s', 'i', 'a'), new RefreshTokenService(), () => new Date());
    await service.login('  Admin  ', 'p');
    expect(queried).toContain('admin');
  });
});
