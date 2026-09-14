import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Movie } from '../src/mastra/data/movie.ts';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir =
  process.env.MOVIE_SUMMARIES_DIR ??
  '/Users/fabiovella/Downloads/MovieSummaries';
const outputPath = join(projectRoot, 'data/movies.jsonl');

const parseNameMap = (value: string): string[] => {
  if (!value || value === '\\N') {
    return [];
  }

  try {
    return Object.values(JSON.parse(value) as Record<string, string>);
  } catch {
    return [];
  }
};

const parseYear = (value: string): number | null => {
  const match = value.match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
};

const parseRuntime = (value: string): number | null => {
  if (!value) {
    return null;
  }

  const runtime = Number(value);
  return Number.isFinite(runtime) ? runtime : null;
};

const loadMetadata = async () => {
  const metadata = new Map<
    string,
    Pick<Movie, 'title' | 'year' | 'genres' | 'runtime'>
  >();
  const lines = createInterface({
    input: createReadStream(join(sourceDir, 'movie.metadata.tsv')),
  });

  for await (const line of lines) {
    const [
      id,
      ,
      title,
      releaseDate = '',
      ,
      runtime = '',
      ,
      ,
      genres = '',
    ] = line.split('\t');

    if (!id || !title) {
      continue;
    }

    metadata.set(id, {
      title,
      year: parseYear(releaseDate),
      genres: parseNameMap(genres),
      runtime: parseRuntime(runtime),
    });
  }

  return metadata;
};

const buildMovies = async () => {
  const metadata = await loadMetadata();
  const movies: Movie[] = [];
  const lines = createInterface({
    input: createReadStream(join(sourceDir, 'plot_summaries.txt')),
  });

  for await (const line of lines) {
    const tab = line.indexOf('\t');
    if (tab === -1) {
      continue;
    }

    const id = line.slice(0, tab);
    const plot = line.slice(tab + 1).trim();
    const info = metadata.get(id);

    if (!info || !plot) {
      continue;
    }

    movies.push({
      id,
      title: info.title,
      year: info.year,
      genres: info.genres,
      runtime: info.runtime,
      plot,
    });
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    movies.map((movie) => JSON.stringify(movie)).join('\n') + '\n',
  );

  const groundhogDay = movies.find((movie) => movie.title === 'Groundhog Day');

  console.log(`Wrote ${movies.length} movies to ${outputPath}`);

  if (groundhogDay) {
    console.log(
      `Found Groundhog Day (${groundhogDay.year}) — ${groundhogDay.genres.join(', ')}`,
    );
    console.log(`Plot starts: ${groundhogDay.plot.slice(0, 160)}...`);
  } else {
    console.log('Groundhog Day was not found.');
  }
};

await buildMovies();
