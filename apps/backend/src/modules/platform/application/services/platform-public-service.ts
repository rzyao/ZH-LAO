import type { DatabaseExecutor } from '../../../../database/executor.js';
import type {
  EvaluatePlatformFeatureInput,
  PlatformFeatureDecision,
  PlatformFeatureEvaluator,
  PlatformRegion,
  PlatformRegionReader,
  PlatformRuntimeConfigDefinition,
  PlatformRuntimeConfigReader,
  PlatformRuntimeContext,
} from '../../public/index.js';
import type {
  FeatureFlagUseCases,
  RegionUseCases,
  RuntimeConfigUseCases,
} from '../use-cases/index.js';
import type { Region } from '../../domain/index.js';

export class PlatformPublicService
  implements PlatformFeatureEvaluator, PlatformRuntimeConfigReader, PlatformRegionReader
{
  constructor(
    private readonly executor: DatabaseExecutor,
    private readonly featureFlagUseCases: FeatureFlagUseCases,
    private readonly runtimeConfigUseCases: RuntimeConfigUseCases,
    private readonly regionUseCases: RegionUseCases,
  ) {}

  async evaluateFeature(input: EvaluatePlatformFeatureInput): Promise<PlatformFeatureDecision> {
    return this.featureFlagUseCases.evaluateFeature(this.executor, input);
  }

  async resolveFeatures(input: Readonly<{
    keys: readonly string[];
    context?: PlatformRuntimeContext;
  }>): Promise<readonly PlatformFeatureDecision[]> {
    return this.featureFlagUseCases.resolveFeatures(this.executor, input);
  }

  async getRuntimeConfig<T>(definition: PlatformRuntimeConfigDefinition<T>): Promise<T> {
    return this.runtimeConfigUseCases.getRuntimeConfig<T>(this.executor, definition);
  }

  async resolveRuntimeConfigs(
    definitions: readonly PlatformRuntimeConfigDefinition<unknown>[],
  ): Promise<Readonly<Record<string, unknown>>> {
    return this.runtimeConfigUseCases.resolveRuntimeConfigs(this.executor, definitions);
  }

  async getRegion(code: string): Promise<PlatformRegion | null> {
    const region = await this.regionUseCases.getRegion(this.executor, code);
    if (!region) return null;
    return {
      code: region.code,
      name: region.name,
      defaultLocale: region.defaultLocale,
      timezone: region.timezone,
      status: region.status,
    };
  }

  async listActiveRegions(): Promise<readonly PlatformRegion[]> {
    const regions = await this.regionUseCases.listActiveRegions(this.executor);
    return regions.map((r: Region) => ({
      code: r.code,
      name: r.name,
      defaultLocale: r.defaultLocale,
      timezone: r.timezone,
      status: r.status,
    }));
  }

  async isRegionActive(code: string): Promise<boolean> {
    const region = await this.regionUseCases.getRegion(this.executor, code);
    return region?.status === 'active';
  }
}
