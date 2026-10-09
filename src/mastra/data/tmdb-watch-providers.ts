import type { WatchCountryCode } from '../../lib/countries.ts';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w45';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export type WatchProvider = {
  id: number;
  name: string;
  logoUrl: string | null;
};

export type WatchAvailability = {
  title: string;
  year: number | null;
  country: WatchCountryCode;
  tmdbId: number | null;
  matchedTitle: string | null;
  stream: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
  tmdbWatchUrl: string | null;
  status:
    | 'ok'
    | 'no_match'
    | 'no_providers'
    | 'missing_api_key'
    | 'error';
  message?: string;
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type TmdbSearchMovie = {
  id: number;
  title: string;
  release_date?: string;
};

type TmdbProvider = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
};

type TmdbCountryProviders = {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
};

const searchCache = new Map<string, CacheEntry<TmdbSearchMovie | null>>();
const providersCache = new Map<string, CacheEntry<WatchAvailability>>();

/** Reads TMDB key from process env (Cursor Cloud secrets or local .env). */
const getApiKey = () => process.env.TMDB_API_KEY?.trim() || '';

const cacheGet = <T>(cache: Map<string, CacheEntry<T>>, key: string) => {
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
};

const cacheSet = <T>(cache: Map<string, CacheEntry<T>>, key: string, value: T) => {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
};

const normalizeTitle = (title: string) => title.trim().toLowerCase().replace(/\s+/g, ' ');

const logoUrl = (logoPath: string | null | undefined) =>
  logoPath ? `${TMDB_IMAGE_BASE}${logoPath}` : null;

const mapProviders = (providers: TmdbProvider[] | undefined): WatchProvider[] =>
  (providers ?? [])
    .slice()
    .sort((a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999))
    .map((provider) => ({
      id: provider.provider_id,
      name: provider.provider_name,
      logoUrl: logoUrl(provider.logo_path),
    }));

const tmdbFetch = async <T>(path: string, params: Record<string, string> = {}) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not set');
  }

  const url = new URL(`${TMDB_API_BASE}${path}`);
  url.searchParams.set('api_key', apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status})`);
  }

  return (await response.json()) as T;
};

const pickBestMatch = (
  results: TmdbSearchMovie[],
  title: string,
  year: number | null,
): TmdbSearchMovie | null => {
  if (results.length === 0) {
    return null;
  }

  const normalized = normalizeTitle(title);
  const scored = results.map((movie) => {
    const movieTitle = normalizeTitle(movie.title);
    const movieYear = movie.release_date
      ? Number(movie.release_date.slice(0, 4))
      : null;
    let score = 0;

    if (movieTitle === normalized) {
      score += 100;
    } else if (movieTitle.includes(normalized) || normalized.includes(movieTitle)) {
      score += 40;
    }

    if (year != null && movieYear === year) {
      score += 50;
    }

    return { movie, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score > 0 ? scored[0].movie : results[0] ?? null;
};

export const findTmdbMovie = async (
  title: string,
  year: number | null = null,
): Promise<TmdbSearchMovie | null> => {
  const cacheKey = `${normalizeTitle(title)}|${year ?? ''}`;
  const cached = cacheGet(searchCache, cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const params: Record<string, string> = {
    query: title.trim(),
    include_adult: 'false',
  };
  if (year != null) {
    params.year = String(year);
  }

  const data = await tmdbFetch<{ results: TmdbSearchMovie[] }>(
    '/search/movie',
    params,
  );
  const match = pickBestMatch(data.results ?? [], title, year);
  cacheSet(searchCache, cacheKey, match);
  return match;
};

export const getWatchAvailability = async ({
  title,
  year = null,
  country,
}: {
  title: string;
  year?: number | null;
  country: WatchCountryCode;
}): Promise<WatchAvailability> => {
  const trimmedTitle = title.trim();
  const cacheKey = `${normalizeTitle(trimmedTitle)}|${year ?? ''}|${country}`;
  const cached = cacheGet(providersCache, cacheKey);
  if (cached) {
    return cached;
  }

  if (!getApiKey()) {
    const result: WatchAvailability = {
      title: trimmedTitle,
      year,
      country,
      tmdbId: null,
      matchedTitle: null,
      stream: [],
      rent: [],
      buy: [],
      tmdbWatchUrl: null,
      status: 'missing_api_key',
      message: 'Streaming lookup is not configured (missing TMDB_API_KEY).',
    };
    return result;
  }

  try {
    const match = await findTmdbMovie(trimmedTitle, year);

    if (!match) {
      const result: WatchAvailability = {
        title: trimmedTitle,
        year,
        country,
        tmdbId: null,
        matchedTitle: null,
        stream: [],
        rent: [],
        buy: [],
        tmdbWatchUrl: null,
        status: 'no_match',
        message: 'Could not match this title on TMDB.',
      };
      cacheSet(providersCache, cacheKey, result);
      return result;
    }

    const data = await tmdbFetch<{
      id: number;
      results: Record<string, TmdbCountryProviders>;
    }>(`/movie/${match.id}/watch/providers`);

    const countryData = data.results?.[country];
    const stream = mapProviders(countryData?.flatrate);
    const rent = mapProviders(countryData?.rent);
    const buy = mapProviders(countryData?.buy);
    const hasAny = stream.length + rent.length + buy.length > 0;

    const result: WatchAvailability = {
      title: trimmedTitle,
      year,
      country,
      tmdbId: match.id,
      matchedTitle: match.title,
      stream,
      rent,
      buy,
      tmdbWatchUrl:
        countryData?.link ??
        `https://www.themoviedb.org/movie/${match.id}/watch?locale=${country}`,
      status: hasAny ? 'ok' : 'no_providers',
      message: hasAny
        ? undefined
        : `No streaming, rent, or buy options found in ${country}.`,
    };

    cacheSet(providersCache, cacheKey, result);
    return result;
  } catch (error) {
    return {
      title: trimmedTitle,
      year,
      country,
      tmdbId: null,
      matchedTitle: null,
      stream: [],
      rent: [],
      buy: [],
      tmdbWatchUrl: null,
      status: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to look up availability.',
    };
  }
};
