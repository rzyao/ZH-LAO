import { invalidArgument } from './errors.js';
import type { PlatformClientPlatform } from './feature-flag.js';
import type { AnnouncementInternalId, AnnouncementPublicId, RegionInternalId } from './ids.js';

export type AnnouncementStatus = 'draft' | 'published' | 'retired';

export type AnnouncementRecord = Readonly<{
  id: AnnouncementInternalId;
  publicId: AnnouncementPublicId;
  title: string;
  content: string;
  regionId: RegionInternalId | null;
  clientPlatform: PlatformClientPlatform | null;
  status: AnnouncementStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type AnnouncementPublicDto = Readonly<{
  announcementId: string;
  title: string;
  content: string;
  startsAt: string;
  endsAt?: string | undefined;
}>;

export function validateAnnouncementTitle(title: string): string {
  const trimmed = title?.trim();
  if (!trimmed || trimmed.length > 200) {
    throw invalidArgument('Announcement title cannot be blank and must be <= 200 characters');
  }
  return trimmed;
}

export function validateAnnouncementContent(content: string): string {
  const trimmed = content?.trim();
  if (!trimmed) {
    throw invalidArgument('Announcement content cannot be blank');
  }
  return trimmed;
}

export function validateAnnouncementTimeWindow(startsAt: Date | null, endsAt: Date | null): void {
  if (endsAt && startsAt && endsAt <= startsAt) {
    throw invalidArgument('Announcement ends_at must be strictly greater than starts_at');
  }
}
