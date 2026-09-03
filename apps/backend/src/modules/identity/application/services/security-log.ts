import type { Logger } from 'pino';

export interface SecurityLog {
  recordAuthFailure(input: Readonly<{ reason: string; requestId?: string | undefined; ipAddress?: string | undefined }>): void;
  recordRateLimited(input: Readonly<{ scope: 'username' | 'ip'; requestId?: string | undefined; ipAddress?: string | undefined }>): void;
}

export class NoopSecurityLog implements SecurityLog {
  recordAuthFailure(): void {}
  recordRateLimited(): void {}
}

/**
 * Authentication failure / rate-limit logging. Uses the app pino logger whose
 * redact paths already mask password/token fields. Failures NEVER write an
 * operator audit (audit.md success semantics).
 */
export function createSecurityLog(logger: Logger): SecurityLog {
  return {
    recordAuthFailure(input) {
      logger.warn({ event: 'admin_auth_failure', reason: input.reason, requestId: input.requestId, ipAddress: input.ipAddress }, 'admin authentication failed');
    },
    recordRateLimited(input) {
      logger.warn({ event: 'admin_login_rate_limited', scope: input.scope, requestId: input.requestId, ipAddress: input.ipAddress }, 'admin login rate limited');
    },
  };
}