const runtimeConfigHandleBrand: unique symbol = Symbol('PlatformRuntimeConfigHandle');

export type PlatformRuntimeConfigHandle<T> = Readonly<{
  key: string;
  readonly [runtimeConfigHandleBrand]: T | undefined;
}>;

function defineRuntimeConfigHandle<T>(key: string): PlatformRuntimeConfigHandle<T> {
  return Object.freeze({
    key,
    [runtimeConfigHandleBrand]: undefined,
  }) as PlatformRuntimeConfigHandle<T>;
}

export const platformDefaultLocaleConfig = defineRuntimeConfigHandle<string>('default_locale');
export const platformSupportEmailConfig = defineRuntimeConfigHandle<string>('support_email');
export const platformMaintenanceNoticeUrlConfig = defineRuntimeConfigHandle<string>('maintenance_notice_url');

export interface PlatformRuntimeConfigReader {
  getRuntimeConfig<T>(handle: PlatformRuntimeConfigHandle<T>): Promise<T>;
  resolveRuntimeConfigs(
    handles: readonly PlatformRuntimeConfigHandle<unknown>[],
  ): Promise<Readonly<Record<string, unknown>>>;
}
