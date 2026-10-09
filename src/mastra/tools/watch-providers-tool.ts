import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  DEFAULT_WATCH_COUNTRY,
  getWatchCountryLabel,
  isWatchCountryCode,
  WATCH_COUNTRIES,
} from '../../lib/countries.ts';
import { getThreadIdFromToolContext } from '../data/tool-thread.ts';
import { getWatchCountryForThread } from '../data/watch-country-preference.ts';
import { getWatchAvailability } from '../data/tmdb-watch-providers.ts';

const countryCodes = WATCH_COUNTRIES.map((country) => country.code) as [
  (typeof WATCH_COUNTRIES)[number]['code'],
  ...(typeof WATCH_COUNTRIES)[number]['code'][],
];

export const watchProvidersTool = createTool({
  id: 'get-watch-providers',
  description:
    'Look up where a movie can be streamed, rented, or bought. Uses the user’s saved streaming country (default US) unless you pass country. Supported: IT, US, HK, AU. Use after you have a title from search-movies.',
  inputSchema: z.object({
    title: z.string().describe('Exact movie title from search results'),
    year: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe('Release year when known'),
    country: z
      .enum(countryCodes)
      .optional()
      .describe(
        'Optional override. Prefer the saved country from set-watch-country; omit to use that (or US).',
      ),
  }),
  execute: async ({ title, year, country }, context) => {
    const resolvedCountry =
      (isWatchCountryCode(country) ? country : null) ??
      getWatchCountryForThread(getThreadIdFromToolContext(context)) ??
      DEFAULT_WATCH_COUNTRY;

    const availability = await getWatchAvailability({
      title,
      year: year ?? null,
      country: resolvedCountry,
    });

    return {
      title: availability.title,
      year: availability.year,
      country: availability.country,
      countryLabel: getWatchCountryLabel(availability.country),
      matchedTitle: availability.matchedTitle,
      tmdbId: availability.tmdbId,
      status: availability.status,
      message: availability.message ?? null,
      stream: availability.stream,
      rent: availability.rent,
      buy: availability.buy,
      tmdbWatchUrl: availability.tmdbWatchUrl,
      attribution:
        'Streaming data from JustWatch via TMDB. ThatMovie uses the TMDB API but is not endorsed or certified by TMDB.',
    };
  },
});
