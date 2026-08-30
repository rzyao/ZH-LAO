import {
  announcementInvalidTransition,
  invalidArgument,
  notFound,
  parseAnnouncementPublicId,
  validateAnnouncementContent,
  validateAnnouncementTimeWindow,
  validateAnnouncementTitle,
  validateClientPlatform,
  validateRegionCode,
  type AnnouncementPublicDto,
  type AnnouncementRecord,
  type PlatformClientPlatform,
  type RegionInternalId,
} from '../../domain/index.js';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import type {
  AnnouncementRepository,
  RegionRepository,
} from '../ports/platform-repositories.js';

export type GetActiveAnnouncementsInput = Readonly<{
  regionCode?: string | undefined;
  clientPlatform?: PlatformClientPlatform | undefined;
}>;

export class AnnouncementUseCases {
  constructor(
    private readonly announcementRepo: AnnouncementRepository,
    private readonly regionRepo: RegionRepository,
  ) {}

  async getActiveAnnouncements(
    executor: DatabaseExecutor,
    input: GetActiveAnnouncementsInput,
  ): Promise<readonly AnnouncementPublicDto[]> {
    let regionId: RegionInternalId | null = null;
    if (input.regionCode) {
      const validCode = validateRegionCode(input.regionCode);
      const region = await this.regionRepo.findByCode(executor, validCode);
      if (region) {
        regionId = region.id;
      }
    }

    const clientPlatform = input.clientPlatform ? validateClientPlatform(input.clientPlatform) : null;

    const records = await this.announcementRepo.findActiveAnnouncements(executor, {
      regionId,
      clientPlatform,
      now: new Date(),
    });

    return records.map((r) => ({
      announcementId: r.publicId,
      title: r.title,
      content: r.content,
      startsAt: r.startsAt!.toISOString(),
      endsAt: r.endsAt ? r.endsAt.toISOString() : undefined,
    }));
  }

  // Management Commands
  async createAnnouncementDraft(
    executor: DatabaseExecutor,
    input: Readonly<{
      title: string;
      content: string;
      regionCode?: string | null;
      clientPlatform?: PlatformClientPlatform | null;
      startsAt?: Date | null;
      endsAt?: Date | null;
    }>,
  ): Promise<AnnouncementRecord> {
    const title = validateAnnouncementTitle(input.title);
    const content = validateAnnouncementContent(input.content);
    const startsAt = input.startsAt ?? null;
    const endsAt = input.endsAt ?? null;

    validateAnnouncementTimeWindow(startsAt, endsAt);

    let regionId: RegionInternalId | null = null;
    if (input.regionCode) {
      const region = await this.regionRepo.findByCode(executor, input.regionCode);
      if (!region) {
        throw notFound(`Region '${input.regionCode}' not found`);
      }
      if (region.status === 'retired') {
        throw invalidArgument(`Cannot create announcement for retired region '${input.regionCode}'`);
      }
      regionId = region.id;
    }

    const clientPlatform = input.clientPlatform ? validateClientPlatform(input.clientPlatform) : null;

    return this.announcementRepo.create(executor, {
      title,
      content,
      regionId,
      clientPlatform,
      status: 'draft',
      startsAt,
      endsAt,
    });
  }

