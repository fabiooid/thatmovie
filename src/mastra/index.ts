import { join } from 'node:path';
import { Mastra } from '@mastra/core/mastra';
import { MastraEditor } from '@mastra/editor';
import { LibSQLStore } from '@mastra/libsql';
import { movieAgent } from './agents/movie-agent.ts';
import { createMovieVectorStore, resolveProjectRoot } from './data/movie-store.ts';
import { searchMoviesTool } from './tools/search-movies-tool.ts';

export const mastra = new Mastra({
  agents: { movieAgent },
  tools: { searchMoviesTool },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: `file:${join(resolveProjectRoot(), 'data/mastra.db')}`,
  }),
  editor: new MastraEditor(),
  vectors: {
    movieVectors: createMovieVectorStore(),
  },
});
