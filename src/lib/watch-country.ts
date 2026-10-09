import {
  DEFAULT_WATCH_COUNTRY,
  isWatchCountryCode,
  WATCH_COUNTRY_STORAGE_KEY,
  type WatchCountryCode,
} from './countries.ts';

export const getStoredWatchCountry = (): WatchCountryCode => {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_WATCH_COUNTRY;
  }

  const stored = localStorage.getItem(WATCH_COUNTRY_STORAGE_KEY);
  return isWatchCountryCode(stored) ? stored : DEFAULT_WATCH_COUNTRY;
};

export const saveWatchCountry = (country: WatchCountryCode) => {
  localStorage.setItem(WATCH_COUNTRY_STORAGE_KEY, country);
};
