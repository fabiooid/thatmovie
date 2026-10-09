export const WATCH_COUNTRIES = [
  { code: 'IT', label: 'Italy' },
  { code: 'US', label: 'United States' },
  { code: 'HK', label: 'Hong Kong' },
  { code: 'AU', label: 'Australia' },
] as const;

export type WatchCountryCode = (typeof WATCH_COUNTRIES)[number]['code'];

export const DEFAULT_WATCH_COUNTRY: WatchCountryCode = 'US';

const COUNTRY_CODES = new Set<string>(WATCH_COUNTRIES.map((c) => c.code));

export const isWatchCountryCode = (value: unknown): value is WatchCountryCode =>
  typeof value === 'string' && COUNTRY_CODES.has(value);

export const getWatchCountryLabel = (code: WatchCountryCode) =>
  WATCH_COUNTRIES.find((country) => country.code === code)?.label ?? code;
