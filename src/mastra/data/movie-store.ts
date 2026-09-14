import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { LibSQLVector } from '@mastra/libsql';

const resolveProjectRoot = () => {
  const starts = [process.env.INIT_CWD, process.cwd()].filter(Boolean);

  for (const start of starts) {
    let dir = resolve(start);
    for (let i = 0; i < 8; i += 1) {
      if (
        existsSync(join(dir, 'data/movies-vector.db')) ||
        existsSync(join(dir, 'data/movies.jsonl'))
      ) {
        return dir;
      }

      const parent = resolve(dir, '..');
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
  }

  return process.cwd();
};

export const MOVIE_INDEX_NAME = 'movies';
export const MOVIE_EMBEDDING_DIMENSION = 1536;
export const MOVIE_VECTOR_URL = `file:${join(resolveProjectRoot(), 'data/movies-vector.db')}`;

export const createMovieVectorStore = () =>
  new LibSQLVector({
    id: 'movie-vectors',
    url: MOVIE_VECTOR_URL,
  });
