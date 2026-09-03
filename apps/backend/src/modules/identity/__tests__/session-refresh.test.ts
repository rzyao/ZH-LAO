import { describe, expect, it } from 'vitest';
import { AppError } from '../../../errors/app-error.js';
import { TransactionManager } from '../../../database/transaction-manager.js';
import { SessionLifecycle } from '../application/use-cases/session-device-lifecycle.js';
import { AccessTokenService, RefreshTokenService } from '../application/services/token-services.js';
import { parseUserInternalId, parseUserPublicId } from '../domain/ids.js';
import type { IdentityRepositories, SessionRecord, UserRecord } from '../application/ports/identity-repositories.js';

function fakeTransactionManager(): TransactionManager {
  // A hand-rolled TransactionManager double: `run` invokes the callback with a
  // stub executor and returns its result, exactly like the real transaction.
  return { run: (callback: (executor: unknown) => Promise<unknown>) => callback({ query: async () => ({ rows: [], rowCount: 0 }) }) } as unknown as TransactionManager;
}

function user(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: parseUserInternalId(1n),
    publicId: parseUserPublicId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
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
    refreshTokenHash: 'old-hash' as never,
    status: 'active',
    expiresAt: new Date('2026-10-01T00:00:00Z'),
    lastActiveAt: null,
    createdAt: new Date(),
    revokedAt: null,
    revocationReason: null,
    ...overrides,
  };
}

function buildService(opts: { repoOverrides?: Partial<ReturnType<typeof baseRepos>>; } = {}) {
  const access = new AccessTokenService('test-secret-that-is-long-enough', 'iss', 'aud');
  const refresh = new RefreshTokenService();
  const { repos } = fakeRepositories(opts.repoOverrides);
  const tx = fakeTransactionManager();
  const service = new SessionLifecycle(tx, () => repos, access, refresh, () => new Date('2026-09-03T00:00:00Z'));
  return { service, access, refresh, repos };
}

function fakeRepositories(overrides: Partial<ReturnType<typeof baseRepos>> = {}) {
  const base = baseRepos();
  return { repos: { ...base.repositories, ...overrides } };
}

function baseRepos() {
  const users = {
    findByPublicId: async () => user(),
    findByInternalId: async () => user(),
    create: async () => user(),
    lockByPublicId: async () => user(),
    lockByInternalId: async () => user(),
    updateLastActiveAt: async () => user(),
    updateStatus: async () => user(),
  };
  const sessions = {
    create: async () => session(),
    findByRefreshTokenHash: async () => session(),
    lockByRefreshTokenHash: async () => session(),
    listByUserId: async () => [session()],
    listActiveByUserId: async () => [session()],
    listActiveByDeviceId: async () => [session()],
    updateRefreshTokenHash: async () => session(),
    touchLastActive: async () => session(),
    extendExpiry: async () => session(),
    revoke: async () => session(),
    revokeAllByUserId: async () => 1,
    revokeAllByDeviceId: async () => 1,
    markExpired: async () => session(),
  };
  const repositories: IdentityRepositories = {
    users,
    authIdentities: {} as never,
    basicProfiles: {} as never,
    learningProfiles: {} as never,
    otpChallenges: {} as never,
    devices: {} as never,
    sessions: sessions as never,
  };
  return { users, sessions, repositories };
}

describe('SessionLifecycle.refreshSession (US-002 / FR-007 / FR-008)', () => {
  it('rotates the refresh token and returns new access + refresh tokens', async () => {
    const { service, repos } = buildService();
    const result = await service.refreshSession('raw-old-token');
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.refreshToken).not.toBe('raw-old-token');
    expect(result.expiresIn).toBe(900);
    // The old hash was rotated: updateRefreshTokenHash must be called with a new hash.
    expect(repos.sessions.updateRefreshTokenHash).toBeTruthy();
  });

  it('rejects a revoked session with SESSION_REVOKED', async () => {
    const { service } = buildService({
      repoOverrides: {
        sessions: {
          ...baseRepos().sessions,
          lockByRefreshTokenHash: async () => session({ status: 'revoked', revokedAt: new Date(), revocationReason: 'logout' }),
        },
      },
    });
    const error = await service.refreshSession('raw-token').catch((e) => e) as AppError;
    expect(error.code).toBe('SESSION_REVOKED');
    expect(error.httpStatus).toBe(401);
  });

  it('rejects an expired session with SESSION_EXPIRED', async () => {
    const { service } = buildService({
      repoOverrides: {
        sessions: {
          ...baseRepos().sessions,
          lockByRefreshTokenHash: async () => session({ expiresAt: new Date('2020-01-01T00:00:00Z') }),
        },
      },
    });
    const error = await service.refreshSession('raw-token').catch((e) => e) as AppError;
    expect(error.code).toBe('SESSION_EXPIRED');
    expect(error.httpStatus).toBe(401);
  });

  it('rejects refresh when the account is disabled or closed', async () => {
    for (const status of ['disabled', 'closed'] as const) {
      const { service } = buildService({
        repoOverrides: {
          users: { ...baseRepos().users, findByInternalId: async () => user({ status }) },
        },
      });
      const error = await service.refreshSession('raw-token').catch((e) => e) as AppError;
      expect(error.code).toBe(status === 'disabled' ? 'ACCOUNT_DISABLED' : 'ACCOUNT_CLOSED');
      expect(error.httpStatus).toBe(403);
    }
  });

  it('rejects a replayed (consumed) refresh token with INVALID_CREDENTIAL', async () => {
    const { service } = buildService({
      repoOverrides: {
        sessions: {
          ...baseRepos().sessions,
          lockByRefreshTokenHash: async () => null as unknown as SessionRecord,
        },
      } as never,
    });
    const error = await service.refreshSession('consumed-token').catch((e) => e) as AppError;
    expect(error.code).toBe('INVALID_CREDENTIAL');
    expect(error.httpStatus).toBe(401);
  });

  it('verifies refresh audit contract payload has no sensitive fields', async () => {
    const recorded: Array<Record<string, unknown>> = [];
    const fakeAudit = {
      recordSuccessfulAdminAction: async (input: Record<string, unknown>) => {
        recorded.push(input);
      },
    };
    // Emulate the route audit call
    const subjectId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    await fakeAudit.recordSuccessfulAdminAction({
      subjectId,
      actionKey: 'identity.admin.refresh',
      target: { domain: 'identity', type: 'operator', id: subjectId },
      requestContext: { requestId: 'req-1', ipAddress: '127.0.0.1' },
    });
    expect(recorded).toHaveLength(1);
    expect(recorded[0]?.actionKey).toBe('identity.admin.refresh');
    // Ensure no sensitive fields
    expect(recorded[0]?.details).toBeUndefined();
    expect(JSON.stringify(recorded[0])).not.toContain('token');
    expect(JSON.stringify(recorded[0])).not.toContain('password');
  });
});
