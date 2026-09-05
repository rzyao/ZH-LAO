import { describe, expect, it, vi } from 'vitest';
import { ContentAudioRequirementHandler } from '../../../src/modules/audio/worker/content-audio-requirement-handler.js';
import type { PublishedEvent } from '../../../src/events/event-handler.js';

const event = (payload: Record<string, unknown>): PublishedEvent => ({ id: '00000000-0000-0000-0000-000000000001' as never, sourceDomain: 'content', type: 'content.audio_requirement_changed', aggregateType: 'content', aggregateId: '00000000-0000-0000-0000-000000000002' as never, payload, headers: {}, occurredAt: new Date(), attempt: 1 });
describe('ContentAudioRequirementHandler', () => {
  it('forwards a complete content event exactly once', async () => {
    const sync = { syncRequirement: vi.fn().mockResolvedValue(undefined) };
    await new ContentAudioRequirementHandler(sync).handle(event({ sourceDomain: 'content', entityType: 'lo_letter', entityId: '00000000-0000-0000-0000-000000000002', revisionId: '00000000-0000-0000-0000-000000000003', languageCode: 'lo', audioRole: 'pronunciation' }));
    expect(sync.syncRequirement).toHaveBeenCalledOnce();
  });
  it('rejects incomplete payloads so the Outbox publisher retries them', async () => {
    await expect(new ContentAudioRequirementHandler({ syncRequirement: vi.fn() }).handle(event({ sourceDomain: 'content' }))).rejects.toThrow('Invalid content.audio_requirement_changed payload');
  });
});
