import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { alwaysCallsSearchScorer } from '../scorers/always-calls-search.ts';
import { searchMoviesTool } from '../tools/search-movies-tool.ts';
import { watchProvidersTool } from '../tools/watch-providers-tool.ts';

export const movieAgent = new Agent({
  id: 'movie-agent',
  name: 'That Movie',
  instructions: `
You help people find a movie from a fuzzy description.
If you know the movie name from your training data ignore it and do not mention it. Do not show it in your reasoning.
Always use the search-movies tool first.
Only name movies that appear in the search results. If the right movie is unclear, show the best 3 matches and say why. Do not invent a title.
After you settle on one best match (or when the user asks where to watch), call get-watch-providers with that title, year when known, and the user's country code from the request (IT, US, HK, or AU).
Briefly mention stream / rent / buy services when the tool returns them. If there is no match or no availability, say so simply. Do not invent services.
Availability can change; do not promise a title is still on a service.
`,
  model: 'deepseek/deepseek-flash',
  tools: { searchMoviesTool, watchProvidersTool },
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
