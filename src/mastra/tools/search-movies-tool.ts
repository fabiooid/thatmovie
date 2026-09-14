import { createTool } from '@mastra/core/tools';
import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { z } from 'zod';
import { MOVIE_INDEX_NAME } from '../data/movie-store.ts';

const embedder = new ModelRouterEmbeddingModel('openai/text-embedding-3-small');

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

    const { embeddings } = await embedder.doEmbed({ values: [query] });
    const results = await vectorStore.query({
      indexName: MOVIE_INDEX_NAME,
      queryVector: embeddings[0],
      topK: 10,
    });

    return results.map((result) => ({
      title: result.metadata?.title,
      year: result.metadata?.year,
      genres: result.metadata?.genres,
      score: result.score,
      plot: String(result.metadata?.text ?? '').slice(0, 400),
    }));
  },
});
