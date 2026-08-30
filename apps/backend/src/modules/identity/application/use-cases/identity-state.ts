import { AppError } from '../../../../errors/app-error.js';
import type { TransactionManager } from '../../../../database/transaction-manager.js';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import type { IdentityAccountStatus, UserPublicId } from '../../domain/index.js';
import type { IdentityRepositories } from '../ports/index.js';
import type { IdentityEventWriter } from '../services/index.js';

export type IdentitySummary = Readonly<{
  userPublicId: UserPublicId;
  status: IdentityAccountStatus;
  authProviders: ('phone' | 'facebook')[];
  learningProfile: Readonly<{ nativeLanguage: 'lo' | 'zh'; learningLanguage: 'lo' | 'zh' }> | null;
  basicProfile: Readonly<{ displayName: string | null; gender: 'male' | 'female' | 'other' | 'unspecified' | null; birthDate: string | null; countryCode: string | null; regionCode: string | null; avatarMediaId: string | null }> | null;
}>;

export class IdentityState {
  constructor(private readonly tx: TransactionManager, private readonly repos: (e: DatabaseExecutor) => IdentityRepositories, private readonly events?: IdentityEventWriter, private readonly now: () => Date = () => new Date()) {}
  async getCurrentIdentity(id: UserPublicId) {
    const user = await this.tx.run(executor => this.repos(executor).users.findByPublicId(id));
    if (!user) throw new AppError({ code: 'UNAUTHENTICATED', message: 'Identity unavailable', httpStatus: 401 });
    return { userPublicId: user.publicId, status: user.status };
  }
  async getIdentitySummary(id: UserPublicId): Promise<IdentitySummary> {
    return this.tx.run(async executor => {
      const repos = this.repos(executor);
      const user = await repos.users.findByPublicId(id);
      if (!user || user.status !== 'active') throw new AppError({ code: 'UNAUTHENTICATED', message: 'Identity unavailable', httpStatus: 401 });
      const providers = (await repos.authIdentities.listByUserId(user.id)).map(value => value.provider);
      const learning = await repos.learningProfiles.findByUserId(user.id);
      const profile = await repos.basicProfiles.findByUserId(user.id);
      return {
        userPublicId: user.publicId,
        status: user.status,
        authProviders: providers.filter((value): value is 'phone' | 'facebook' => value === 'phone' || value === 'facebook'),
        learningProfile: learning ? { nativeLanguage: learning.direction.nativeLanguage, learningLanguage: learning.direction.learningLanguage } : null,
        basicProfile: profile ? { displayName: profile.displayName, gender: profile.gender, birthDate: profile.birthDate, countryCode: profile.countryCode, regionCode: profile.regionCode, avatarMediaId: profile.avatarMediaId ?? null } : null
      };
    });
  }
  async changeStatus(id: UserPublicId, next: IdentityAccountStatus) {
    return this.tx.run(async executor => {
      const repos = this.repos(executor);
      const current = await repos.users.findByPublicId(id);
      if (!current) throw new AppError({ code: 'UNAUTHENTICATED', message: 'Identity unavailable', httpStatus: 401 });
      await repos.users.lockByInternalId(current.id);
      if (current.status === next || current.status === 'closed' || !((current.status === 'active' && ['disabled', 'closed'].includes(next)) || (current.status === 'disabled' && ['active', 'closed'].includes(next)))) throw new AppError({ code: 'INVALID_DATA', message: 'Invalid status transition', httpStatus: 409 });
      const updated = await repos.users.updateStatus(current.id, next);
      const occurredAt = this.now();
      if (next !== 'active') await repos.sessions.revokeAllByUserId(current.id, occurredAt, 'account_status_changed');
      if (this.events) await this.events.accountStatusChanged(executor, { userPublicId: current.publicId, previous: current.status, next, occurredAt });
      return { userPublicId: updated!.publicId, status: updated!.status };
    });
  }
}