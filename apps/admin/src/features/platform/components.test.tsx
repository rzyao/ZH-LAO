import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { assertUuid } from '@/api/contracts/uuid'
import { AuthProvider } from '@/auth/context/AuthContext'
import { PLATFORM_PERMISSIONS } from './contracts'
import { useExactPermission } from './components'

const operator = { id: assertUuid('11111111-1111-4111-8111-111111111111'), name: 'Operator' }

function wrapper(permissions: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider initialState={{ operator, permissions }}>{children}</AuthProvider>
  }
}

describe('Platform exact permission guard', () => {
  it('accepts the exact frozen key', () => {
    const { result } = renderHook(() => useExactPermission(PLATFORM_PERMISSIONS.featureFlagsWrite), {
      wrapper: wrapper([PLATFORM_PERMISSIONS.featureFlagsWrite]),
    })
    expect(result.current).toBe(true)
  })

  it('does not honor wildcard grants for Platform Admin mutations', () => {
    const { result } = renderHook(() => useExactPermission(PLATFORM_PERMISSIONS.featureFlagsWrite), {
      wrapper: wrapper(['platform.*.*']),
    })
    expect(result.current).toBe(false)
  })
})
