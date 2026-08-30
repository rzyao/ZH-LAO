import type { AuthContext } from '../../../auth/auth-context.js';
import type { OperatorPermissionKey } from './permissions.js';
export type AuthorizedOperatorContext=Readonly<{operatorId:string;authSubjectId:string}>;
export type OperatorSummary=Readonly<{operatorId:string;authSubjectId:string;displayName:string;status:'active'|'disabled'}>;
export type AuditTarget=Readonly<{domain:string;type:string;id?:string|undefined}>;
export type AuditRequestContext=Readonly<{requestId?:string|undefined;ipAddress?:string|undefined}>;
export interface OperationsAuthorizer{requirePermission(authContext:AuthContext,permission:OperatorPermissionKey):Promise<AuthorizedOperatorContext>}
export interface OperationsOperatorResolver{resolveCurrentOperator(authContext:AuthContext):Promise<OperatorSummary>}
export interface OperationsAuditRecorder{recordSuccessfulAction(input:Readonly<{operator:AuthorizedOperatorContext;actionKey:string;target?:AuditTarget|undefined;requestContext?:AuditRequestContext|undefined;details?:Readonly<Record<string,unknown>>|undefined}>):Promise<void>}
