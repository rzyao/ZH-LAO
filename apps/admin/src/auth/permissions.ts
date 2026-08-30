/**
 * Permission key contract (frozen in ADMIN_FOUNDATION_PLAN §38).
 *
 * Keys follow Operations' RBAC pattern: `<domain>.<resource>.<action>`
 * e.g. `content.course.read`, `audio.task.review`, `trust.case.decide`.
 *
 * Wildcards are supported for checks: `domain.*.*` and `domain.resource.*`.
 */

export type DomainName =
  | 'identity'
  | 'content'
  | 'learning'
  | 'audio'
  | 'social'
  | 'chat'
  | 'commerce'
  | 'rewards'
  | 'trust'
  | 'operations'
  | 'platform'

export type PermissionAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'manage'
  | 'review'
  | 'approve'
  | 'publish'
  | 'decide'
  | 'execute'

export type Permission = `${DomainName}.${string}.${PermissionAction}`

const WILDCARD = '*'

export interface ParsedPermission {
  domain: string
  resource: string
  action: string
}

/** Split a permission key into domain / resource / action. */
export function parsePermission(permission: string): ParsedPermission {
  const [domain = '', resource = '', action = ''] = permission.split('.')
  return { domain, resource, action }
}

/** Build a permission key. */
export function createPermission(
  domain: DomainName,
  resource: string,
  action: PermissionAction,
): Permission {
  return `${domain}.${resource}.${action}` as Permission
}

function matchesPattern(permission: string, pattern: string): boolean {
  const p = parsePermission(permission)
  const pat = parsePermission(pattern)
  return (
    (pat.domain === WILDCARD || pat.domain === p.domain) &&
    (pat.resource === WILDCARD || pat.resource === p.resource) &&
    (pat.action === WILDCARD || pat.action === p.action)
  )
}

/**
 * Check whether the operator's permission list grants `permission`,
 * honoring wildcard patterns.
 */
export function can(
  permissions: readonly string[],
  permission: string,
): boolean {
  for (const granted of permissions) {
    if (granted === permission || matchesPattern(permission, granted)) {
      return true
    }
  }
  return false
}
