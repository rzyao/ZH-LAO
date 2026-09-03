import { describe, expect, it } from 'vitest';
import { InMemoryLoginRateLimiter } from './login-rate-limiter.js';

describe('InMemoryLoginRateLimiter (FR-017 / contract §6)', () => {
  it('limits a username after the threshold failures and reports retry window', () => {
    const limiter = new InMemoryLoginRateLimiter({ usernameThreshold: 3, coolDownMs: 60_000 });
    expect(limiter.recordFailure('admin', '1.1.1.1').limited).toBe(false);
    expect(limiter.recordFailure('admin', '1.1.1.1').limited).toBe(false);
    const third = limiter.recordFailure('admin', '1.1.1.1');
    expect(third.limited).toBe(true);
    expect(third.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    // check() sees the limited state before any new failure.
    expect(limiter.check('admin', '1.1.1.1').limited).toBe(true);
  });

  it('keys failures by username AND ip independently', () => {
    const limiter = new InMemoryLoginRateLimiter({ usernameThreshold: 3, ipThreshold: 3 });
    // Same IP, different usernames: IP bucket trips first only when IP threshold hit.
    limiter.recordFailure('u1', '9.9.9.9');
    limiter.recordFailure('u2', '9.9.9.9');
    // Neither username nor IP at threshold (2 < 3).
    expect(limiter.check('u1', '9.9.9.9').limited).toBe(false);
    limiter.recordFailure('u3', '9.9.9.9');
    // IP now at threshold -> any username from this IP is limited.
    expect(limiter.check('u1', '9.9.9.9').limited).toBe(true);
    // Different IP is unaffected.
    expect(limiter.check('u1', '8.8.8.8').limited).toBe(false);
  });

  it('clears counters on success (FR-017)', () => {
    const limiter = new InMemoryLoginRateLimiter({ usernameThreshold: 3, coolDownMs: 60_000 });
    limiter.recordFailure('admin', '1.1.1.1');
    limiter.recordFailure('admin', '1.1.1.1');
    limiter.recordSuccess('admin', '1.1.1.1');
    expect(limiter.check('admin', '1.1.1.1').limited).toBe(false);
    // After success, failures restart from zero.
    expect(limiter.recordFailure('admin', '1.1.1.1').limited).toBe(false);
  });

  it('respects the cool-down expiry window', () => {
    const limiter = new InMemoryLoginRateLimiter({ usernameThreshold: 2, coolDownMs: 1_000 });
    limiter.recordFailure('admin', '1.1.1.1');
    limiter.recordFailure('admin', '1.1.1.1');
    expect(limiter.check('admin', '1.1.1.1').limited).toBe(true);
  });
});
