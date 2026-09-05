const catalog = [
  'operations.operators.read','operations.operators.create','operations.operators.update','operations.operators.disable','operations.operators.enable','operations.operators.reset_password',
  'operations.roles.read','operations.roles.create','operations.roles.update','operations.roles.disable','operations.roles.enable',
  'operations.operator_roles.read','operations.operator_roles.assign','operations.operator_roles.revoke',
  'operations.role_permissions.read','operations.role_permissions.set','operations.audit_logs.read',
  'platform.feature_flags.read','platform.feature_flags.write','platform.runtime_configs.read','platform.runtime_configs.write',
  'platform.app_versions.read','platform.app_versions.write','platform.announcements.read','platform.announcements.write','platform.regions.read','platform.regions.write',
  'platform.menus.read','platform.menus.write',
  'content.zh_pinyin_elements.read','content.zh_pinyin_elements.write','content.zh_pinyin_elements.review','content.zh_pinyin_elements.publish',
  'content.zh_syllables.read','content.zh_syllables.write','content.zh_syllables.review','content.zh_syllables.publish',
  'content.zh_hanzi.read','content.zh_hanzi.write','content.zh_hanzi.review','content.zh_hanzi.publish',
  'content.zh_words.read','content.zh_words.write','content.zh_words.review','content.zh_words.publish',
  'content.zh_sentences.read','content.zh_sentences.write','content.zh_sentences.review','content.zh_sentences.publish',
  'content.lo_letters.read','content.lo_letters.write','content.lo_letters.review','content.lo_letters.publish',
  'content.lo_syllables.read','content.lo_syllables.write','content.lo_syllables.review','content.lo_syllables.publish',
  'content.lo_words.read','content.lo_words.write','content.lo_words.review','content.lo_words.publish',
  'content.lo_sentences.read','content.lo_sentences.write','content.lo_sentences.review','content.lo_sentences.publish',
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
