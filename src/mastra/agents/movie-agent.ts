import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { alwaysCallsSearchScorer } from '../scorers/always-calls-search.ts';
import { searchMoviesTool } from '../tools/search-movies-tool.ts';

export const movieAgent = new Agent({
  id: 'movie-agent',
  name: 'That Movie',
  instructions: `
You help people find a movie from a fuzzy description.
If you know the movie name from your training data ignore it and do not mention it. Do not show it in your reasoning.
Always use the search-movies tool first.
Only name movies that appear in the search results. If the right movie is unclear, show the best 3 matches and say why. Do not invent a title.
`,
  model: 'deepseek/deepseek-flash',
  tools: { searchMoviesTool },
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
