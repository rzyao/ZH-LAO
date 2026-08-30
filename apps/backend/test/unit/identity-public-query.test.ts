import { describe, expect, it } from 'vitest';
import { IdentityPublicQuery } from '../../src/modules/identity/public/index.js';
import { parseUserPublicId } from '../../src/modules/identity/domain/index.js';

const id = parseUserPublicId('00000000-0000-4000-8000-0000000000aa');
const repos = (status: 'active' | 'disabled' | 'closed' | null) => (() => ({ users: { findByPublicId: async () => status === null ? null : { publicId: id, status } } })) as never;
const executor = {} as never;

describe('IDN-20 Identity public contract', () => {
  it('exposes active status, inactivity, and safe summaries without internal ids', async () => {
    const query = new IdentityPublicQuery(repos('active'), executor);
    expect(await query.isIdentityActive(id)).toBe(true);
    expect(await query.getIdentityAccountStatus(id)).toBe('active');
    expect(await query.getIdentitySummary(id)).toEqual({ userPublicId: id, status: 'active' });
    const disabled = new IdentityPublicQuery(repos('disabled'), executor);
    expect(await disabled.isIdentityActive(id)).toBe(false);
    expect(await disabled.getIdentityAccountStatus(id)).toBe('disabled');
    const missing = new IdentityPublicQuery(repos(null), executor);
    expect(await missing.isIdentityActive(id)).toBe(false);
    expect(await missing.getIdentityAccountStatus(id)).toBeNull();
    expect(await missing.getIdentitySummary(id)).toBeNull();
  });
});