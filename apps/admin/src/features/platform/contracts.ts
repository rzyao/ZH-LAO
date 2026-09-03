import { z } from 'zod'

export const PLATFORM_PERMISSIONS = {
  featureFlagsRead: 'platform.feature_flags.read',
  featureFlagsWrite: 'platform.feature_flags.write',
  runtimeConfigsRead: 'platform.runtime_configs.read',
  runtimeConfigsWrite: 'platform.runtime_configs.write',
  appVersionsRead: 'platform.app_versions.read',
  appVersionsWrite: 'platform.app_versions.write',
  announcementsRead: 'platform.announcements.read',
  announcementsWrite: 'platform.announcements.write',
  regionsRead: 'platform.regions.read',
  regionsWrite: 'platform.regions.write',
  menusRead: 'platform.menus.read',
  menusWrite: 'platform.menus.write',
} as const

export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[keyof typeof PLATFORM_PERMISSIONS]

export const clientPlatformSchema = z.enum(['android', 'ios'])
export type ClientPlatform = z.infer<typeof clientPlatformSchema>

const isoDateTimeSchema = z.string().min(1)
const statusSchema = z.enum(['active', 'inactive', 'retired'])

export const featureFlagOverrideSchema = z.object({
  region_code: z.string().nullable().optional(),
  client_platform: clientPlatformSchema.nullable().optional(),
  enabled: z.boolean(),
})

export const featureFlagSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  default_enabled: z.boolean(),
  status: statusSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
  overrides: z.array(featureFlagOverrideSchema).optional(),
})
export type FeatureFlag = z.infer<typeof featureFlagSchema>
export type FeatureFlagOverride = z.infer<typeof featureFlagOverrideSchema>

export const runtimeConfigSchema = z.object({
  key: z.string(),
  value_type: z.enum(['string', 'integer', 'number', 'boolean', 'json']),
  value: z.unknown(),
  description: z.string().nullable(),
  status: z.enum(['active', 'retired']),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
})
export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>

export const appVersionSchema = z.object({
  client_platform: clientPlatformSchema,
  version: z.string(),
  build_number: z.number().int().positive(),
  status: z.enum(['draft', 'active', 'deprecated', 'blocked']),
  update_policy: z.enum(['none', 'optional', 'required']),
  release_notes: z.string().nullable(),
  released_at: isoDateTimeSchema.nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
})
export type AppVersion = z.infer<typeof appVersionSchema>

export const announcementSchema = z.object({
  announcement_id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  region_code: z.string().nullable(),
  client_platform: clientPlatformSchema.nullable(),
  status: z.enum(['draft', 'published', 'retired']),
  starts_at: isoDateTimeSchema.nullable(),
  ends_at: isoDateTimeSchema.nullable(),
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
})
export type Announcement = z.infer<typeof announcementSchema>

export const regionSchema = z.object({
  code: z.string(),
  name: z.string(),
  default_locale: z.string(),
  timezone: z.string(),
  status: statusSchema,
  created_at: isoDateTimeSchema,
  updated_at: isoDateTimeSchema,
})
export type Region = z.infer<typeof regionSchema>

export const featureFlagListResponseSchema = z.object({ items: z.array(featureFlagSchema) })
export const runtimeConfigListResponseSchema = z.object({ items: z.array(runtimeConfigSchema) })
export const appVersionListResponseSchema = z.object({ items: z.array(appVersionSchema) })
export const announcementListResponseSchema = z.object({ items: z.array(announcementSchema) })
export const regionListResponseSchema = z.object({ items: z.array(regionSchema) })

export const featureFlagCreateSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,99}$/, 'Use lower_snake_case'),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  default_enabled: z.boolean(),
})
export type FeatureFlagCreateInput = z.infer<typeof featureFlagCreateSchema>

export const featureFlagUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  default_enabled: z.boolean(),
  status: z.enum(['active', 'inactive']),
})
export type FeatureFlagUpdateInput = z.infer<typeof featureFlagUpdateSchema>

export const featureFlagOverrideInputSchema = z
  .object({
    region_code: z.union([z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,7}$/), z.literal('')]),
    client_platform: z.union([clientPlatformSchema, z.literal('')]),
    enabled: z.boolean(),
  })
  .refine((value) => Boolean(value.region_code || value.client_platform), {
    message: 'Region or client platform is required',
  })
