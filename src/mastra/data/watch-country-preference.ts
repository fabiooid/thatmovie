import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  DEFAULT_WATCH_COUNTRY,
  isWatchCountryCode,
  type WatchCountryCode,
} from '../../lib/countries.ts';
import { resolveProjectRoot } from './movie-store.ts';

const PREFS_PATH = join(resolveProjectRoot(), 'data/watch-country.json');

type PreferenceMap = Record<string, WatchCountryCode>;

const readPrefs = (): PreferenceMap => {
  try {
    if (!existsSync(PREFS_PATH)) {
      return {};
    }
    const parsed = JSON.parse(readFileSync(PREFS_PATH, 'utf8')) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    const prefs: PreferenceMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (isWatchCountryCode(value)) {
        prefs[key] = value;
      }
    }
    return prefs;
  } catch {
    return {};
  }
};

const writePrefs = (prefs: PreferenceMap) => {
  mkdirSync(dirname(PREFS_PATH), { recursive: true });
  writeFileSync(PREFS_PATH, `${JSON.stringify(prefs, null, 2)}\n`);
};

export const getWatchCountryForThread = (
  threadId: string | null | undefined,
): WatchCountryCode => {
  if (!threadId) {
    return DEFAULT_WATCH_COUNTRY;
  }
  return readPrefs()[threadId] ?? DEFAULT_WATCH_COUNTRY;
};

export const setWatchCountryForThread = (
  threadId: string,
  country: WatchCountryCode,
): WatchCountryCode => {
  const prefs = readPrefs();
  prefs[threadId] = country;
  writePrefs(prefs);
  return country;
};
