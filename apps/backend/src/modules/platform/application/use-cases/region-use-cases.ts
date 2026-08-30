import {
  conflict,
  notFound,
  regionRetired,
  validateLocale,
  validateRegionCode,
  validateRegionName,
  validateTimezone,
  type Region,
  type RegionStatus,
} from '../../domain/index.js';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import type { RegionRepository } from '../ports/platform-repositories.js';

export class RegionUseCases {
  constructor(private readonly regionRepo: RegionRepository) {}

  async getRegion(executor: DatabaseExecutor, code: string): Promise<Region | null> {
    const validCode = validateRegionCode(code);
    return this.regionRepo.findByCode(executor, validCode);
  }

  async listActiveRegions(executor: DatabaseExecutor): Promise<readonly Region[]> {
    return this.regionRepo.listActive(executor);
  }

  // Management Commands
  async createRegion(
    executor: DatabaseExecutor,
    input: Readonly<{
      code: string;
      name: string;
      defaultLocale: string;
      timezone: string;
    }>,
  ): Promise<Region> {
    const code = validateRegionCode(input.code);
    const name = validateRegionName(input.name);
    const defaultLocale = validateLocale(input.defaultLocale);
    const timezone = validateTimezone(input.timezone);

    const existing = await this.regionRepo.findByCode(executor, code);
    if (existing) {
      throw conflict(`Region with code '${code}' already exists`);
    }

    return this.regionRepo.create(executor, {
      code,
      name,
      defaultLocale,
      timezone,
      status: 'active',
    });
  }

  async updateRegion(
    executor: DatabaseExecutor,
    code: string,
    input: Readonly<{
      name?: string;
      defaultLocale?: string;
      timezone?: string;
      status?: 'active' | 'inactive';
    }>,
  ): Promise<Region> {
    const validCode = validateRegionCode(code);
    const region = await this.regionRepo.findByCode(executor, validCode, true);
    if (!region) {
      throw notFound(`Region '${validCode}' not found`);
    }
    if (region.status === 'retired') {
      throw regionRetired(validCode);
    }

    const name = input.name !== undefined ? validateRegionName(input.name) : undefined;
    const defaultLocale = input.defaultLocale !== undefined ? validateLocale(input.defaultLocale) : undefined;
    const timezone = input.timezone !== undefined ? validateTimezone(input.timezone) : undefined;

    const updateData: {
      name?: string;
      defaultLocale?: string;
      timezone?: string;
      status?: RegionStatus;
    } = {};
    if (name !== undefined) updateData.name = name;
    if (defaultLocale !== undefined) updateData.defaultLocale = defaultLocale;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (input.status !== undefined) updateData.status = input.status;

    return this.regionRepo.update(executor, region.id, updateData);
  }

  async retireRegion(executor: DatabaseExecutor, code: string): Promise<Region> {
    const validCode = validateRegionCode(code);
    const region = await this.regionRepo.findByCode(executor, validCode, true);
    if (!region) {
      throw notFound(`Region '${validCode}' not found`);
    }
    if (region.status === 'retired') {
      return region; // idempotent
    }

    return this.regionRepo.update(executor, region.id, {
      status: 'retired',
    });
  }

  async listRegionsForManagement(executor: DatabaseExecutor): Promise<readonly Region[]> {
    return this.regionRepo.listForManagement(executor);
  }
}
