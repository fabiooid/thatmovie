import { Mastra } from '@mastra/core/mastra';
import { movieAgent } from './agents/movie-agent.ts';
import { createMovieVectorStore } from './data/movie-store.ts';

export const mastra = new Mastra({
  agents: { movieAgent },
  vectors: {
    movieVectors: createMovieVectorStore(),
  },
});
