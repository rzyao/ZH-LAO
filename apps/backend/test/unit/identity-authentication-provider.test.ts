import { describe, expect, it } from 'vitest';
import { AccessTokenService } from '../../src/modules/identity/application/services/index.js';
import { parseUserPublicId, type IdentityAccountStatus } from '../../src/modules/identity/domain/index.js';
import { IdentityAuthenticationProvider } from '../../src/modules/identity/infrastructure/index.js';

const secret = 'test-jwt-secret-that-is-long-enough-for-hmac';
const user = parseUserPublicId('00000000-0000-4000-8000-000000000001');
const request = (token: string) => ({ headers: { authorization: `Bearer ${token}` } }) as never;
const providerFor = (status: IdentityAccountStatus) => new IdentityAuthenticationProvider(new AccessTokenService(secret, 'issuer', 'audience'), () => ({ users: { findByPublicId: async () => ({ id: 1n, publicId: user, status }) } } as never), { query: async () => ({ rows: [], rowCount: 0 }) } as never);

describe('IDN-15 IdentityAuthenticationProvider', () => {
  it('accepts a verified token only for active identities', async () => {
    const token = new AccessTokenService(secret, 'issuer', 'audience').issue(user);
    await expect(providerFor('active').authenticate(request(token))).resolves.toEqual({ subjectId: user, passwordChangeRequired: false });
    await expect(providerFor('disabled').authenticate(request(token))).resolves.toBeNull();
    await expect(providerFor('closed').authenticate(request(token))).resolves.toBeNull();
  });

  it('denies invalid and expired credentials', async () => {
    const provider = providerFor('active');
    await expect(provider.authenticate(request('invalid'))).resolves.toBeNull();
    const expired = new AccessTokenService(secret, 'issuer', 'audience', -1).issue(user);
    await expect(provider.authenticate(request(expired))).resolves.toBeNull();
  });
});
