import { z } from 'zod';

const uuidSchema = z.string().uuid();
const roleCodeSchema = z.string().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/);
const permissionShapeSchema = z.string().max(100).regex(/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/);

export type OperatorId = string & { readonly __operatorId: unique symbol };
export type RoleId = string & { readonly __roleId: unique symbol };
export type AuditLogId = string & { readonly __auditLogId: unique symbol };
export type OperatorStatus = 'active' | 'disabled';
export type RoleStatus = 'active' | 'disabled';
export type RoleCode = string & { readonly __roleCode: unique symbol };
export type AuditActionKey = string & { readonly __auditActionKey: unique symbol };

export const parseOperatorId = (value: string): OperatorId => uuidSchema.parse(value) as OperatorId;
export const parseRoleId = (value: string): RoleId => uuidSchema.parse(value) as RoleId;
export const parseAuditLogId = (value: string): AuditLogId => uuidSchema.parse(value) as AuditLogId;
export const parseRoleCode = (value: string): RoleCode => roleCodeSchema.parse(value) as RoleCode;
export const parseAuditActionKey = (value: string): AuditActionKey => permissionShapeSchema.parse(value) as AuditActionKey;
export const operatorStatusSchema = z.enum(['active', 'disabled']);
export const roleStatusSchema = z.enum(['active', 'disabled']);
