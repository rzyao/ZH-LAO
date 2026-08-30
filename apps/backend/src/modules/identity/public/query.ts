import type { DatabaseExecutor } from '../../../database/executor.js';
import type { IdentityRepositories } from '../application/ports/index.js';
import type { IdentityAccountStatus, UserPublicId } from '../domain/index.js';

// Cross-domain public query contract for Identity. Other domains may only rely
// on this boundary; it never exposes internal BIGINT, repositories, hashes, or
// tokens. Reads are plain non-transactional lookups.
export type IdentityPublicSummary = Readonly<{ userPublicId: UserPublicId; status: IdentityAccountStatus }>;

export class IdentityPublicQuery {
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