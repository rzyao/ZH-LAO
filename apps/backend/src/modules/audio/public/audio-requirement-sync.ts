import type { AudioEligibleContentEntityType } from '../../content/public/content-public-queries.js';
export type SyncAudioRequirementRequest = { sourceDomain: 'content'; entityType: AudioEligibleContentEntityType; entityId: string; revisionId: string; languageCode: 'zh' | 'lo'; audioRole: string };
export interface AudioRequirementSync { syncRequirement(request: SyncAudioRequirementRequest): Promise<void>; }
