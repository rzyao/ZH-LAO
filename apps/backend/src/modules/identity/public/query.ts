import type { IdentityAccountStatus, UserPublicId } from '../domain/index.js';

// Cross-domain public query contract for Identity. Other domains may only rely
// on this boundary; it never exposes internal BIGINT, repositories, hashes, or
// tokens. Reads are plain non-transactional lookups. Instances are created by
// the Identity composition root via an internal factory and handed out as this
// interface, so downstream domains never see construction internals.
export type IdentityPublicSummary = Readonly<{ userPublicId: UserPublicId; status: IdentityAccountStatus }>;

export interface IdentityPublicQueries {
  getIdentityAccountStatus(id: UserPublicId): Promise<IdentityAccountStatus | null>;
  isIdentityActive(id: UserPublicId): Promise<boolean>;
  getIdentitySummary(id: UserPublicId): Promise<IdentityPublicSummary | null>;
}
