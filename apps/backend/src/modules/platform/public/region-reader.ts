export type PlatformRegionStatus = 'active' | 'inactive' | 'retired';

export type PlatformRegion = Readonly<{
  code: string;
  name: string;
  defaultLocale: string;
  timezone: string;
  status: PlatformRegionStatus;
}>;

export interface PlatformRegionReader {
  getRegion(code: string): Promise<PlatformRegion | null>;
  listActiveRegions(): Promise<readonly PlatformRegion[]>;
  isRegionActive(code: string): Promise<boolean>;
}
