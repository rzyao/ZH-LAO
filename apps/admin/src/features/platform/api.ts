import { apiClient } from '@/api/client'
import {
  announcementListResponseSchema,
  announcementSchema,
  appVersionListResponseSchema,
  appVersionSchema,
  featureFlagListResponseSchema,
  featureFlagSchema,
  normalizeOptional,
  regionListResponseSchema,
  regionSchema,
  runtimeConfigListResponseSchema,
  runtimeConfigSchema,
  type AnnouncementCreateInput,
  type AppVersionCreateInput,
  type AppVersionDraftUpdateInput,
  type AppVersionPolicyInput,
  type ClientPlatform,
  type FeatureFlagCreateInput,
  type FeatureFlagOverrideInput,
  type FeatureFlagUpdateInput,
  type RegionCreateInput,
  type RegionUpdateInput,
  type RuntimeConfigEditInput,
} from './contracts'

const base = '/api/v1/admin/platform'

export const platformAdminApi = {
  async listFeatureFlags(signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/feature-flags`, { signal })
    return featureFlagListResponseSchema.parse(response.data).items
  },
  async createFeatureFlag(input: FeatureFlagCreateInput) {
    const response = await apiClient.post(`${base}/feature-flags`, {
      json: {
        ...input,
        description: normalizeOptional(input.description),
      },
    })
    return featureFlagSchema.parse((response.data as { feature_flag: unknown }).feature_flag)
  },
  async updateFeatureFlag(key: string, input: FeatureFlagUpdateInput) {
    const response = await apiClient.patch(`${base}/feature-flags/${encodeURIComponent(key)}`, {
      json: {
        ...input,
        description: normalizeOptional(input.description),
      },
    })
    return featureFlagSchema.parse((response.data as { feature_flag: unknown }).feature_flag)
  },
  async retireFeatureFlag(key: string) {
    const response = await apiClient.post(`${base}/feature-flags/${encodeURIComponent(key)}/retire`)
    return featureFlagSchema.parse((response.data as { feature_flag: unknown }).feature_flag)
  },
  async setFeatureFlagOverride(key: string, input: FeatureFlagOverrideInput) {
    const response = await apiClient.put(`${base}/feature-flags/${encodeURIComponent(key)}/override`, {
      json: {
        region_code: normalizeOptional(input.region_code),
        client_platform: input.client_platform || null,
        enabled: input.enabled,
      },
    })
    return response.data
  },
  async removeFeatureFlagOverride(key: string, input: Omit<FeatureFlagOverrideInput, 'enabled'>) {
    await apiClient.delete(`${base}/feature-flags/${encodeURIComponent(key)}/override`, {
      json: {
        region_code: normalizeOptional(input.region_code),
        client_platform: input.client_platform || null,
      },
    })
  },

  async listRuntimeConfigs(signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/runtime-configs`, { signal })
    return runtimeConfigListResponseSchema.parse(response.data).items
  },
  async setRuntimeConfig(input: RuntimeConfigEditInput) {
    const response = await apiClient.put(`${base}/runtime-configs/${encodeURIComponent(input.key)}`, {
      json: {
        value_type: 'string',
        value: input.value,
        description: normalizeOptional(input.description),
        ...(input.expected_updated_at ? { expected_updated_at: input.expected_updated_at } : {}),
      },
    })
    return runtimeConfigSchema.parse((response.data as { runtime_config: unknown }).runtime_config)
  },
  async retireRuntimeConfig(key: string) {
    const response = await apiClient.post(`${base}/runtime-configs/${encodeURIComponent(key)}/retire`)
    return runtimeConfigSchema.parse((response.data as { runtime_config: unknown }).runtime_config)
  },

  async listAppVersions(clientPlatform?: ClientPlatform, signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/app-versions`, {
      signal,
      query: { client_platform: clientPlatform },
    })
    return appVersionListResponseSchema.parse(response.data).items
  },
  async createAppVersion(input: AppVersionCreateInput) {
    const response = await apiClient.post(`${base}/app-versions`, {
      json: {
        ...input,
        release_notes: normalizeOptional(input.release_notes),
      },
    })
    return appVersionSchema.parse((response.data as { app_version: unknown }).app_version)
  },
  async updateAppVersionDraft(platform: ClientPlatform, buildNumber: number, input: AppVersionDraftUpdateInput) {
    const response = await apiClient.patch(`${base}/app-versions/${platform}/${buildNumber}`, {
      json: {
        version: input.version,
        release_notes: normalizeOptional(input.release_notes),
      },
    })
    return appVersionSchema.parse((response.data as { app_version: unknown }).app_version)
  },
  async publishAppVersion(platform: ClientPlatform, buildNumber: number) {
    const response = await apiClient.post(`${base}/app-versions/${platform}/${buildNumber}/publish`)
    return appVersionSchema.parse((response.data as { app_version: unknown }).app_version)
  },
  async updateAppVersionPolicy(platform: ClientPlatform, buildNumber: number, input: AppVersionPolicyInput) {
    const response = await apiClient.post(`${base}/app-versions/${platform}/${buildNumber}/policy`, { json: input })
    return appVersionSchema.parse((response.data as { app_version: unknown }).app_version)
  },
  async deleteAppVersionDraft(platform: ClientPlatform, buildNumber: number) {
    await apiClient.delete(`${base}/app-versions/${platform}/${buildNumber}`)
  },

  async listAnnouncements(signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/announcements`, { signal })
    return announcementListResponseSchema.parse(response.data).items
  },
  async createAnnouncement(input: AnnouncementCreateInput) {
    const response = await apiClient.post(`${base}/announcements`, {
      json: {
        title: input.title,
        content: input.content,
        region_code: normalizeOptional(input.region_code),
        client_platform: input.client_platform || null,
        starts_at: normalizeOptional(input.starts_at),
        ends_at: normalizeOptional(input.ends_at),
      },
    })
    return announcementSchema.parse((response.data as { announcement: unknown }).announcement)
  },
  async updateAnnouncement(id: string, input: AnnouncementCreateInput) {
    const response = await apiClient.patch(`${base}/announcements/${id}`, {
      json: {
        title: input.title,
        content: input.content,
        region_code: normalizeOptional(input.region_code),
        client_platform: input.client_platform || null,
        starts_at: normalizeOptional(input.starts_at),
        ends_at: normalizeOptional(input.ends_at),
      },
    })
    return announcementSchema.parse((response.data as { announcement: unknown }).announcement)
  },
  async publishAnnouncement(id: string) {
    const response = await apiClient.post(`${base}/announcements/${id}/publish`)
    return announcementSchema.parse((response.data as { announcement: unknown }).announcement)
  },
  async retireAnnouncement(id: string) {
    const response = await apiClient.post(`${base}/announcements/${id}/retire`)
    return announcementSchema.parse((response.data as { announcement: unknown }).announcement)
  },
  async deleteAnnouncementDraft(id: string) {
    await apiClient.delete(`${base}/announcements/${id}`)
  },

  async listRegions(signal?: AbortSignal) {
    const response = await apiClient.get(`${base}/regions`, { signal })
    return regionListResponseSchema.parse(response.data).items
  },
  async createRegion(input: RegionCreateInput) {
    const response = await apiClient.post(`${base}/regions`, { json: input })
    return regionSchema.parse((response.data as { region: unknown }).region)
  },
  async updateRegion(code: string, input: RegionUpdateInput) {
    const response = await apiClient.patch(`${base}/regions/${encodeURIComponent(code)}`, { json: input })
    return regionSchema.parse((response.data as { region: unknown }).region)
  },
  async retireRegion(code: string) {
    const response = await apiClient.post(`${base}/regions/${encodeURIComponent(code)}/retire`)
    return regionSchema.parse((response.data as { region: unknown }).region)
  },
}
