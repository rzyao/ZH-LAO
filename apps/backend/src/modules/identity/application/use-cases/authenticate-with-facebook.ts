import { AppError } from '../../../../errors/app-error.js';
import type { TransactionManager } from '../../../../database/transaction-manager.js';
import { newLogicalUuid } from '../../../../ids/uuid.js';
import type { LearningDirection, RefreshTokenHash, UserPublicId } from '../../domain/index.js';
import type { IdentityRepositories } from '../ports/index.js';
import type { FacebookCredentialVerifier, IdentityEventWriter } from '../services/index.js';

export interface FacebookTokenPort { prepareRefresh(): { rawRefreshToken: string; hash: RefreshTokenHash }; issueAccess(user: UserPublicId): string }
export class AuthenticateWithFacebook {
  constructor(private readonly verifier: FacebookCredentialVerifier, private readonly transactions: TransactionManager, private readonly repositories: (executor: import('../../../../database/executor.js').DatabaseExecutor) => IdentityRepositories, private readonly tokens: FacebookTokenPort, private readonly events?: IdentityEventWriter, private readonly now: () => Date = () => new Date()) {}
  async execute(input: { credential: string; learningDirection?: LearningDirection }) {
    const verified = await this.verifier.verify(input.credential); const prepared = this.tokens.prepareRefresh(); const now = this.now(); const expiresAt = new Date(now.getTime() + 2_592_000_000);
    const result = await this.transactions.run(async executor => { const repos = this.repositories(executor); let identity = await repos.authIdentities.findByProviderAndSubject('facebook', verified.providerSubject); let isNewUser = false; let user;
      if (identity) { user = await repos.users.findByInternalId(identity.userId); if (!user || user.status !== 'active') throw new AppError({ code: user?.status === 'closed' ? 'ACCOUNT_CLOSED' : 'ACCOUNT_DISABLED', message: 'Account unavailable', httpStatus: 403 }); }
      else { if (!input.learningDirection) throw new AppError({ code: 'INVALID_CREDENTIAL', message: 'Learning direction is required', httpStatus: 400 }); user = await repos.users.create({ publicId: newLogicalUuid() as UserPublicId, status: 'active' }); identity = await repos.authIdentities.create({ userId: user.id, provider: 'facebook', providerSubject: verified.providerSubject, verifiedAt: now }); await repos.learningProfiles.create({ userId: user.id, direction: input.learningDirection }); await repos.basicProfiles.create({ userId: user.id }); if (this.events) await this.events.userRegistered(executor, { userPublicId: user.publicId, provider: 'facebook', direction: input.learningDirection, occurredAt: now }); isNewUser = true; }
      await repos.sessions.create({ userId: user.id, refreshTokenHash: prepared.hash, expiresAt }); await repos.authIdentities.touchLastLogin(identity.id, now); await repos.users.updateLastActiveAt(user.id, now); return { user, isNewUser };
    });
    return { userPublicId: result.user.publicId, isNewUser: result.isNewUser, accessToken: this.tokens.issueAccess(result.user.publicId), refreshToken: prepared.rawRefreshToken, expiresIn: 900, sessionExpiresAt: expiresAt };
  }
}
