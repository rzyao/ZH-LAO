import { describe, expect, it } from 'vitest';
import { isLogicalUuid, newLogicalUuid, parseLogicalUuid } from '../../src/ids/uuid.js';

describe('logical UUID', () => {
  it('generates distinct valid UUIDs', () => {
    const first = newLogicalUuid(); const second = newLogicalUuid();
    expect(isLogicalUuid(first)).toBe(true); expect(first).not.toBe(second);
  });
  it('rejects internal numeric identifiers', () => { expect(() => parseLogicalUuid(123n)).toThrow(); });
});
