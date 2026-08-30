/**
 * Time contract.
 *
 * The V2 backend exchanges timestamps as ISO 8601 strings with an explicit
 * timezone. Screens must not parse or re-format server timestamps by hand.
 */

export type IsoDateTimeString = string;

export type TimeZoneMode = 'local' | 'utc';

export interface FormatDateTimeOptions {
  readonly timeZone?: TimeZoneMode;
  /** Use 24h clock. Defaults to true. */
  readonly hour24?: boolean;
}

const ISO_WITH_TIMEZONE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:?\d{2})$/;

/** Strict ISO 8601 check — a timezone designator is mandatory. */
export function isIsoDateTime(value: unknown): value is IsoDateTimeString {
  return typeof value === 'string' && ISO_WITH_TIMEZONE.test(value);
}

/** Parses an ISO 8601 string. Returns null for invalid or ambiguous input. */
export function parseIsoDateTime(value: unknown): Date | null {
  if (!isIsoDateTime(value)) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Serialises a Date to the canonical wire format (UTC, millisecond precision). */
export function toIsoDateTime(date: Date): IsoDateTimeString {
  return date.toISOString();
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

interface Parts {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function readParts(date: Date, timeZone: TimeZoneMode): Parts {
  if (timeZone === 'utc') {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hours: date.getUTCHours(),
      minutes: date.getUTCMinutes(),
      seconds: date.getUTCSeconds(),
    };
  }
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };
}

/** `2026-08-31`. Returns an em dash placeholder for unparseable input. */
export function formatDate(
  value: IsoDateTimeString | Date | null | undefined,
  options: FormatDateTimeOptions = {},
): string {
  const date = value instanceof Date ? value : parseIsoDateTime(value);
  if (!date) {
    return '—';
  }
  const { year, month, day } = readParts(date, options.timeZone ?? 'local');
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** `2026-08-31 14:05` (24h) — deterministic for tests when `timeZone: 'utc'`. */
export function formatDateTime(
  value: IsoDateTimeString | Date | null | undefined,
  options: FormatDateTimeOptions = {},
): string {
  const date = value instanceof Date ? value : parseIsoDateTime(value);
  if (!date) {
    return '—';
  }
  const timeZone = options.timeZone ?? 'local';
  const hour24 = options.hour24 ?? true;
  const { year, month, day, hours, minutes } = readParts(date, timeZone);

  let hour = hours;
  let suffix = '';
  if (!hour24) {
    suffix = hours < 12 ? ' AM' : ' PM';
    hour = hours % 12 === 0 ? 12 : hours % 12;
  }

  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minutes)}${suffix}`;
}

/** `2026-08-31 14:05:09`. */
export function formatDateTimeWithSeconds(
  value: IsoDateTimeString | Date | null | undefined,
  options: FormatDateTimeOptions = {},
): string {
  const date = value instanceof Date ? value : parseIsoDateTime(value);
  if (!date) {
    return '—';
  }
  const timeZone = options.timeZone ?? 'local';
  const { year, month, day, hours, minutes, seconds } = readParts(date, timeZone);
  return `${year}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Coarse, locale-neutral relative time: `刚刚 / N 分钟前 / N 小时前 / N 天前 / date`. */
export function formatRelativeTime(
  value: IsoDateTimeString | Date | null | undefined,
  now: Date = new Date(),
  options: FormatDateTimeOptions = {},
): string {
  const date = value instanceof Date ? value : parseIsoDateTime(value);
  if (!date) {
    return '—';
  }

  const diff = now.getTime() - date.getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;

  if (abs < MINUTE) {
    return future ? '即将' : '刚刚';
  }
  if (abs < HOUR) {
    const minutes = Math.floor(abs / MINUTE);
    return future ? `${minutes} 分钟后` : `${minutes} 分钟前`;
  }
  if (abs < DAY) {
    const hours = Math.floor(abs / HOUR);
    return future ? `${hours} 小时后` : `${hours} 小时前`;
  }
  if (abs < 7 * DAY) {
    const days = Math.floor(abs / DAY);
    return future ? `${days} 天后` : `${days} 天前`;
  }

  return formatDate(date, options);
}
