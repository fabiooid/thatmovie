import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { WATCH_COUNTRIES } from '../../lib/countries.ts';
import { getWatchAvailability } from '../data/tmdb-watch-providers.ts';

const countryCodes = WATCH_COUNTRIES.map((country) => country.code) as [
  (typeof WATCH_COUNTRIES)[number]['code'],
  ...(typeof WATCH_COUNTRIES)[number]['code'][],
];

export const watchProvidersTool = createTool({
  id: 'get-watch-providers',
  description:
    'Look up where a movie can be streamed, rented, or bought in one country (IT, US, HK, or AU). Use after you have a title from search-movies.',
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
      .describe('ISO country code for availability (IT, US, HK, or AU)'),
  }),
  execute: async ({ title, year, country }) => {
    const availability = await getWatchAvailability({
      title,
      year: year ?? null,
      country,
    });

    return {
      title: availability.title,
      year: availability.year,
      country: availability.country,
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
