import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
  getWatchCountryLabel,
  WATCH_COUNTRIES,
} from '../../lib/countries.ts';
import { getThreadIdFromToolContext } from '../data/tool-thread.ts';
import { setWatchCountryForThread } from '../data/watch-country-preference.ts';

const countryCodes = WATCH_COUNTRIES.map((country) => country.code) as [
  (typeof WATCH_COUNTRIES)[number]['code'],
  ...(typeof WATCH_COUNTRIES)[number]['code'][],
];

export const setWatchCountryTool = createTool({
  id: 'set-watch-country',
  description:
    'Save the user’s country for where-to-watch lookups. Supported codes: IT (Italy), US (United States), HK (Hong Kong), AU (Australia). Call this when the user says where they are or asks to switch country.',
  inputSchema: z.object({
    country: z
      .enum(countryCodes)
      .describe('ISO country code: IT, US, HK, or AU'),
  }),
  execute: async ({ country }, context) => {
    const threadId = getThreadIdFromToolContext(context);

    if (!threadId) {
      return {
        ok: false as const,
        country,
        label: getWatchCountryLabel(country),
        message: 'Could not save country for this chat.',
      };
    }

    setWatchCountryForThread(threadId, country);

    return {
      ok: true as const,
      country,
      label: getWatchCountryLabel(country),
      message: `Streaming country set to ${getWatchCountryLabel(country)} (${country}).`,
    };
  },
});
