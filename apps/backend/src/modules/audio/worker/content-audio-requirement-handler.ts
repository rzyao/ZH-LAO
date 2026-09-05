import type { EventHandler, PublishedEvent } from '../../../events/event-handler.js';
import type { AudioRequirementSync } from '../public/audio-requirement-sync.js';
export class ContentAudioRequirementHandler implements EventHandler {
  constructor(private readonly sync: AudioRequirementSync) {}
  async handle(event: PublishedEvent): Promise<void> {
    const p = event.payload; if (p['sourceDomain'] !== 'content' || typeof p['entityType'] !== 'string' || typeof p['entityId'] !== 'string' || typeof p['revisionId'] !== 'string' || (p['languageCode'] !== 'zh' && p['languageCode'] !== 'lo') || typeof p['audioRole'] !== 'string') throw new Error('Invalid content.audio_requirement_changed payload');
    await this.sync.syncRequirement({ sourceDomain: 'content', entityType: p['entityType'] as never, entityId: p['entityId'], revisionId: p['revisionId'], languageCode: p['languageCode'], audioRole: p['audioRole'] });
  }
}
