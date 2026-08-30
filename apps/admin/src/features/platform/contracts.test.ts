import { describe, expect, it } from 'vitest'
import {
  RUNTIME_CONFIG_REGISTRY,
  announcementCreateSchema,
  featureFlagOverrideInputSchema,
  runtimeConfigEditSchema,
} from './contracts'

describe('Platform Admin frozen contracts', () => {
  it('does not expose an arbitrary runtime config editor', () => {
    expect(RUNTIME_CONFIG_REGISTRY.map((entry) => entry.key)).toEqual([
      'default_locale',
      'support_email',
      'maintenance_notice_url',
    ])
    expect(runtimeConfigEditSchema.safeParse({
      key: 'commerce_price',
      value: '123',
      description: '',
      expected_updated_at: '2026-08-31T00:00:00Z',
    }).success).toBe(false)
  })

  it('validates registered runtime values at the input boundary', () => {
    expect(runtimeConfigEditSchema.safeParse({ key: 'support_email', value: 'not-email' }).success).toBe(false)
    expect(runtimeConfigEditSchema.safeParse({ key: 'support_email', value: 'support@example.com' }).success).toBe(true)
  })

  it('rejects global feature flag overrides', () => {
    expect(featureFlagOverrideInputSchema.safeParse({ region_code: '', client_platform: '', enabled: true }).success).toBe(false)
    expect(featureFlagOverrideInputSchema.safeParse({ region_code: 'LA', client_platform: '', enabled: true }).success).toBe(true)
  })

  it('rejects announcement windows where end is not after start', () => {
    expect(announcementCreateSchema.safeParse({
      title: 'Notice', content: 'Body', region_code: '', client_platform: '',
      starts_at: '2026-09-02T00:00:00Z', ends_at: '2026-09-01T00:00:00Z',
    }).success).toBe(false)
  })
})
