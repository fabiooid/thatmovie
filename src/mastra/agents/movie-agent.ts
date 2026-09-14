import { Agent } from '@mastra/core/agent';
import { searchMoviesTool } from '../tools/search-movies-tool.ts';

export const movieAgent = new Agent({
  id: 'movie-agent',
  name: 'That Movie',
  instructions: `
You help people find a movie from a fuzzy description.

Always use the search-movies tool first. Only name movies that appear in the search results. If the right movie is unclear, show the best 3 matches and say why. Do not invent a title.
`,
  model: 'deepseek/deepseek-flash',
  tools: { searchMoviesTool },
  defaultOptions: {
    modelSettings: { temperature: 0.2 },
  },
});
