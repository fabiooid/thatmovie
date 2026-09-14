import type { Movie } from './movie.ts';

export const movieToText = (movie: Movie): string => {
  const year = movie.year ?? 'Unknown';
  const genres = movie.genres.length > 0 ? movie.genres.join(', ') : 'Unknown';

  return `Title: ${movie.title}
Year: ${year}
Genres: ${genres}

Plot:
${movie.plot}`;
};
