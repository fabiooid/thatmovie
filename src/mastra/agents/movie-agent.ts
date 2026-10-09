import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { alwaysCallsSearchScorer } from '../scorers/always-calls-search.ts';
import { searchMoviesTool } from '../tools/search-movies-tool.ts';
import { setWatchCountryTool } from '../tools/set-watch-country-tool.ts';
import { watchProvidersTool } from '../tools/watch-providers-tool.ts';

export const movieAgent = new Agent({
  id: 'movie-agent',
  name: 'That Movie',
  instructions: `
You help people find a movie from a fuzzy description.
If you know the movie name from your training data ignore it and do not mention it. Do not show it in your reasoning.
Always use the search-movies tool first.
Only name movies that appear in the search results. If the right movie is unclear, show the best 3 matches and say why. Do not invent a title.

Streaming country (where-to-watch):
- Supported countries only: IT (Italy), US (United States), HK (Hong Kong), AU (Australia).
- Default is US until the user sets one.
- If the user says where they are or asks to switch (e.g. "I'm in Italy", "switch to Australia"), call set-watch-country with the matching code, then confirm briefly.
- If they name an unsupported country, say we only support Italy, United States, Hong Kong, and Australia, and ask which of those to use. Do not invent a code.
- After you settle on one best match (or when the user asks where to watch), call get-watch-providers with that title and year when known. Omit country so the saved preference (or US) is used.
- Briefly mention stream / rent / buy and which country was used. If there is no match or no availability, say so simply. Do not invent services.
- Availability can change; do not promise a title is still on a service.
`,
  model: 'deepseek/deepseek-flash',
  tools: { searchMoviesTool, watchProvidersTool, setWatchCountryTool },
  scorers: {
    alwaysCallsSearch: {
      scorer: alwaysCallsSearchScorer,
      sampling: { type: 'ratio', rate: 1 },
    },
  },
  memory: new Memory({
    options: {
      lastMessages: 10,
    },
  }),
  defaultOptions: {
    modelSettings: { temperature: 0.2 },
  },
});
