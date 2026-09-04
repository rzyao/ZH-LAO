import { AppError } from '../../../../errors/app-error.js';
import { IDENTITY_CONFLICT } from '../../../../errors/business-codes.js';
import type { TransactionManager } from '../../../../database/transaction-manager.js';
import { newLogicalUuid } from '../../../../ids/uuid.js';
import type { DevicePlatform, InstallationId, LearningDirection, RefreshTokenHash, UserPublicId } from '../../domain/index.js';
import type { IdentityRepositories } from '../ports/index.js';
import type { FacebookCredentialVerifier, IdentityEventWriter } from '../services/index.js';
import { registerDeviceForAuth } from '../services/device-registration.js';

export interface FacebookTokenPort { prepareRefresh(): { rawRefreshToken: string; hash: RefreshTokenHash }; issueAccess(user: UserPublicId): string }
export type FacebookAuthInput = Readonly<{ credential: string; learningDirection?: LearningDirection; device?: { installationId: InstallationId; platform: DevicePlatform; deviceName?: string | null; appVersion?: string | null; pushToken?: string | null } }>;
export class AuthenticateWithFacebook {
  constructor(private readonly verifier: FacebookCredentialVerifier, private readonly transactions: TransactionManager, private readonly repositories: (executor: import('../../../../database/executor.js').DatabaseExecutor) => IdentityRepositories, private readonly tokens: FacebookTokenPort, private readonly events?: IdentityEventWriter, private readonly now: () => Date = () => new Date()) {}
  async execute(input: FacebookAuthInput) {
    const verified = await this.verifier.verify(input.credential); const prepared = this.tokens.prepareRefresh(); const now = this.now(); const expiresAt = new Date(now.getTime() + 2_592_000_000);
    // Facebook 注册没有类似 OTP challenge 的自然串行点：同 subject 并发首次登录时，
    // 由 UNIQUE(provider, provider_subject) 裁决唯一赢家。输家在 create 分支插入
    // auth_identities 时撞唯一约束（IDENTITY_CONFLICT），整笔事务已回滚（无孤儿用户）。
    // 赢家此时必然已提交，因此输家有界重试一次即可经 SELECT 读到规范 identity，
    // 以「既有用户登录」(OK, is_new_user=false) 收敛到同一 canonical user ——
    // 而不是把良性并发变成硬错误。DB 唯一约束是裁决者，这里只做 select-after-conflict。
    let created = false;
    for (let attempt = 0; attempt <= 2; attempt++) {
      created = false;
      try {
        const result = await this.transactions.run(async executor => {
          const repos = this.repositories(executor); let identity = await repos.authIdentities.findByProviderAndSubject('facebook', verified.providerSubject); let isNewUser = false; let user;
          if (identity) { user = await repos.users.lockByInternalId(identity.userId); if (!user || user.status !== 'active') throw new AppError({ code: user?.status === 'closed' ? 'ACCOUNT_CLOSED' : 'ACCOUNT_DISABLED', message: 'Account unavailable', httpStatus: 403 }); if (input.learningDirection) { const learning = await repos.learningProfiles.findByUserId(user.id); if (learning && (learning.direction.nativeLanguage !== input.learningDirection.nativeLanguage || learning.direction.learningLanguage !== input.learningDirection.learningLanguage)) throw new AppError({ code: 'LEARNING_DIRECTION_IMMUTABLE', message: 'Learning direction cannot change', httpStatus: 409 }); } }
          else {
            if (!input.learningDirection) throw new AppError({ code: 'INVALID_CREDENTIAL', message: 'Learning direction is required', httpStatus: 400 });
            user = await repos.users.create({ publicId: newLogicalUuid() as UserPublicId, status: 'active' });
            created = true;
            identity = await repos.authIdentities.create({ userId: user.id, provider: 'facebook', providerSubject: verified.providerSubject, verifiedAt: now });
            await repos.learningProfiles.create({ userId: user.id, direction: input.learningDirection }); await repos.basicProfiles.create({ userId: user.id });
            if (this.events) await this.events.userRegistered(executor, { userPublicId: user.publicId, provider: 'facebook', direction: input.learningDirection, occurredAt: now });
            isNewUser = true;
          }
          const deviceId = input.device ? await registerDeviceForAuth(repos, user.id, input.device) : null;
          await repos.sessions.create({ userId: user.id, deviceId, refreshTokenHash: prepared.hash, expiresAt }); await repos.authIdentities.touchLastLogin(identity.id, now); await repos.users.updateLastActiveAt(user.id, now); return { user, isNewUser };
        });
        return { userPublicId: result.user.publicId, isNewUser: result.isNewUser, accessToken: this.tokens.issueAccess(result.user.publicId), refreshToken: prepared.rawRefreshToken, expiresIn: 900, sessionExpiresAt: expiresAt };
      } catch (error) {
        if (!(created && error instanceof AppError && error.code === IDENTITY_CONFLICT)) throw error;
        // Race lost while creating: the winning transaction committed the canonical
        // identity, so the next attempt resolves as an existing-user login.
      }
    }
    throw new AppError({ code: IDENTITY_CONFLICT, message: 'Facebook identity is being registered concurrently; retry the request', httpStatus: 409 });
  }
}
