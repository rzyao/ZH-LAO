export type PlatformClientPlatform = 'android' | 'ios';

export type PlatformRuntimeContext = Readonly<{
  regionCode?: string | undefined;
  clientPlatform?: PlatformClientPlatform | undefined;
}>;

export type PlatformFeatureDecisionReason =
  | 'flag_not_found'
  | 'flag_inactive'
  | 'flag_retired'
  | 'region_client_override'
  | 'region_override'
  | 'client_override'
  | 'default_enabled';

export type PlatformFeatureDecision = Readonly<{
  key: string;
  enabled: boolean;
  reason: PlatformFeatureDecisionReason;
}>;

export type EvaluatePlatformFeatureInput = Readonly<{
  key: string;
  context?: PlatformRuntimeContext | undefined;
}>;

export interface PlatformFeatureEvaluator {
  evaluateFeature(input: EvaluatePlatformFeatureInput): Promise<PlatformFeatureDecision>;
  resolveFeatures(input: Readonly<{
    keys: readonly string[];
    context?: PlatformRuntimeContext | undefined;
  }>): Promise<readonly PlatformFeatureDecision[]>;
}
