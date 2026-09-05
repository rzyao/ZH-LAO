import { AudioRolePolicy } from '../domain/audio-role-policy.js';
import { calculateAudioInputHashMaterial, type ContentAudioSourceReader } from '../public/content-public-queries.js';

export type AdminAudioCell =
  | Readonly<{ status: 'available'; playback: Readonly<{ url: string; expires_at: string; content_type: string }> }>
  | Readonly<{ status: 'unavailable' }>
  | Readonly<{ status: 'no_audio' }>;

export function isAudioAdminContentType(contentType: string): contentType is (typeof AudioRolePolicy.ALLOWED_CONTENT_TYPES)[number] {
  return AudioRolePolicy.ALLOWED_CONTENT_TYPES.includes(contentType as (typeof AudioRolePolicy.ALLOWED_CONTENT_TYPES)[number]);
}

type OfficialAudioReader = Readonly<{
  resolveOfficialAudio(request: Readonly<{
    entityType: string; entityId: string; languageCode: 'zh' | 'lo'; audioRole: string; revisionId: string; audioInputHash: string;
  }>): Promise<
    | Readonly<{ status: 'available'; audio: Readonly<{ url: string; expiresAt: string; contentType: string }> }>
    | Readonly<{ status: 'unavailable' }>
  >;
}>;

/** Content-admin read model; it never accesses Audio or Asset tables directly. */
export class AudioAdminProjection {
  constructor(private readonly sources: ContentAudioSourceReader, private readonly officialAudio: OfficialAudioReader) {}

  async resolve(contentType: string, contentId: string): Promise<AdminAudioCell> {
    if (!isAudioAdminContentType(contentType)) {
      return { status: 'unavailable' };
    }
    const source = await this.sources.findCurrentPublished(contentType as (typeof AudioRolePolicy.ALLOWED_CONTENT_TYPES)[number], contentId);
    if (!source || !source.textSnapshot.trim()) return { status: 'unavailable' };
    if (source.noAudio) return { status: 'no_audio' };
    const roles = source.entityType.startsWith('lo_') ? ['pronunciation'] : ['tone_1', 'tone_2', 'tone_3', 'tone_4'];
    const resolutions = await Promise.all(roles.map(async (audioRole) => ({
      audioRole,
      resolution: await this.officialAudio.resolveOfficialAudio({
        entityType: source.entityType,
        entityId: source.entityId,
        languageCode: source.languageCode,
        audioRole,
        revisionId: source.revisionId,
        audioInputHash: calculateAudioInputHashMaterial(source, audioRole),
      }),
    })));
    const match = resolutions.find((item) => item.resolution.status === 'available');
    if (!match || match.resolution.status !== 'available') return { status: 'unavailable' };
    return {
      status: 'available',
      playback: { url: match.resolution.audio.url, expires_at: match.resolution.audio.expiresAt, content_type: match.resolution.audio.contentType },
    };
  }

  async resolveMany(items: readonly Readonly<{ contentType: string; contentId: string }>[]): Promise<Map<string, AdminAudioCell>> {
    const resolved = await Promise.all(items.map(async (item) => [item.contentId, await this.resolve(item.contentType, item.contentId)] as const));
    return new Map(resolved);
  }
}
