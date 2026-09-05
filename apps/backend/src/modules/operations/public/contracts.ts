import type { AuthContext } from '../../../auth/auth-context.js';
import type { OperatorPermissionKey } from './permissions.js';
export type AuthorizedOperatorContext=Readonly<{operatorId:string;authSubjectId:string}>;
export type OperatorSummary=Readonly<{operatorId:string;authSubjectId:string;displayName:string;status:'active'|'disabled'}>;
export type AuditTarget=Readonly<{domain:string;type:string;id?:string|undefined}>;
export type AuditRequestContext=Readonly<{requestId?:string|undefined;ipAddress?:string|undefined}>;
export interface OperationsAuthorizer{requirePermission(authContext:AuthContext,permission:OperatorPermissionKey):Promise<AuthorizedOperatorContext>}
export interface OperationsOperatorResolver{resolveCurrentOperator(authContext:AuthContext):Promise<OperatorSummary>}
export interface OperationsAuditRecorder{recordSuccessfulAction(input:Readonly<{operator:AuthorizedOperatorContext;actionKey:string;target?:AuditTarget|undefined;requestContext?:AuditRequestContext|undefined;details?:Readonly<Record<string,unknown>>|undefined}>):Promise<void>}
export interface OperationsTransactionalAuditBoundary {
  recordSuccessfulActionInTransaction(
    executor: import('../../../database/executor.js').DatabaseExecutor,
    input: Readonly<{
      operatorId: string;
      actionKey: string;
      target: Readonly<{ domain: 'content'; type: 'course' | 'lesson'; id: string }>;
      requestContext?: AuditRequestContext | undefined;
      details?: Readonly<Record<string, unknown>> | undefined;
    }>,
  ): Promise<void>;
}
export interface OperationsBatchWorkerBoundary {
  requireOperatorPermissionInTransaction(
    executor: import('../../../database/executor.js').DatabaseExecutor,
    operatorId: string,
    permission: OperatorPermissionKey,
  ): Promise<void>;
  recordBatchSuccessfulActionInTransaction(
    executor: import('../../../database/executor.js').DatabaseExecutor,
    input: Readonly<{
      operatorId: string;
      actionKey: string;
      contentId: string;
      batchTaskId: string;
    }>,
  ): Promise<void>;
}
