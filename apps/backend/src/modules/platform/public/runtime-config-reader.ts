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

export interface PlatformRuntimeConfigReader {
  getRuntimeConfig<T>(definition: PlatformRuntimeConfigDefinition<T>): Promise<T>;
  resolveRuntimeConfigs(
    definitions: readonly PlatformRuntimeConfigDefinition<unknown>[],
  ): Promise<Readonly<Record<string, unknown>>>;
}
