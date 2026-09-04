import type { AudioEligibleContentEntityType } from '../../public/content-public-queries.js';
export interface AudioRequirementSync { syncRequirement(request: { sourceDomain: 'content'; entityType: AudioEligibleContentEntityType; entityId: string; revisionId: string; languageCode: 'zh' | 'lo'; audioRole: string }): Promise<void>; }
