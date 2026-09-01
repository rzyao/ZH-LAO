import { describe, expect, it } from 'vitest'
import {
  OPERATIONS_PERMISSIONS,
  operatorCreateInputSchema,
  roleCreateInputSchema,
  roleUpdateInputSchema,
} from './contracts'

describe('Operations Admin contracts', () => {
  it('freezes 16 operations permission constants', () => {
    expect(Object.keys(OPERATIONS_PERMISSIONS)).toHaveLength(16)
    expect(OPERATIONS_PERMISSIONS.operatorsRead).toBe('operations.operators.read')
    expect(OPERATIONS_PERMISSIONS.operatorsCreate).toBe('operations.operators.create')
    expect(OPERATIONS_PERMISSIONS.rolesRead).toBe('operations.roles.read')
    expect(OPERATIONS_PERMISSIONS.rolePermissionsSet).toBe('operations.role_permissions.set')
    expect(OPERATIONS_PERMISSIONS.auditLogsRead).toBe('operations.audit_logs.read')
  })

  it('validates operator create input with uuid requirement', () => {
    expect(
      operatorCreateInputSchema.safeParse({
        auth_subject_id: 'not-a-uuid',
        display_name: 'Test Operator',
      }).success,
    ).toBe(false)

    expect(
      operatorCreateInputSchema.safeParse({
        auth_subject_id: '123e4567-e89b-12d3-a456-426614174000',
        display_name: 'Test Operator',
      }).success,
    ).toBe(true)

    expect(
      operatorCreateInputSchema.safeParse({
        auth_subject_id: '123e4567-e89b-12d3-a456-426614174000',
        display_name: '',
      }).success,
    ).toBe(false)
  })

  it('validates role code grammar (lowercase letters, digits, underscores, starting with letter)', () => {
    expect(
      roleCreateInputSchema.safeParse({
        code: 'SuperAdmin',
        name: 'Super Admin',
      }).success,
    ).toBe(false)

    expect(
      roleCreateInputSchema.safeParse({
        code: '123_role',
        name: 'Invalid Role',
      }).success,
    ).toBe(false)

    expect(
      roleCreateInputSchema.safeParse({
        code: 'content_editor_v2',
        name: 'Content Editor',
        description: 'Can manage content',
      }).success,
    ).toBe(true)
  })

  it('validates role update input', () => {
    expect(
      roleUpdateInputSchema.safeParse({
        name: 'Updated Name',
        description: 'New Description',
      }).success,
    ).toBe(true)
  })
})