export type FeatureFlagOverrideInput = z.infer<typeof featureFlagOverrideInputSchema>

export interface RuntimeConfigDefinition {
  key: 'default_locale' | 'support_email' | 'maintenance_notice_url'
  valueType: 'string'
  visibility: 'server_only'
  description: string
  validate: (value: string) => boolean
  validationMessage: string
}

/** Mirrors the frozen V1 Platform code registry; this is intentionally not arbitrary. */
export const RUNTIME_CONFIG_REGISTRY: readonly RuntimeConfigDefinition[] = [
  {
    key: 'default_locale',
    valueType: 'string',
    visibility: 'server_only',
    description: 'Default fallback system locale',
    validate: (value) => value.trim().length > 0,
    validationMessage: 'Must be a non-empty locale string',
  },
  {
    key: 'support_email',
    valueType: 'string',
    visibility: 'server_only',
    description: 'Official support email contact address',
    validate: (value) => /^\S+@\S+\.\S+$/.test(value.trim()),
    validationMessage: 'Must be a valid email address',
  },
  {
    key: 'maintenance_notice_url',
    valueType: 'string',
    visibility: 'server_only',
    description: 'URL for scheduled maintenance page',
    validate: (value) => /^https?:\/\//.test(value.trim()),
    validationMessage: 'Must be an HTTP(S) URL',
  },
] as const

export const runtimeConfigEditSchema = z
  .object({
    key: z.enum(['default_locale', 'support_email', 'maintenance_notice_url']),
    value: z.string(),
    description: z.string().trim().max(1000).optional(),
    expected_updated_at: z.string().optional(),
  })
  .superRefine((value, context) => {
    const definition = RUNTIME_CONFIG_REGISTRY.find((entry) => entry.key === value.key)
    if (!definition?.validate(value.value)) {
      context.addIssue({
        code: 'custom',
        path: ['value'],
        message: definition?.validationMessage ?? 'Invalid value',
      })
    }
  })
export type RuntimeConfigEditInput = z.infer<typeof runtimeConfigEditSchema>

export const appVersionCreateSchema = z.object({
  client_platform: clientPlatformSchema,
  version: z.string().trim().min(1).max(50),
  build_number: z.number().int().positive(),
  release_notes: z.string().trim().max(5000).optional(),
})
export type AppVersionCreateInput = z.infer<typeof appVersionCreateSchema>

export const appVersionDraftUpdateSchema = z.object({
  version: z.string().trim().min(1).max(50),
  release_notes: z.string().trim().max(5000).optional(),
})
export type AppVersionDraftUpdateInput = z.infer<typeof appVersionDraftUpdateSchema>

export const appVersionPolicySchema = z.object({
  status: z.enum(['active', 'deprecated', 'blocked']),
  update_policy: z.enum(['none', 'optional', 'required']),
  expected_updated_at: z.string().min(1),
})
export type AppVersionPolicyInput = z.infer<typeof appVersionPolicySchema>

const optionalScopeString = z.string().trim().optional()
export const announcementCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    content: z.string().trim().min(1).max(10000),
    region_code: optionalScopeString,
    client_platform: z.union([clientPlatformSchema, z.literal('')]),
    starts_at: optionalScopeString,
    ends_at: optionalScopeString,
  })
  .refine(
    (value) =>
      !value.starts_at ||
      !value.ends_at ||
      new Date(value.ends_at).getTime() > new Date(value.starts_at).getTime(),
    {
      path: ['ends_at'],
      message: 'End time must be after start time',
    },
  )
export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>

export const regionCreateSchema = z.object({
  code: z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,7}$/),
  name: z.string().trim().min(1).max(200),
  default_locale: z.string().trim().min(1).max(50),
  timezone: z.string().trim().min(1).max(100),
})
export type RegionCreateInput = z.infer<typeof regionCreateSchema>

export const regionUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  default_locale: z.string().trim().min(1).max(50),
  timezone: z.string().trim().min(1).max(100),
  status: z.enum(['active', 'inactive']),
})
export type RegionUpdateInput = z.infer<typeof regionUpdateSchema>

export function normalizeOptional(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  if (status === 'active' || status === 'published') return 'success'
  if (status === 'draft') return 'warning'
  if (status === 'blocked') return 'danger'
  if (status === 'deprecated') return 'info'
  return 'muted'
}
