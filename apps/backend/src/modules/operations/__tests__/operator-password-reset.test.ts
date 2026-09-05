import { describe, expect, it } from 'vitest';
import { OPERATOR_PERMISSION_CATALOG, isOperatorPermissionKey } from '../public/permissions.js';

describe('operator password reset authorization contract', () => {
  it('registers the exact reset permission and rejects close-but-different keys', () => {
    expect(OPERATOR_PERMISSION_CATALOG).toContain('operations.operators.reset_password');
    expect(isOperatorPermissionKey('operations.operators.reset-password')).toBe(false);
  });
});
