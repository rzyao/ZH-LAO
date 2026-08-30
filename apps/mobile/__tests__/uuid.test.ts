import {
  asPublicId,
  InvalidUuidError,
  isUuid,
  looksLikeInternalId,
  parseRouteId,
  publicIdsEqual,
  requireRouteId,
  tryAsPublicId,
  UUID_PATTERN,
} from '../src/api/contracts/uuid';

const VALID = '123e4567-e89b-12d3-a456-426614174000';
const VALID_UPPER = '123E4567-E89B-12D3-A456-426614174000';

describe('UUID / PublicId contract', () => {
  it('accepts canonical UUID strings', () => {
    expect(isUuid(VALID)).toBe(true);
    expect(UUID_PATTERN.test(VALID)).toBe(true);
  });

  it('rejects non-UUID values', () => {
    expect(isUuid('42')).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(123)).toBe(false);
    expect(isUuid('123e4567-e89b-12d3-a456-42661417400')).toBe(false);
    expect(isUuid('g23e4567-e89b-12d3-a456-426614174000')).toBe(false);
  });

  it('asPublicId returns the value on success and throws otherwise', () => {
    expect(asPublicId(VALID)).toBe(VALID);
    expect(() => asPublicId('42')).toThrow(InvalidUuidError);
    expect(() => asPublicId('42', 'userId')).toThrow(/userId/);
  });

  it('tryAsPublicId returns null instead of throwing', () => {
    expect(tryAsPublicId(VALID)).toBe(VALID);
    expect(tryAsPublicId('not-a-uuid')).toBeNull();
  });

  it('detects internal BIGINT-shaped identifiers', () => {
    expect(looksLikeInternalId(42)).toBe(true);
    expect(looksLikeInternalId('42')).toBe(true);
    expect(looksLikeInternalId('000123')).toBe(true);
    expect(looksLikeInternalId(VALID)).toBe(false);
    expect(looksLikeInternalId(1.5)).toBe(false);
    expect(looksLikeInternalId(-3)).toBe(false);
  });

  it('parseRouteId only accepts UUID strings', () => {
    expect(parseRouteId(VALID)).toBe(VALID);
    expect(parseRouteId('42')).toBeNull();
    expect(parseRouteId(null)).toBeNull();
    expect(parseRouteId(undefined)).toBeNull();
    expect(parseRouteId(123)).toBeNull();
  });

  it('requireRouteId throws for invalid route params', () => {
    expect(requireRouteId(VALID)).toBe(VALID);
    expect(() => requireRouteId('abc')).toThrow(InvalidUuidError);
  });

  it('compares public ids case-insensitively', () => {
    expect(publicIdsEqual(VALID, VALID_UPPER)).toBe(true);
    expect(publicIdsEqual(VALID, null)).toBe(false);
    expect(publicIdsEqual(null, null)).toBe(true);
  });
});
