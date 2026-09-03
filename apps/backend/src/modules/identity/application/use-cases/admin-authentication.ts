import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { AppError } from '../../../../errors/app-error.js';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import type { TransactionManager } from '../../../../database/transaction-manager.js';
import type { UserInternalId, UserPublicId } from '../../domain/index.js';
import type { IdentityRepositories } from '../ports/index.js';
import type { AdminAuditRecorder } from '../ports/admin-audit-port.js';
import type { AccessTokenService, RefreshTokenService } from '../services/index.js';
import type { LoginRateLimiter } from '../services/login-rate-limiter.js';
import type { SecurityLog } from '../services/security-log.js';

const INVALID_CREDENTIAL = () => new AppError({ code: 'INVALID_CREDENTIAL', message: 'Invalid credentials', httpStatus: 401 });
const RATE_LIMITED = (retryAfterSeconds: number) => new AppError({ code: 'LOGIN_RATE_LIMITED', message: 'Too many login attempts', httpStatus: 429, details: { retry_after_seconds: retryAfterSeconds } });
const HASH_PREFIX = 'scrypt';
const KEY_LENGTH = 64;

/** Hash a password using a per-password random salt. */
export function hashAdminPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url');
  const derived = scryptSync(password, salt, KEY_LENGTH).toString('base64url');
  return `${HASH_PREFIX}$${salt}$${derived}`;
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

type CredentialRow = { user_id: string; public_id: string; password_hash: string; status: string };

export type AdminLoginResult = Readonly<{
  userPublicId: UserPublicId;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionExpiresAt: Date;
}>;

export type AdminLoginContext = Readonly<{ ipAddress?: string; requestId?: string }>;

export class AdminAuthenticationService {
  constructor(
    private readonly transactions: TransactionManager,
    private readonly repositories: (executor: DatabaseExecutor) => IdentityRepositories,
    private readonly access: AccessTokenService,
    private readonly refresh: RefreshTokenService,
    private readonly now: () => Date = () => new Date(),
    private readonly options: Readonly<{ audit?: AdminAuditRecorder; rateLimiter?: LoginRateLimiter; securityLog?: SecurityLog }> = {},
  ) {}

  async login(username: string, password: string, ctx?: AdminLoginContext): Promise<AdminLoginResult> {
    // FR-002: normalize username (lowercase + trim) before any lookup.
    const normalizedUsername = username.trim().toLowerCase();
    const ipAddress = ctx?.ipAddress ?? 'unknown';
    const prepared = this.refresh.prepare();
    const now = this.now();
    const expiresAt = new Date(now.getTime() + 2_592_000_000);

    // FR-017: reject before credential verification when the username/IP is throttled.
    if (this.options.rateLimiter) {
      const decision = this.options.rateLimiter.check(normalizedUsername, ipAddress);
      if (decision.limited) {
        this.options.securityLog?.recordRateLimited({ scope: 'username', requestId: ctx?.requestId, ipAddress });
        throw RATE_LIMITED(decision.retryAfterSeconds);
      }
    }

    const result = await this.transactions.run(async executor => {
      const credentials = await executor.query<CredentialRow>(
        `SELECT c.user_id, u.public_id, c.password_hash, u.status
         FROM identity.admin_credentials c
         JOIN identity.users u ON u.id = c.user_id
         WHERE c.username = $1`,
        [normalizedUsername],
      );
      const row = credentials.rows[0];
      if (!row || !verifyAdminPassword(password, row.password_hash)) {
        // Brute-force signal: only count invalid-credential failures, not
        // account-status rejections, so attackers cannot forge lockouts.
        this.options.rateLimiter?.recordFailure(normalizedUsername, ipAddress);
        this.options.securityLog?.recordAuthFailure({ reason: 'INVALID_CREDENTIAL', requestId: ctx?.requestId, ipAddress });
        throw INVALID_CREDENTIAL();
      }
      if (row.status === 'disabled') throw new AppError({ code: 'ACCOUNT_DISABLED', message: 'Account is disabled', httpStatus: 403 });
      if (row.status === 'closed') throw new AppError({ code: 'ACCOUNT_CLOSED', message: 'Account is closed', httpStatus: 403 });

      const user = await this.repositories(executor).users.lockByInternalId(BigInt(row.user_id) as UserInternalId);
      if (!user || user.status !== 'active') throw INVALID_CREDENTIAL();
      await this.repositories(executor).sessions.create({
        userId: user.id,
        refreshTokenHash: prepared.hash,
        expiresAt,
      });
      await this.repositories(executor).users.updateLastActiveAt(user.id, now);

      return {
        userPublicId: user.publicId,
        accessToken: this.access.issue(user.publicId),
        refreshToken: prepared.rawRefreshToken,
        expiresIn: 900,
        sessionExpiresAt: expiresAt,
      };
    });

    // Success: clear throttling counters and record the success audit (FR-015).
    this.options.rateLimiter?.recordSuccess(normalizedUsername, ipAddress);
    if (this.options.audit) {
      await this.options.audit.recordSuccessfulAdminAction({
        subjectId: result.userPublicId,
        actionKey: 'identity.admin.login',
        target: { domain: 'identity', type: 'operator', id: result.userPublicId },
        requestContext: { requestId: ctx?.requestId, ipAddress },
      });
    }
    return result;
  }
}

/**
 * Creates the first back-office identity and lets Operations perform its
 * normal one-time super-admin bootstrap. Safe to call on every startup.
 */
export async function ensureDefaultAdmin(options: {
  transactions: TransactionManager;
  repositories: (executor: DatabaseExecutor) => IdentityRepositories;
  bootstrap: (subjectId: string, displayName: string) => Promise<unknown>;
  username: string;
  password: string;
}): Promise<void> {
  const username = options.username.trim().toLowerCase();
  const result = await options.transactions.run(async executor => {
    await executor.query('SELECT pg_advisory_xact_lock(904202608311::bigint)');
    const existing = await executor.query<{ public_id: string }>(
      `SELECT u.public_id
       FROM identity.admin_credentials c
       JOIN identity.users u ON u.id = c.user_id
       WHERE c.username = $1`,
      [username],
    );
    if (existing.rows[0]) return { subjectId: existing.rows[0].public_id, created: false };
    const operators = await executor.query<{ count: string }>('SELECT count(*)::text AS count FROM operations.operators');
    if (Number(operators.rows[0]?.count ?? 0) !== 0) return null;

    const user = await executor.query<{ id: string; public_id: string }>(
      `INSERT INTO identity.users (public_id, status) VALUES ($1, 'active') RETURNING id, public_id`,
      [randomUUID()],
    );
    const createdUser = user.rows[0];
    if (!createdUser) throw new Error('Unable to create default admin identity');
    await executor.query(
      `INSERT INTO identity.admin_credentials (user_id, username, password_hash) VALUES ($1, $2, $3)`,
      [createdUser.id, username, hashAdminPassword(options.password)],
    );
    return { subjectId: createdUser.public_id, created: true };
  });

  if (!result) return;
  try {
    await options.bootstrap(result.subjectId, username);
  } catch (error) {
    if (!(error instanceof AppError) || error.code !== 'BOOTSTRAP_ALREADY_COMPLETED') throw error;
  }
}