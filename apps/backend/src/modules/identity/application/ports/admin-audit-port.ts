export type AdminAuditRequestContext = Readonly<{ requestId?: string | undefined; ipAddress?: string | undefined }>;
export type AdminAuditTarget = Readonly<{ domain: string; type: string; id?: string | undefined }>;

/**
 * Identity -> Operations audit boundary.
 *
 * Only successful actions are recorded; failures go to the security log and
 * must never be written as a successful operator audit (audit.md success
 * semantics). The adapter resolves the operator by subject UUID and delegates
 * to OperationsService.recordSuccessfulAction.
 */
export interface AdminAuditRecorder {
  recordSuccessfulAdminAction(input: Readonly<{
    subjectId: string;
    actionKey: string;
    target?: AdminAuditTarget | undefined;
    requestContext?: AdminAuditRequestContext | undefined;
    details?: Readonly<Record<string, unknown>> | undefined;
  }>): Promise<void>;
}