import type { DatabaseExecutor } from '../../../../database/executor.js';

export type OperatorRecord = Readonly<{id:string;authSubjectId:string;displayName:string;status:'active'|'disabled';createdAt:Date;updatedAt:Date}>;
export type RoleRecord = Readonly<{id:string;code:string;name:string;description:string|null;status:'active'|'disabled';createdAt:Date;updatedAt:Date}>;
export type AssignedRoleRecord = Readonly<RoleRecord & {assignedAt:Date}>;
export type AuditRecord = Readonly<{id:string;operatorId:string;actionKey:string;targetDomain:string|null;targetType:string|null;targetId:string|null;requestId:string|null;ipAddress:string|null;details:Readonly<Record<string,unknown>>;createdAt:Date}>;
export type Page<T> = Readonly<{items:readonly T[];total:number}>;
export type AuditPage = Readonly<{items:readonly AuditRecord[];nextCursor:string|null}>;

export interface OperationsRepository {
  findOperatorById(db:DatabaseExecutor,id:string,lock?:boolean):Promise<OperatorRecord|null>;
  findOperatorByAuthSubjectId(db:DatabaseExecutor,id:string,lock?:boolean):Promise<OperatorRecord|null>;
  listOperators(db:DatabaseExecutor,input:{page:number;pageSize:number;status?:'active'|'disabled'}):Promise<Page<OperatorRecord>>;
  createOperator(db:DatabaseExecutor,input:{id:string;authSubjectId:string;displayName:string}):Promise<OperatorRecord>;
  updateOperatorDisplayName(db:DatabaseExecutor,id:string,displayName:string):Promise<OperatorRecord|null>;
  updateOperatorStatus(db:DatabaseExecutor,id:string,status:'active'|'disabled'):Promise<OperatorRecord|null>;
  countOperators(db:DatabaseExecutor):Promise<number>;

  findRoleById(db:DatabaseExecutor,id:string,lock?:boolean):Promise<RoleRecord|null>;
  findRoleByCode(db:DatabaseExecutor,code:string,lock?:boolean):Promise<RoleRecord|null>;
  listRoles(db:DatabaseExecutor,input:{page:number;pageSize:number;status?:'active'|'disabled'}):Promise<Page<RoleRecord>>;
  createRole(db:DatabaseExecutor,input:{id:string;code:string;name:string;description?:string|null}):Promise<RoleRecord>;
  updateRole(db:DatabaseExecutor,id:string,input:{name?:string;description?:string|null;status?:'active'|'disabled'}):Promise<RoleRecord|null>;

  listAssignedRoles(db:DatabaseExecutor,operatorId:string):Promise<readonly AssignedRoleRecord[]>;
  addOperatorRole(db:DatabaseExecutor,operatorId:string,roleId:string):Promise<boolean>;
  removeOperatorRole(db:DatabaseExecutor,operatorId:string,roleId:string):Promise<boolean>;
  hasOperatorRole(db:DatabaseExecutor,operatorId:string,roleId:string):Promise<boolean>;
  countActiveOperatorsWithRole(db:DatabaseExecutor,roleId:string):Promise<number>;

  listRolePermissions(db:DatabaseExecutor,roleId:string):Promise<readonly string[]>;
  replaceRolePermissions(db:DatabaseExecutor,roleId:string,permissionKeys:readonly string[]):Promise<{added:readonly string[];removed:readonly string[]}>;
  getEffectivePermissions(db:DatabaseExecutor,operatorId:string):Promise<readonly string[]>;

  insertAudit(db:DatabaseExecutor,input:{id:string;operatorId:string;actionKey:string;targetDomain?:string;targetType?:string;targetId?:string;requestId?:string;ipAddress?:string;details?:Readonly<Record<string,unknown>>}):Promise<AuditRecord>;
  findAudit(db:DatabaseExecutor,id:string):Promise<AuditRecord|null>;
  listAudits(db:DatabaseExecutor,input:{operatorId?:string;actionKey?:string;targetDomain?:string;targetType?:string;targetId?:string;requestId?:string;createdFrom?:Date;createdTo?:Date;cursor?:string;limit:number}):Promise<AuditPage>;
}
