import { randomUUID } from 'node:crypto';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import { AppError } from '../../../../errors/app-error.js';
import type { OperationsRepository, OperatorRecord } from '../ports/index.js';
import type { AuthorizedOperatorContext } from '../../public/index.js';

export class AdminOperatorWriter {
  constructor(private readonly repository: OperationsRepository) {}

  async create(executor: DatabaseExecutor, actor: AuthorizedOperatorContext, input: { authSubjectId: string; displayName: string; requestId?: string; ipAddress?: string }): Promise<OperatorRecord> {
    const displayName = input.displayName.trim();
    if (!displayName || displayName.length > 100) {
      throw new AppError({ code: 'INVALID_ARGUMENT', message: 'Invalid display name', httpStatus: 400 });
    }
    const operator = await this.repository.createOperator(executor, {
      id: randomUUID(),
      authSubjectId: input.authSubjectId,
      displayName,
    });
    await this.repository.insertAudit(executor, {
      id: randomUUID(),
      operatorId: actor.operatorId,
      actionKey: 'operations.operators.create',
      targetDomain: 'operations',
      targetType: 'operator',
      targetId: operator.id,
      requestId: input.requestId,
      ipAddress: input.ipAddress,
      details: {},
    });
    return operator;
  }
}
