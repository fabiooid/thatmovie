import { createTool } from '@mastra/core/tools';
import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import type { MastraVector } from '@mastra/core/vector';
import { z } from 'zod';
import {
  MOVIE_EMBEDDING_MODEL,
  MOVIE_INDEX_NAME,
} from '../data/movie-store.ts';

const embedder = new ModelRouterEmbeddingModel(MOVIE_EMBEDDING_MODEL);
const SEARCH_TOP_K = 10;

export const searchMovieIndex = async (
  vectorStore: MastraVector,
  query: string,
) => {
  const { embeddings } = await embedder.doEmbed({ values: [query] });
  return vectorStore.query({
    indexName: MOVIE_INDEX_NAME,
    queryVector: embeddings[0],
    topK: SEARCH_TOP_K,
  });
};

export const searchMoviesTool = createTool({
  id: 'search-movies',
  description:
    'Search the movie list by a fuzzy plot description. Always use this before naming a movie.',
  inputSchema: z.object({
    query: z.string().describe('The user’s description of the movie'),
  }),
  execute: async ({ query }, context) => {
    const vectorStore = context?.mastra?.getVector('movieVectors');

    if (!vectorStore) {
      throw new Error('Movie search is not available yet.');
    }

    const results = await searchMovieIndex(vectorStore, query);

    return results.map((result) => ({
      title: String(result.metadata?.title ?? 'Unknown'),
      year: result.metadata?.year ?? 'Unknown',
      genres: result.metadata?.genres ?? [],
      score: result.score,
      plot: String(result.metadata?.text ?? '').slice(0, 400),
    }));
  },
});
