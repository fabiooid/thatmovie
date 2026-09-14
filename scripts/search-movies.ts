import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import {
  createMovieVectorStore,
  MOVIE_INDEX_NAME,
} from '../src/mastra/data/movie-store.ts';

const query = process.argv.slice(2).join(' ').trim();

if (!query) {
  console.error('Usage: npm run search:movies -- "your movie description"');
  process.exit(1);
}

const embedder = new ModelRouterEmbeddingModel('openai/text-embedding-3-small');
const store = createMovieVectorStore();
const { embeddings } = await embedder.doEmbed({ values: [query] });

const results = await store.query({
  indexName: MOVIE_INDEX_NAME,
  queryVector: embeddings[0],
  topK: 10,
});

await store.close();

console.log(`Query: ${query}\n`);

results.forEach((result, index) => {
  const title = String(result.metadata?.title ?? 'Unknown');
  const year = result.metadata?.year ?? 'Unknown';
  console.log(`${index + 1}. ${title} (${year}) — ${result.score.toFixed(3)}`);
});

const found = results.find(
  (result) => String(result.metadata?.title ?? '') === 'Groundhog Day',
);
console.log(
  found
    ? `\nGroundhog Day is in the top 10 (score ${found.score.toFixed(3)}).`
    : '\nGroundhog Day is not in the top 10.',
);
