import {
  formatDate,
  formatDateTime,
  formatDateTimeWithSeconds,
  formatRelativeTime,
  isIsoDateTime,
  parseIsoDateTime,
  toIsoDateTime,
} from '../src/api/contracts/time';

const T = '2026-08-31T06:30:05.000Z';

describe('Time contract', () => {
  it('requires an explicit timezone designator', () => {
    expect(isIsoDateTime('2026-08-31T06:30:05Z')).toBe(true);
    expect(isIsoDateTime('2026-08-31T06:30:05+08:00')).toBe(true);
    expect(isIsoDateTime('2026-08-31T06:30:05-0700')).toBe(true);
    expect(isIsoDateTime('2026-08-31T06:30:05')).toBe(false);
    expect(isIsoDateTime('2026-08-31')).toBe(false);
    expect(isIsoDateTime('')).toBe(false);
    expect(isIsoDateTime(null)).toBe(false);
  });

  it('parses valid ISO strings and rejects the rest', () => {
    expect(parseIsoDateTime(T)?.toISOString()).toBe(T);
    expect(parseIsoDateTime('2026-08-31T06:30:05')).toBeNull();
    expect(parseIsoDateTime('nonsense')).toBeNull();
  });

  it('serialises back to the canonical wire format', () => {
    expect(toIsoDateTime(new Date(T))).toBe(T);
  });

  it('formats dates deterministically in UTC', () => {
    expect(formatDate(T, { timeZone: 'utc' })).toBe('2026-08-31');
    expect(formatDateTime(T, { timeZone: 'utc' })).toBe('2026-08-31 06:30');
    expect(formatDateTimeWithSeconds(T, { timeZone: 'utc' })).toBe('2026-08-31 06:30:05');
  });

  it('supports 12h clock', () => {
    expect(formatDateTime(T, { timeZone: 'utc', hour24: false })).toBe('2026-08-31 06:30 AM');
    const pm = '2026-08-31T18:30:05.000Z';
    expect(formatDateTime(pm, { timeZone: 'utc', hour24: false })).toBe('2026-08-31 06:30 PM');
  });

  it('returns an em dash placeholder for invalid input', () => {
    expect(formatDate('bad')).toBe('—');
    expect(formatDateTime(null)).toBe('—');
    expect(formatRelativeTime(undefined)).toBe('—');
  });

  it('formats coarse relative time', () => {
    const now = new Date('2026-08-31T12:00:00.000Z');
    expect(formatRelativeTime('2026-08-31T11:59:40.000Z', now)).toBe('刚刚');
    expect(formatRelativeTime('2026-08-31T11:35:00.000Z', now)).toBe('25 分钟前');
    expect(formatRelativeTime('2026-08-31T09:00:00.000Z', now)).toBe('3 小时前');
    expect(formatRelativeTime('2026-08-29T12:00:00.000Z', now)).toBe('2 天前');
    expect(formatRelativeTime('2026-08-31T12:30:00.000Z', now)).toBe('30 分钟后');
    expect(formatRelativeTime('2020-01-01T00:00:00.000Z', now, { timeZone: 'utc' })).toBe(
      '2020-01-01',
    );
  });
});
