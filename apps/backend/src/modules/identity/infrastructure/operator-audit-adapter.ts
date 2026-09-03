import type { AppError } from '../../../errors/app-error.js';
import { parseLogicalUuid } from '../../../ids/uuid.js';
import type { OperationsAuditRecorder, OperationsOperatorResolver } from '../../operations/public/index.js';
import type { AdminAuditRecorder } from '../application/ports/admin-audit-port.js';

/**
 * Identity -> Operations audit boundary (Constitution Principle XI).
 *
 * The Identity module is the canonical owner of authentication facts; the
 * Operations module owns the operator/audit facts. This adapter is the only
 * place where Identity writes a successful operator audit: it resolves the
 * operator by its logical subject UUID (never a cross-domain FK) and delegates
 * to `OperationsAuditRecorder.recordSuccessfulAction`.
 *
 * audit.md success semantics: ONLY successful actions are recorded. When the
 * subject has no operator mapping the action is silently skipped (no audit row
 * is fabricated); failures are never written as a successful audit.
 */
export class OperatorAuditAdapter implements AdminAuditRecorder {
  constructor(
    private readonly operators: OperationsOperatorResolver,
    private readonly audit: OperationsAuditRecorder,
  ) {}

  async recordSuccessfulAdminAction(input: Readonly<{
    subjectId: string;
    actionKey: string;
    target?: { domain: string; type: string; id?: string | undefined } | undefined;
    requestContext?: { requestId?: string | undefined; ipAddress?: string | undefined } | undefined;
    details?: Readonly<Record<string, unknown>> | undefined;
  }>): Promise<void> {
    let operator: { operatorId: string; authSubjectId: string };
    try {
      // Resolve by logical subject UUID; throws OPERATOR_ACCESS_DENIED /
      // OPERATOR_DISABLED when there is no active operator mapping.
      const summary = await this.operators.resolveCurrentOperator({ subjectId: parseLogicalUuid(input.subjectId) });
      operator = { operatorId: summary.operatorId, authSubjectId: summary.authSubjectId };
    } catch (cause) {
      // No operator mapping or operator disabled -> nothing to audit. This is
      // expected for phone/OTP consumers of the shared session endpoints, so it
      // must not bubble up as an audit failure.
      if (cause instanceof Error && (cause as AppError).code === 'OPERATOR_ACCESS_DENIED') return;
      if (cause instanceof Error && (cause as AppError).code === 'OPERATOR_DISABLED') return;
      throw cause;
    }

    await this.audit.recordSuccessfulAction({
      operator,
      actionKey: input.actionKey,
      target: input.target,
      requestContext: input.requestContext,
      details: input.details,
    });
  }
}
