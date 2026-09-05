import type { TransactionManager } from '../../../database/transaction-manager.js';
import type { AuthorizedOperatorContext } from '../../operations/public/index.js';
import { AdminAccountWriter } from '../../identity/public/admin-account-writer.js';
import { AdminOperatorWriter } from '../../operations/public/index.js';

export class AdminOperatorProvisioningService {
  constructor(
    private readonly transactions: TransactionManager,
    private readonly identityWriter: AdminAccountWriter,
    private readonly operationsWriter: AdminOperatorWriter,
  ) {}

  async create(actor: AuthorizedOperatorContext, input: { username: string; displayName: string; requestId?: string; ipAddress?: string }) {
    return this.transactions.run(async executor => {
      const account = await this.identityWriter.create(executor, { username: input.username });
      const operator = await this.operationsWriter.create(executor, actor, {
        authSubjectId: account.subjectId,
        displayName: input.displayName,
        ...(input.requestId ? { requestId: input.requestId } : {}),
        ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
      });
      return { operator, initialPassword: account.initialPassword };
    });
  }
}
