import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { assertUuid } from '@/api/contracts/uuid'
import { AuthProvider } from '@/auth/context/AuthContext'
import { OPERATIONS_PERMISSIONS } from './contracts'
import { useExactPermission } from './components'

const operator = { id: assertUuid('11111111-1111-4111-8111-111111111111'), name: 'Operator' }

function wrapper(permissions: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider initialState={{ operator, permissions }}>{children}</AuthProvider>
  }
}

describe('Operations exact permission guard', () => {
  it('accepts the exact frozen operations key', () => {
    const { result } = renderHook(() => useExactPermission(OPERATIONS_PERMISSIONS.operatorsCreate), {
      wrapper: wrapper([OPERATIONS_PERMISSIONS.operatorsCreate]),
    })
    expect(result.current).toBe(true)
  })

  it('does not honor wildcard grants for operations mutations', () => {
    const { result } = renderHook(() => useExactPermission(OPERATIONS_PERMISSIONS.operatorsCreate), {
      wrapper: wrapper(['operations.*.*']),
    })
    expect(result.current).toBe(false)
  })
})
