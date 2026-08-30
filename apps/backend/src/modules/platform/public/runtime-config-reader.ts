export type PlatformRuntimeConfigValueType =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'json';

export type PlatformRuntimeConfigVisibility =
  | 'server_only'
  | 'client_public';

export type PlatformRuntimeConfigDefinition<T> = Readonly<{
  key: string;
  valueType: PlatformRuntimeConfigValueType;
  visibility: PlatformRuntimeConfigVisibility;
  owner: 'platform';
  description: string;
  validate: (value: unknown) => T;
  fallback?: T;
}>;

export const platformDefaultLocaleConfig: PlatformRuntimeConfigDefinition<string> = {
  key: 'default_locale',
  valueType: 'string',
  visibility: 'server_only',
  owner: 'platform',
  description: 'Default fallback system locale',
  validate: (v: unknown) => {
    if (typeof v !== 'string' || !v.trim()) throw new Error('Must be non-empty string');
    return v.trim();
  },
  fallback: 'zh-CN',
};

export const platformSupportEmailConfig: PlatformRuntimeConfigDefinition<string> = {
  key: 'support_email',
  valueType: 'string',
  visibility: 'server_only',
  owner: 'platform',
  description: 'Official support email contact address',
  validate: (v: unknown) => {
    if (typeof v !== 'string' || !v.includes('@')) throw new Error('Must be valid email');
    return v.trim();
  },
  fallback: 'support@zh-lao.com',
};

export const platformMaintenanceNoticeUrlConfig: PlatformRuntimeConfigDefinition<string> = {
  key: 'maintenance_notice_url',
  valueType: 'string',
  visibility: 'server_only',
  owner: 'platform',
  description: 'URL for scheduled maintenance page',
  validate: (v: unknown) => {
    if (typeof v !== 'string' || !v.startsWith('http')) throw new Error('Must be valid HTTP URL');
    return v.trim();
  },
};

export interface PlatformRuntimeConfigReader {
  getRuntimeConfig<T>(definition: PlatformRuntimeConfigDefinition<T>): Promise<T>;
  resolveRuntimeConfigs(
    definitions: readonly PlatformRuntimeConfigDefinition<unknown>[],
  ): Promise<Readonly<Record<string, unknown>>>;
}
