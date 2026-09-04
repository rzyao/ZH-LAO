const catalog = [
  'operations.operators.read','operations.operators.create','operations.operators.update','operations.operators.disable','operations.operators.enable',
  'operations.roles.read','operations.roles.create','operations.roles.update','operations.roles.disable','operations.roles.enable',
  'operations.operator_roles.read','operations.operator_roles.assign','operations.operator_roles.revoke',
  'operations.role_permissions.read','operations.role_permissions.set','operations.audit_logs.read',
  'platform.feature_flags.read','platform.feature_flags.write','platform.runtime_configs.read','platform.runtime_configs.write',
  'platform.app_versions.read','platform.app_versions.write','platform.announcements.read','platform.announcements.write','platform.regions.read','platform.regions.write',
  'platform.menus.read','platform.menus.write',
  'content.letters.write','content.letters.review','content.letters.publish',
] as const;

export type OperatorPermissionKey = (typeof catalog)[number];
export const OPERATOR_PERMISSION_CATALOG: readonly OperatorPermissionKey[] = Object.freeze([...catalog].sort());
const permissionSet = new Set<string>(OPERATOR_PERMISSION_CATALOG);
export function isOperatorPermissionKey(value: string): value is OperatorPermissionKey { return permissionSet.has(value); }
export function assertOperatorPermissionKey(value: string): OperatorPermissionKey {
  if (!isOperatorPermissionKey(value)) throw new Error(`Invalid operator permission: ${value}`);
  return value;
}
export function parsePermissionKey(key: OperatorPermissionKey): Readonly<{key:OperatorPermissionKey;domain:string;resource:string;action:string}> {
  const [domain, resource, action] = key.split('.');
  return { key, domain: domain!, resource: resource!, action: action! };
}
