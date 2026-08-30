/**
 * UUID contract — Admin Foundation (frozen).
 *
 * All logical/public IDs cross Domain boundaries are represented as UUID
 * strings. The Admin never perceives internal BIGINT database primary keys.
 *
 * A branded type is used so that a plain string is not silently passed where
 * a logical ID is expected.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type Uuid = string & { readonly __brand: unique symbol }

export function isUuid(value: string): value is Uuid {
  return UUID_PATTERN.test(value)
}

/** Throws when the value is not a valid UUID. */
export function assertUuid(value: string): Uuid {
  if (!UUID_PATTERN.test(value)) {
    throw new Error(`Expected a UUID string, got: ${value}`)
  }
  return value as Uuid
}

/** Generate a fresh v4 UUID (RFC 4122) when the runtime supports it. */
export function createUuid(): Uuid {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID() as Uuid
  }
  // Fallback (non-secure) for environments without crypto.randomUUID.
  const hex = () =>
    Math.floor(Math.random() * 0x10000)
      .toString(16)
      .padStart(4, '0')
  return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-${(
    '8' + (Math.floor(Math.random() * 0x10000) % 0x4000).toString(16)
  ).slice(0, 3)}-${hex()}${hex()}${hex()}` as Uuid
}
