import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createIdentityPublicQuery } from '../../src/modules/identity/application/index.js';
import type { IdentityPublicQueries, IdentityPublicSummary } from '../../src/modules/identity/public/index.js';
import { parseUserPublicId } from '../../src/modules/identity/domain/index.js';

const id = parseUserPublicId('00000000-0000-4000-8000-0000000000aa');
const repos = (status: 'active' | 'disabled' | 'closed' | null) => (() => ({ users: { findByPublicId: async () => status === null ? null : { publicId: id, status } } })) as never;
const executor = {} as never;

describe('IDN-20 Identity public contract', () => {
  it('exposes active status, inactivity, and safe summaries without internal ids', async () => {
    const query = createIdentityPublicQuery(repos('active'), executor);
    expect(await query.isIdentityActive(id)).toBe(true);
    expect(await query.getIdentityAccountStatus(id)).toBe('active');
    expect(await query.getIdentitySummary(id)).toEqual({ userPublicId: id, status: 'active' });
    const disabled = createIdentityPublicQuery(repos('disabled'), executor);
    expect(await disabled.isIdentityActive(id)).toBe(false);
    expect(await disabled.getIdentityAccountStatus(id)).toBe('disabled');
    const missing = createIdentityPublicQuery(repos(null), executor);
    expect(await missing.isIdentityActive(id)).toBe(false);
    expect(await missing.getIdentityAccountStatus(id)).toBeNull();
    expect(await missing.getIdentitySummary(id)).toBeNull();
  });

  it('returns instances typed against the stable IdentityPublicQueries interface', async () => {
    const query: IdentityPublicQueries = createIdentityPublicQuery(repos('active'), executor);
    const summary: IdentityPublicSummary | null = await query.getIdentitySummary(id);
    expect(summary).toEqual({ userPublicId: id, status: 'active' });
  });

  it('never exposes internal types, repositories, executors, or hashes through the public barrel', async () => {
    const barrel = await readFile(path.resolve('src/modules/identity/public/index.ts'), 'utf8');
    const forbidden = ['UserInternalId', 'SessionInternalId', 'DeviceInternalId', 'OtpChallengeInternalId', 'AuthIdentityInternalId', 'IdentityRepositories', 'UserRepository', 'DatabaseExecutor', 'TransactionManager', 'RefreshTokenHash', 'OtpCodeHash', 'IdentityPublicQueryImpl', 'PostgresUserRepository', 'IdentityEventWriter'];
    for (const name of forbidden) expect(barrel).not.toContain(name);
    expect(barrel).toContain('IdentityPublicQueries');
    expect(barrel).toContain('IdentityPublicSummary');
    const querySource = await readFile(path.resolve('src/modules/identity/public/query.ts'), 'utf8');
    for (const name of ['DatabaseExecutor', 'IdentityRepositories', 'TransactionManager', 'RefreshTokenHash', 'OtpCodeHash']) expect(querySource).not.toContain(name);
  });
});
