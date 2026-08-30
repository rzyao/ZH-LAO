/**
 * UUID / Public ID contract.
 *
 * V2 rule: every cross-domain or public identifier is an opaque UUID string.
 * The client must never depend on database BIGINT primary keys, sequence ids or
 * any other internal, ordered identifier.
 */

/** Canonical RFC 4122 shape (version and variant nibbles kept permissive). */
export const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

declare const publicIdBrand: unique symbol;

/**
 * A public / logical identifier. Structurally a UUID string, but branded so
 * that raw strings cannot be passed where a domain id is expected.
 */
export type PublicId = string & { readonly [publicIdBrand]: 'PublicId' };

/** Unbranded UUID string. */
export type Uuid = string;

export class InvalidUuidError extends Error {
  constructor(value: string) {
    super(`Invalid UUID: ${value}`);
    this.name = 'InvalidUuidError';
  }
}

export function isUuid(value: unknown): value is Uuid {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

/**
 * Narrows an unknown navigation / response value to a `PublicId`.
 * Throws when the value is not a UUID so bad data fails fast instead of
 * silently producing broken requests.
 */
export function asPublicId(value: string, label = 'id'): PublicId {
  if (!isUuid(value)) {
    throw new InvalidUuidError(`${label}: ${value}`);
  }
  return value as PublicId;
}

export function tryAsPublicId(value: unknown): PublicId | null {
  return isUuid(value) ? (value as PublicId) : null;
}

/**
 * Detects database-shaped identifiers. Used by Foundation audits and tests to
 * prove that no internal BIGINT contract leaked into the client.
 */
export function looksLikeInternalId(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 0;
  }
  return typeof value === 'string' && /^\d{1,19}$/.test(value.trim());
}

/**
 * Validates a navigation route parameter. Route params are untrusted input:
 * deep links and programmatic navigation can both supply arbitrary strings.
 */
export function parseRouteId(value: unknown, _label = 'id'): PublicId | null {
  if (typeof value !== 'string') {
    return null;
  }
  if (!isUuid(value)) {
    return null;
  }
  return value as PublicId;
}

export function requireRouteId(value: unknown, label = 'id'): PublicId {
  const parsed = parseRouteId(value, label);
  if (!parsed) {
    throw new InvalidUuidError(`${label}: ${String(value)}`);
  }
  return parsed;
}

export function publicIdsEqual(a: PublicId | string | null, b: PublicId | string | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  return a.toLowerCase() === b.toLowerCase();
}
