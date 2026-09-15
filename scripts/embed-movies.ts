import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModelRouterEmbeddingModel } from '@mastra/core/llm';
import { MDocument } from '@mastra/rag';
import type { Movie } from '../src/mastra/data/movie.ts';
import {
  createMovieVectorStore,
  MOVIE_EMBEDDING_DIMENSION,
  MOVIE_EMBEDDING_MODEL,
  MOVIE_INDEX_NAME,
} from '../src/mastra/data/movie-store.ts';
import { movieToText } from '../src/mastra/data/movie-text.ts';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const moviesPath = join(projectRoot, 'data/movies.jsonl');
const MAX_CHUNK_CHARS = 6000;
const BATCH_SIZE = 64;
const embedder = new ModelRouterEmbeddingModel(MOVIE_EMBEDDING_MODEL);

type MovieChunk = {
  id: string;
  text: string;
  metadata: {
    movieId: string;
    title: string;
    year: number | null;
    genres: string[];
    runtime: number | null;
    text: string;
    chunkIndex: number;
    chunkCount: number;
  };
};

const loadMovies = async (): Promise<Movie[]> => {
  const movies: Movie[] = [];
  const lines = createInterface({ input: createReadStream(moviesPath) });

  for await (const line of lines) {
    if (line.trim()) {
      movies.push(JSON.parse(line) as Movie);
    }
  }

  return movies;
};

const chunkMovie = async (movie: Movie): Promise<MovieChunk[]> => {
  const text = movieToText(movie);
  const parts =
    text.length <= MAX_CHUNK_CHARS
      ? [text]
      : (
          await MDocument.fromText(text).chunk({
            strategy: 'recursive',
            maxSize: MAX_CHUNK_CHARS,
            overlap: 200,
            separators: ['\n\n', '\n', '. ', ' '],
          })
        ).map((chunk) => chunk.text);

  return parts.map((part, index) => ({
    id: parts.length === 1 ? movie.id : `${movie.id}_${index}`,
    text: part,
    metadata: {
      movieId: movie.id,
      title: movie.title,
      year: movie.year,
      genres: movie.genres,
      runtime: movie.runtime,
      text: part,
      chunkIndex: index,
      chunkCount: parts.length,
    },
  }));
};

const embedBatch = async (texts: string[]) => {
  let attempt = 0;

  while (true) {
    try {
      const result = await embedder.doEmbed({ values: texts });
      return result.embeddings;
    } catch (error) {
      attempt += 1;
      if (attempt >= 5) {
        throw error;
      }

      const waitMs = 1000 * 2 ** (attempt - 1);
      console.warn(
        `Embed batch failed (attempt ${attempt}). Retrying in ${waitMs}ms.`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
};

const embedMovies = async () => {
  const movies = await loadMovies();
  const store = createMovieVectorStore();

  try {
    await store.createIndex({
      indexName: MOVIE_INDEX_NAME,
      dimension: MOVIE_EMBEDDING_DIMENSION,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('already')) {
      throw error;
    }
  }

  let chunkCount = 0;
  let batch: MovieChunk[] = [];

  const flush = async () => {
    if (batch.length === 0) {
      return;
    }

    const embeddings = await embedBatch(batch.map((chunk) => chunk.text));
    await store.upsert({
      indexName: MOVIE_INDEX_NAME,
      vectors: embeddings,
      metadata: batch.map((chunk) => chunk.metadata),
      ids: batch.map((chunk) => chunk.id),
    });
    chunkCount += batch.length;
    batch = [];
  };

  for (const [index, movie] of movies.entries()) {
    batch.push(...(await chunkMovie(movie)));

    if (batch.length >= BATCH_SIZE) {
      await flush();
    }

    if ((index + 1) % 500 === 0) {
      console.log(`Embedded ${index + 1} / ${movies.length} movies (${chunkCount} chunks)`);
    }
  }

  await flush();
  await store.close();

  console.log(`Done. Embedded ${movies.length} movies as ${chunkCount} chunks.`);
};

await embedMovies();
