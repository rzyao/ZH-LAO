import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider } from '@/auth/context/AuthContext'
import { createUuid } from '@/api/contracts'
import { PermissionGuard } from './PermissionGuard'

const operator = { id: createUuid(), name: 'Operator' }

describe('PermissionGuard', () => {
  it('renders children when the permission is granted', () => {
    render(
      <AuthProvider initialState={{ operator, permissions: ['content.course.read'] }}>
        <PermissionGuard permission="content.course.read">granted-content</PermissionGuard>
      </AuthProvider>,
    )
    expect(screen.getByText('granted-content')).toBeInTheDocument()
  })

  it('fails closed and shows a fallback when the permission is missing', () => {
    render(
      <AuthProvider initialState={{ operator, permissions: ['content.course.read'] }}>
        <PermissionGuard permission="content.course.update">update-content</PermissionGuard>
      </AuthProvider>,
    )
    expect(screen.queryByText('update-content')).not.toBeInTheDocument()
    expect(screen.getByText(/无权限/)).toBeInTheDocument()
  })

  it('honors domain-level wildcard grants', () => {
    render(
      <AuthProvider initialState={{ operator, permissions: ['content.*.*'] }}>
        <PermissionGuard permission="content.course.update">wildcard-ok</PermissionGuard>
      </AuthProvider>,
    )
    expect(screen.getByText('wildcard-ok')).toBeInTheDocument()
  })
})
