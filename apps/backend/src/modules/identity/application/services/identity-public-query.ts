import type { DatabaseExecutor } from '../../../../database/executor.js';
import type { IdentityAccountStatus, UserPublicId } from '../../domain/index.js';
import type { IdentityPublicQueries, IdentityPublicSummary } from '../../public/query.js';
import type { IdentityRepositories } from '../ports/index.js';

// Internal implementation of the Identity public query contract. It is the only
// place that knows about repositories/executor; composition is performed inside
// the Identity module so downstream domains only ever depend on
// `identity/public` and receive an `IdentityPublicQueries` instance.
export class IdentityPublicQueryImpl implements IdentityPublicQueries {
  constructor(private readonly repositories: (executor: DatabaseExecutor) => IdentityRepositories, private readonly executor: DatabaseExecutor) {}
  async getIdentityAccountStatus(id: UserPublicId): Promise<IdentityAccountStatus | null> {
    const user = await this.repositories(this.executor).users.findByPublicId(id);
    return user?.status ?? null;
  }
  async isIdentityActive(id: UserPublicId): Promise<boolean> {
    const user = await this.repositories(this.executor).users.findByPublicId(id);
    return user?.status === 'active';
  }
  async getIdentitySummary(id: UserPublicId): Promise<IdentityPublicSummary | null> {
    const user = await this.repositories(this.executor).users.findByPublicId(id);
    return user ? { userPublicId: user.publicId, status: user.status } : null;
  }
}

// Identity-internal composition entry. Downstream domains should never call this
// directly; the Identity composition root hands out an `IdentityPublicQueries`.
export function createIdentityPublicQuery(repositories: (executor: DatabaseExecutor) => IdentityRepositories, executor: DatabaseExecutor): IdentityPublicQueries {
  return new IdentityPublicQueryImpl(repositories, executor);
}
