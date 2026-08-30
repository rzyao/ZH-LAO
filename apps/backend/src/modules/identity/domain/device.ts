import { z } from 'zod';

export const devicePlatformSchema = z.enum(['android', 'ios']);
export type DevicePlatform = z.infer<typeof devicePlatformSchema>;
export const parseDevicePlatform = (value: unknown): DevicePlatform => devicePlatformSchema.parse(value);