  async updateAnnouncement(
    executor: DatabaseExecutor,
    publicIdString: string,
    input: Readonly<{
      title?: string;
      content?: string;
      regionCode?: string | null;
      clientPlatform?: PlatformClientPlatform | null;
      startsAt?: Date | null;
      endsAt?: Date | null;
    }>,
  ): Promise<AnnouncementRecord> {
    const publicId = parseAnnouncementPublicId(publicIdString);
    const record = await this.announcementRepo.findByPublicId(executor, publicId, true);
    if (!record) {
      throw notFound(`Announcement '${publicIdString}' not found`);
    }
    if (record.status === 'retired') {
      throw announcementInvalidTransition('Cannot update a retired announcement');
    }

    const title = input.title !== undefined ? validateAnnouncementTitle(input.title) : undefined;
    const content = input.content !== undefined ? validateAnnouncementContent(input.content) : undefined;

    if (record.status === 'published') {
      // Published scope and initial starts_at are immutable
      if (input.regionCode !== undefined || input.clientPlatform !== undefined) {
        throw announcementInvalidTransition('Cannot modify scope (region/client) of a published announcement');
      }
      if (input.startsAt !== undefined && input.startsAt && record.startsAt && input.startsAt.getTime() !== record.startsAt.getTime()) {
        throw announcementInvalidTransition('Cannot modify starts_at of a published announcement');
      }

      const endsAt = input.endsAt !== undefined ? input.endsAt : record.endsAt;
      validateAnnouncementTimeWindow(record.startsAt, endsAt);

      const updateData: { title?: string; content?: string; endsAt?: Date | null } = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (endsAt !== undefined) updateData.endsAt = endsAt;

      return this.announcementRepo.update(executor, record.id, updateData);
    }

    // Draft updates
    const startsAt = input.startsAt !== undefined ? input.startsAt : record.startsAt;
    const endsAt = input.endsAt !== undefined ? input.endsAt : record.endsAt;
    validateAnnouncementTimeWindow(startsAt, endsAt);

    let regionId: RegionInternalId | null | undefined = undefined;
    if (input.regionCode !== undefined) {
      if (input.regionCode === null) {
        regionId = null;
      } else {
        const region = await this.regionRepo.findByCode(executor, input.regionCode);
        if (!region) {
          throw notFound(`Region '${input.regionCode}' not found`);
        }
        if (region.status === 'retired') {
          throw invalidArgument(`Cannot assign retired region '${input.regionCode}' to announcement draft`);
        }
        regionId = region.id;
      }
    }

    const clientPlatform = input.clientPlatform !== undefined
      ? (input.clientPlatform ? validateClientPlatform(input.clientPlatform) : null)
      : undefined;

    const draftUpdate: {
      title?: string;
      content?: string;
      regionId?: RegionInternalId | null;
      clientPlatform?: PlatformClientPlatform | null;
      startsAt?: Date | null;
      endsAt?: Date | null;
    } = {};
    if (title !== undefined) draftUpdate.title = title;
    if (content !== undefined) draftUpdate.content = content;
    if (regionId !== undefined) draftUpdate.regionId = regionId;
    if (clientPlatform !== undefined) draftUpdate.clientPlatform = clientPlatform;
    if (startsAt !== undefined) draftUpdate.startsAt = startsAt;
    if (endsAt !== undefined) draftUpdate.endsAt = endsAt;

    return this.announcementRepo.update(executor, record.id, draftUpdate);
  }

  async publishAnnouncement(
    executor: DatabaseExecutor,
    publicIdString: string,
  ): Promise<AnnouncementRecord> {
    const publicId = parseAnnouncementPublicId(publicIdString);
    const record = await this.announcementRepo.findByPublicId(executor, publicId, true);
    if (!record) {
      throw notFound(`Announcement '${publicIdString}' not found`);
    }
    if (record.status === 'published') {
      return record; // idempotent
    }
    if (record.status === 'retired') {
      throw announcementInvalidTransition('Cannot publish a retired announcement');
    }

    const startsAt = record.startsAt ?? new Date();
    validateAnnouncementTimeWindow(startsAt, record.endsAt);

    return this.announcementRepo.update(executor, record.id, {
      status: 'published',
      startsAt,
    });
  }

  async retireAnnouncement(
    executor: DatabaseExecutor,
    publicIdString: string,
  ): Promise<AnnouncementRecord> {
    const publicId = parseAnnouncementPublicId(publicIdString);
    const record = await this.announcementRepo.findByPublicId(executor, publicId, true);
    if (!record) {
      throw notFound(`Announcement '${publicIdString}' not found`);
    }
    if (record.status === 'retired') {
      return record; // idempotent
    }

    return this.announcementRepo.update(executor, record.id, {
      status: 'retired',
    });
  }

  async deleteAnnouncementDraft(
    executor: DatabaseExecutor,
    publicIdString: string,
  ): Promise<boolean> {
    const publicId = parseAnnouncementPublicId(publicIdString);
    const record = await this.announcementRepo.findByPublicId(executor, publicId, true);
    if (!record) {
      return false;
    }
    if (record.status !== 'draft') {
      throw announcementInvalidTransition(`Cannot delete non-draft announcement (status: '${record.status}')`);
    }

    return this.announcementRepo.deleteDraft(executor, record.id);
  }

  async listAnnouncementsForManagement(executor: DatabaseExecutor): Promise<readonly AnnouncementRecord[]> {
    return this.announcementRepo.listForManagement(executor);
  }
}
