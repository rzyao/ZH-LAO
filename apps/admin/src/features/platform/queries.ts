import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformAdminApi } from './api'
import type {
  AnnouncementCreateInput,
  AppVersionCreateInput,
  AppVersionDraftUpdateInput,
  AppVersionPolicyInput,
  ClientPlatform,
  FeatureFlagCreateInput,
  FeatureFlagOverrideInput,
  FeatureFlagUpdateInput,
  RegionCreateInput,
  RegionUpdateInput,
  RuntimeConfigEditInput,
} from './contracts'

export const platformQueryKeys = {
  root: ['platform-admin'] as const,
  featureFlags: () => [...platformQueryKeys.root, 'feature-flags'] as const,
  runtimeConfigs: () => [...platformQueryKeys.root, 'runtime-configs'] as const,
  appVersions: (platform?: ClientPlatform) => [...platformQueryKeys.root, 'app-versions', platform ?? 'all'] as const,
  announcements: () => [...platformQueryKeys.root, 'announcements'] as const,
  regions: () => [...platformQueryKeys.root, 'regions'] as const,
}

export function useFeatureFlagsQuery() {
  return useQuery({
    queryKey: platformQueryKeys.featureFlags(),
    queryFn: ({ signal }) => platformAdminApi.listFeatureFlags(signal),
  })
}

export function useRuntimeConfigsQuery() {
  return useQuery({
    queryKey: platformQueryKeys.runtimeConfigs(),
    queryFn: ({ signal }) => platformAdminApi.listRuntimeConfigs(signal),
  })
}

export function useAppVersionsQuery(platform?: ClientPlatform) {
  return useQuery({
    queryKey: platformQueryKeys.appVersions(platform),
    queryFn: ({ signal }) => platformAdminApi.listAppVersions(platform, signal),
  })
}

export function useAnnouncementsQuery() {
  return useQuery({
    queryKey: platformQueryKeys.announcements(),
    queryFn: ({ signal }) => platformAdminApi.listAnnouncements(signal),
  })
}

export function useRegionsQuery() {
  return useQuery({
    queryKey: platformQueryKeys.regions(),
    queryFn: ({ signal }) => platformAdminApi.listRegions(signal),
  })
}

function useInvalidate(key: readonly unknown[]) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: key })
}

export function useCreateFeatureFlag() {
  const invalidate = useInvalidate(platformQueryKeys.featureFlags())
  return useMutation({ mutationFn: (input: FeatureFlagCreateInput) => platformAdminApi.createFeatureFlag(input), onSuccess: invalidate })
}

export function useUpdateFeatureFlag() {
  const invalidate = useInvalidate(platformQueryKeys.featureFlags())
  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: FeatureFlagUpdateInput }) => platformAdminApi.updateFeatureFlag(key, input),
    onSuccess: invalidate,
  })
}

export function useRetireFeatureFlag() {
  const invalidate = useInvalidate(platformQueryKeys.featureFlags())
  return useMutation({ mutationFn: (key: string) => platformAdminApi.retireFeatureFlag(key), onSuccess: invalidate })
}

export function useSetFeatureFlagOverride() {
  const invalidate = useInvalidate(platformQueryKeys.featureFlags())
  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: FeatureFlagOverrideInput }) => platformAdminApi.setFeatureFlagOverride(key, input),
    onSuccess: invalidate,
  })
}

export function useRemoveFeatureFlagOverride() {
  const invalidate = useInvalidate(platformQueryKeys.featureFlags())
  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: Omit<FeatureFlagOverrideInput, 'enabled'> }) => platformAdminApi.removeFeatureFlagOverride(key, input),
    onSuccess: invalidate,
  })
}

export function useSetRuntimeConfig() {
  const invalidate = useInvalidate(platformQueryKeys.runtimeConfigs())
  return useMutation({ mutationFn: (input: RuntimeConfigEditInput) => platformAdminApi.setRuntimeConfig(input), onSuccess: invalidate })
}

export function useRetireRuntimeConfig() {
  const invalidate = useInvalidate(platformQueryKeys.runtimeConfigs())
  return useMutation({ mutationFn: (key: string) => platformAdminApi.retireRuntimeConfig(key), onSuccess: invalidate })
}

export function useCreateAppVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AppVersionCreateInput) => platformAdminApi.createAppVersion(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'app-versions'] }),
  })
}

export function useUpdateAppVersionDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ platform, buildNumber, input }: { platform: ClientPlatform; buildNumber: number; input: AppVersionDraftUpdateInput }) =>
      platformAdminApi.updateAppVersionDraft(platform, buildNumber, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'app-versions'] }),
  })
}

export function usePublishAppVersion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ platform, buildNumber }: { platform: ClientPlatform; buildNumber: number }) => platformAdminApi.publishAppVersion(platform, buildNumber),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'app-versions'] }),
  })
}

export function useUpdateAppVersionPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ platform, buildNumber, input }: { platform: ClientPlatform; buildNumber: number; input: AppVersionPolicyInput }) =>
      platformAdminApi.updateAppVersionPolicy(platform, buildNumber, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'app-versions'] }),
  })
}

export function useDeleteAppVersionDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ platform, buildNumber }: { platform: ClientPlatform; buildNumber: number }) => platformAdminApi.deleteAppVersionDraft(platform, buildNumber),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...platformQueryKeys.root, 'app-versions'] }),
  })
}

export function useCreateAnnouncement() {
  const invalidate = useInvalidate(platformQueryKeys.announcements())
  return useMutation({ mutationFn: (input: AnnouncementCreateInput) => platformAdminApi.createAnnouncement(input), onSuccess: invalidate })
}

export function useUpdateAnnouncement() {
  const invalidate = useInvalidate(platformQueryKeys.announcements())
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AnnouncementCreateInput }) => platformAdminApi.updateAnnouncement(id, input),
    onSuccess: invalidate,
  })
}

export function usePublishAnnouncement() {
  const invalidate = useInvalidate(platformQueryKeys.announcements())
  return useMutation({ mutationFn: (id: string) => platformAdminApi.publishAnnouncement(id), onSuccess: invalidate })
}

export function useRetireAnnouncement() {
  const invalidate = useInvalidate(platformQueryKeys.announcements())
  return useMutation({ mutationFn: (id: string) => platformAdminApi.retireAnnouncement(id), onSuccess: invalidate })
}

export function useDeleteAnnouncementDraft() {
  const invalidate = useInvalidate(platformQueryKeys.announcements())
  return useMutation({ mutationFn: (id: string) => platformAdminApi.deleteAnnouncementDraft(id), onSuccess: invalidate })
}

export function useCreateRegion() {
  const invalidate = useInvalidate(platformQueryKeys.regions())
  return useMutation({ mutationFn: (input: RegionCreateInput) => platformAdminApi.createRegion(input), onSuccess: invalidate })
}

export function useUpdateRegion() {
  const invalidate = useInvalidate(platformQueryKeys.regions())
  return useMutation({
    mutationFn: ({ code, input }: { code: string; input: RegionUpdateInput }) => platformAdminApi.updateRegion(code, input),
    onSuccess: invalidate,
  })
}

export function useRetireRegion() {
  const invalidate = useInvalidate(platformQueryKeys.regions())
  return useMutation({ mutationFn: (code: string) => platformAdminApi.retireRegion(code), onSuccess: invalidate })
}
