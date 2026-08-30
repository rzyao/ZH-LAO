import { AppError } from '../../../errors/app-error.js';

export function invalidArgument(message: string, details?: unknown): AppError {
  return new AppError({
    code: 'PLATFORM_INVALID_ARGUMENT',
    message,
    httpStatus: 400,
    details,
  });
}

export function notFound(message: string, details?: unknown): AppError {
  return new AppError({
    code: 'PLATFORM_NOT_FOUND',
    message,
    httpStatus: 404,
    details,
  });
}

export function conflict(message: string, details?: unknown): AppError {
  return new AppError({
    code: 'PLATFORM_CONFLICT',
    message,
    httpStatus: 409,
    details,
  });
}

export function featureFlagRetired(key: string): AppError {
  return new AppError({
    code: 'FEATURE_FLAG_RETIRED',
    message: `Feature flag '${key}' is retired and cannot be modified`,
    httpStatus: 409,
    details: { key },
  });
}

export function featureFlagInvalidScope(message = 'Feature flag override requires region_code or client_platform'): AppError {
  return new AppError({
    code: 'FEATURE_FLAG_INVALID_SCOPE',
    message,
    httpStatus: 400,
  });
}

export function runtimeConfigKeyUnregistered(key: string): AppError {
  return new AppError({
    code: 'RUNTIME_CONFIG_KEY_UNREGISTERED',
    message: `Runtime config key '${key}' is not registered in application registry`,
    httpStatus: 400,
    details: { key },
  });
}

export function runtimeConfigUnavailable(key: string, message?: string): AppError {
  return new AppError({
    code: 'RUNTIME_CONFIG_UNAVAILABLE',
    message: message ?? `Runtime config '${key}' is unavailable and has no default fallback`,
    httpStatus: 503,
    details: { key },
  });
}

export function runtimeConfigInvalidValue(key: string, message: string, details?: unknown): AppError {
  return new AppError({
    code: 'RUNTIME_CONFIG_INVALID_VALUE',
    message: `Runtime config '${key}' has invalid value: ${message}`,
    httpStatus: 400,
    details: { key, details },
  });
}

export function runtimeConfigRetired(key: string): AppError {
  return new AppError({
    code: 'RUNTIME_CONFIG_RETIRED',
    message: `Runtime config '${key}' is retired and cannot be modified`,
    httpStatus: 409,
    details: { key },
  });
}

export function appVersionMismatch(expectedVersion: string, actualVersion: string, buildNumber: number): AppError {
  return new AppError({
    code: 'APP_VERSION_MISMATCH',
    message: `App version string '${actualVersion}' does not match registered version '${expectedVersion}' for build ${buildNumber}`,
    httpStatus: 409,
    details: { expectedVersion, actualVersion, buildNumber },
  });
}

export function appVersionPolicyUnavailable(clientPlatform: string, message?: string): AppError {
  return new AppError({
    code: 'APP_VERSION_POLICY_UNAVAILABLE',
    message: message ?? `No active released target available for platform '${clientPlatform}'`,
    httpStatus: 503,
    details: { clientPlatform },
  });
}

export function appVersionInvalidTransition(message: string, details?: unknown): AppError {
  return new AppError({
    code: 'APP_VERSION_INVALID_TRANSITION',
    message,
    httpStatus: 409,
    details,
  });
}

export function announcementInvalidTransition(message: string, details?: unknown): AppError {
  return new AppError({
    code: 'ANNOUNCEMENT_INVALID_TRANSITION',
    message,
    httpStatus: 409,
    details,
  });
}

export function regionInvalid(message: string, details?: unknown): AppError {
  return new AppError({
    code: 'REGION_INVALID',
    message,
    httpStatus: 400,
    details,
  });
}

export function regionRetired(code: string): AppError {
  return new AppError({
    code: 'REGION_RETIRED',
    message: `Region '${code}' is retired and cannot be modified`,
    httpStatus: 409,
    details: { code },
  });
}
