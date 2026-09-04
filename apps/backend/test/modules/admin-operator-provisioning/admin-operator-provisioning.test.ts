import { describe, expect, it, vi } from 'vitest';
import type { TransactionManager } from '../../../src/database/transaction-manager.js';
import { AdminOperatorProvisioningService } from '../../../src/modules/admin-operator-provisioning/application/admin-operator-provisioning-service.js';

const actor = { operatorId: 'actor-1', authSubjectId: 'actor-subject' };
const executor = { query: vi.fn() };
const operator = {
  id: 'operator-2', authSubjectId: 'subject-2', displayName: '新操作员', status: 'active' as const,
  createdAt: new Date('2026-09-04T00:00:00.000Z'), updatedAt: new Date('2026-09-04T00:00:00.000Z'),
};

function transactionManager() {
  const run = vi.fn(async (callback: (value: typeof executor) => Promise<unknown>) => callback(executor));
  return { run } as unknown as TransactionManager;
}

describe('AdminOperatorProvisioningService', () => {
  it('uses one transaction executor for the independent account, operator, and audit workflow', async () => {
    const transactions = transactionManager();
    const identityWriter = { create: vi.fn().mockResolvedValue({ subjectId: 'subject-2', initialPassword: 'SafePassword123' }) };
    const operationsWriter = { create: vi.fn().mockResolvedValue(operator) };
    const service = new AdminOperatorProvisioningService(transactions, identityWriter as never, operationsWriter as never);

    await expect(service.create(actor, { username: 'operator_zhang', displayName: ' 新操作员 ', requestId: 'request-1' })).resolves.toEqual({ operator, initialPassword: 'SafePassword123' });

    expect(transactions.run).toHaveBeenCalledOnce();
    expect(identityWriter.create).toHaveBeenCalledWith(executor, { username: 'operator_zhang' });
    expect(operationsWriter.create).toHaveBeenCalledWith(executor, actor, expect.objectContaining({
      authSubjectId: 'subject-2', displayName: ' 新操作员 ', requestId: 'request-1',
    }));
  });

  it('propagates an Operations write failure through the transaction instead of returning an initial password', async () => {
    const transactions = transactionManager();
    const identityWriter = { create: vi.fn().mockResolvedValue({ subjectId: 'subject-2', initialPassword: 'SafePassword123' }) };
    const operationsWriter = { create: vi.fn().mockRejectedValue(new Error('audit write failed')) };
    const service = new AdminOperatorProvisioningService(transactions, identityWriter as never, operationsWriter as never);

    await expect(service.create(actor, { username: 'operator_zhang', displayName: '新操作员' })).rejects.toThrow('audit write failed');
    expect(operationsWriter.create).toHaveBeenCalledOnce();
  });
});
