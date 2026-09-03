export interface LoginRateLimitDecision {
  readonly limited: boolean;
  readonly retryAfterSeconds: number;
}

export interface LoginRateLimiter {
  check(username: string, ipAddress: string): LoginRateLimitDecision;
  recordFailure(username: string, ipAddress: string): LoginRateLimitDecision;
  recordSuccess(username: string, ipAddress: string): void;
}

interface Bucket {
  count: number;
  windowStartedAt: number;
  limitedUntil: number;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_COOLDOWN_MS = 5 * 60_000;
const DEFAULT_USERNAME_THRESHOLD = 5;
const DEFAULT_IP_THRESHOLD = 20;

/**
 * Single-process in-memory login attempt limiter (FR-017 / contract §6).
 * - Same username: >= 5 consecutive failures -> 429 for a 5-minute cool-down
 * - Same IP:        >= 20 consecutive failures -> 429 for a 5-minute cool-down
 * - A successful login clears both counters.
 *
 * Matches the existing constraint of no Redis: safe for single-container
 * deployments; a shared DB/edge counter is the deferred scaling path.
 */
export class InMemoryLoginRateLimiter implements LoginRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly options: Readonly<{ windowMs?: number; coolDownMs?: number; usernameThreshold?: number; ipThreshold?: number }> = {}) {}

  check(username: string, ipAddress: string): LoginRateLimitDecision {
    const now = Date.now();
    const byUsername = this.decision(this.key('username', username), now);
    if (byUsername.limited) return byUsername;
    return this.decision(this.key('ip', ipAddress), now);
  }

  recordFailure(username: string, ipAddress: string): LoginRateLimitDecision {
    const now = Date.now();
    const byUsername = this.record(this.key('username', username), now, this.options.usernameThreshold ?? DEFAULT_USERNAME_THRESHOLD);
    if (byUsername.limited) return byUsername;
    return this.record(this.key('ip', ipAddress), now, this.options.ipThreshold ?? DEFAULT_IP_THRESHOLD);
  }

  recordSuccess(username: string, ipAddress: string): void {
    this.buckets.delete(this.key('username', username));
    this.buckets.delete(this.key('ip', ipAddress));
  }

  private key(scope: 'username' | 'ip', value: string): string {
    return `${scope}:${value.trim().toLowerCase()}`;
  }

  private decision(key: string, now: number): LoginRateLimitDecision {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.limitedUntil <= now) return { limited: false, retryAfterSeconds: 0 };
    return { limited: true, retryAfterSeconds: Math.max(1, Math.ceil((bucket.limitedUntil - now) / 1000)) };
  }

  private record(key: string, now: number, threshold: number): LoginRateLimitDecision {
    const coolDownMs = this.options.coolDownMs ?? DEFAULT_COOLDOWN_MS;
    const windowMs = this.options.windowMs ?? DEFAULT_WINDOW_MS;
    const existing = this.buckets.get(key);
    const bucket: Bucket =
      existing && now - existing.windowStartedAt < windowMs
        ? { count: existing.count + 1, windowStartedAt: existing.windowStartedAt, limitedUntil: existing.limitedUntil }
        : { count: 1, windowStartedAt: now, limitedUntil: 0 };
    if (bucket.count >= threshold && bucket.limitedUntil <= now) {
      bucket.limitedUntil = now + coolDownMs;
    }
    this.buckets.set(key, bucket);
    return { limited: bucket.limitedUntil > now, retryAfterSeconds: bucket.limitedUntil > now ? Math.max(1, Math.ceil((bucket.limitedUntil - now) / 1000)) : 0 };
  }
}