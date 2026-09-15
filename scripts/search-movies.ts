import { createMovieVectorStore } from '../src/mastra/data/movie-store.ts';
import { searchMovieIndex } from '../src/mastra/tools/search-movies-tool.ts';

const query = process.argv.slice(2).join(' ').trim();

if (!query) {
  console.error('Usage: npm run search:movies -- "your movie description"');
  process.exit(1);
}

const store = createMovieVectorStore();
const results = await searchMovieIndex(store, query);
await store.close();

console.log(`Query: ${query}\n`);

results.forEach((result, index) => {
  const title = String(result.metadata?.title ?? 'Unknown');
  const year = result.metadata?.year ?? 'Unknown';
  console.log(`${index + 1}. ${title} (${year}) — ${result.score.toFixed(3)}`);
});
