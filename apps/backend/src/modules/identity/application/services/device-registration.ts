import { AppError } from '../../../../errors/app-error.js';
import type { IdentityRepositories } from '../ports/index.js';
import type { DeviceInternalId, DevicePlatform, InstallationId, UserInternalId } from '../../domain/index.js';

export type AuthDeviceInput = Readonly<{ installationId: InstallationId; platform: DevicePlatform; deviceName?: string | null; appVersion?: string | null; pushToken?: string | null }>;

// Fresh-primary-authentication device registration shared by phone and facebook auth.
// Semantics are frozen: same installation => update; cross-user => DEVICE_OWNERSHIP_CONFLICT;
// push token cross-user => DEVICE_OWNERSHIP_CONFLICT; fresh auth may restore same-user revoked device.
export async function registerDeviceForAuth(repos: IdentityRepositories, userId: UserInternalId, input: AuthDeviceInput): Promise<DeviceInternalId> {
  const found = await repos.devices.findByInstallationId(input.installationId);
  if (found && found.userId !== userId) throw new AppError({ code: 'DEVICE_OWNERSHIP_CONFLICT', message: 'Device belongs to another account', httpStatus: 409 });
  if (found) {
    const activeToken = input.pushToken ?? null;
    const tokenOwner = activeToken ? await repos.devices.findByPushToken(activeToken) : null;
    if (tokenOwner && tokenOwner.userId !== userId) throw new AppError({ code: 'DEVICE_OWNERSHIP_CONFLICT', message: 'Push token belongs to another account', httpStatus: 409 });
    if (found.revokedAt) await repos.devices.restoreForSameUser(found.id, userId);
    await repos.devices.updateMetadata(found.id, { deviceName: input.deviceName ?? null, appVersion: input.appVersion ?? null, pushToken: activeToken });
    return found.id;
  }
  return (await repos.devices.create({ userId, installationId: input.installationId, platform: input.platform, deviceName: input.deviceName ?? null, appVersion: input.appVersion ?? null, pushToken: input.pushToken ?? null })).id;
}