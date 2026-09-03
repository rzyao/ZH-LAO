import { describe, expect, it, vi } from 'vitest';
import type { Logger } from 'pino';
import { createSecurityLog } from '../application/services/security-log.js';
import type { AdminAuditRecorder } from '../application/ports/admin-audit-port.js';
import { parseUserPublicId } from '../domain/ids.js';

describe('Zero Sensitive Credentials Leakage (SC-005 / FR-008 / FR-015)', () => {
  it('ensures SecurityLog does not record password, new_password, or token in log payloads', () => {
    const warnMock = vi.fn();
    const loggerStub = {
      warn: warnMock,
    } as unknown as Logger;

    const securityLog = createSecurityLog(loggerStub);

    securityLog.recordAuthFailure({
      reason: 'INVALID_CREDENTIAL',
      requestId: 'req-fail-1',
      ipAddress: '192.168.1.100',
    });

    securityLog.recordRateLimited({
      scope: 'username',
      requestId: 'req-rate-1',
      ipAddress: '192.168.1.100',
    });

    expect(warnMock).toHaveBeenCalledTimes(2);

    for (const call of warnMock.mock.calls) {
      const payloadStr = JSON.stringify(call[0]);
      expect(payloadStr).not.toContain('password');
      expect(payloadStr).not.toContain('token');
      expect(payloadStr).not.toContain('secret');
      expect(payloadStr).not.toContain('authorization');
    }
  });

  it('ensures AdminAuditRecorder audit payloads never contain sensitive credential fields', async () => {
    const recordActionMock = vi.fn().mockResolvedValue(undefined);
    const auditRecorder: AdminAuditRecorder = {
      recordSuccessfulAdminAction: recordActionMock,
    };

    const subjectId = parseUserPublicId('00000000-0000-4000-8000-000000000001');

    // Test all 4 success audit event keys
    const auditEvents = [
      'identity.admin.login',
      'identity.admin.refresh',
      'identity.admin.password.change',
      'identity.admin.logout',
    ];

    for (const actionKey of auditEvents) {
      await auditRecorder.recordSuccessfulAdminAction({
        subjectId,
        actionKey,
        target: { domain: 'identity', type: 'operator', id: subjectId },
        requestContext: { requestId: 'req-sec-1', ipAddress: '127.0.0.1' },
      });
    }

    expect(recordActionMock).toHaveBeenCalledTimes(4);

    for (const call of recordActionMock.mock.calls) {
      const payload = call[0];
      const payloadStr = JSON.stringify(payload);

      // Verify details does not contain password or token
      const details = (payload as { details?: Record<string, unknown> }).details;
      expect(details?.['password']).toBeUndefined();
      expect(details?.['new_password']).toBeUndefined();
      expect(details?.['current_password']).toBeUndefined();
      expect(details?.['token']).toBeUndefined();
      expect(details?.['access_token']).toBeUndefined();
      expect(details?.['refresh_token']).toBeUndefined();

      // Top level fields also must not contain raw credentials
      expect(payloadStr).not.toContain('secret');
      expect(payloadStr).not.toContain('bearer');

      // Verify standard required structure
      expect(payload.subjectId).toBe(subjectId);
      expect(payload.target).toEqual({ domain: 'identity', type: 'operator', id: subjectId });
      expect(payload.requestContext).toEqual({ requestId: 'req-sec-1', ipAddress: '127.0.0.1' });
    }
  });
});
