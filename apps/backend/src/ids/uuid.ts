import { randomUUID } from 'node:crypto';

export type LogicalUuid = string & { readonly __logicalUuid: unique symbol };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isLogicalUuid(value: unknown): value is LogicalUuid {
  return typeof value === 'string' && UUID.test(value);
}
export function parseLogicalUuid(value: unknown): LogicalUuid {
  if (!isLogicalUuid(value)) throw new TypeError('Expected a logical UUID');
  return value;
}
export function newLogicalUuid(): LogicalUuid {
  return randomUUID() as LogicalUuid;
}
