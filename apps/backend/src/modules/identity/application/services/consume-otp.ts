import { AppError } from '../../../../errors/app-error.js';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import type { TransactionManager } from '../../../../database/transaction-manager.js';
import type { IdentityRepositories } from '../ports/index.js';
import type { OtpHasher } from './otp-services.js';
import type { E164PhoneNumber, OtpPurpose, RawOtpCode } from '../../domain/index.js';

export class OtpConsumptionEngine {
  constructor(private readonly repositories: (executor: DatabaseExecutor) => IdentityRepositories, private readonly hasher: OtpHasher, private readonly now: () => Date = () => new Date()) {}
  async consumeWithinTransaction<T>(executor: DatabaseExecutor, input: { phone: E164PhoneNumber; purpose: OtpPurpose; code: RawOtpCode }, action: () => Promise<T>): Promise<T> {
    const repos=this.repositories(executor); const challenge=await repos.otpChallenges.lockLatestPending(input.phone,input.purpose);
    if(!challenge) throw new AppError({code:'OTP_ALREADY_USED',message:'OTP cannot be used',httpStatus:409});
    if(challenge.expiresAt.getTime()<=this.now().getTime()){await repos.otpChallenges.updateStatus(challenge.id,'expired');throw new AppError({code:'OTP_EXPIRED',message:'OTP has expired',httpStatus:400});}
    if(challenge.attemptCount>=challenge.maxAttempts){await repos.otpChallenges.updateStatus(challenge.id,'locked');throw new AppError({code:'OTP_LOCKED',message:'OTP is locked',httpStatus:400});}
    if(!this.hasher.verify({code:input.code,phone:input.phone,purpose:input.purpose,hash:challenge.codeHash})){const updated=await repos.otpChallenges.incrementAttemptCount(challenge.id);if(updated?.attemptCount===updated?.maxAttempts)await repos.otpChallenges.updateStatus(challenge.id,'locked');throw new AppError({code:updated?.status==='locked'?'OTP_LOCKED':'OTP_INVALID',message:'OTP is invalid',httpStatus:400});}
    const result=await action(); await repos.otpChallenges.markVerified(challenge.id,this.now()); return result;
  }
  async persistInvalidAttempt(transactions: TransactionManager, phone: E164PhoneNumber, purpose: OtpPurpose): Promise<never> { const result=await transactions.run(async executor=>{const repos=this.repositories(executor);const current=await repos.otpChallenges.lockLatestPending(phone,purpose);if(!current) return 'OTP_ALREADY_USED';const updated=await repos.otpChallenges.incrementAttemptCount(current.id);if(updated&&updated.attemptCount>=updated.maxAttempts){await repos.otpChallenges.updateStatus(updated.id,'locked');return 'OTP_LOCKED';}return 'OTP_INVALID';});throw new AppError({code:result,message:'OTP is invalid',httpStatus:400}); }
}
