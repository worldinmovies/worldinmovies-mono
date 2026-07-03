import { Movie } from "@/lib/models";

export interface WatchlistItem {
  movie: Movie;
  tag: string;
}

export interface CountryOption {
  country: string;
  countryCode: string;
  flag: string;
}

export const filterByWatchlist = (
  movies: Movie[],
  watchlistFilter: string,
  watchlist: WatchlistItem[],
): Movie[] => {
  if (watchlistFilter === "all") return movies;

  const watchlistMovieIds =
    watchlistFilter === "any"
      ? watchlist.map((item) => item.movie.id)
      : watchlist
          .filter((item) => item.tag === watchlistFilter)
          .map((item) => item.movie.id);

  return movies.filter((movie) => watchlistMovieIds.includes(movie.id));
};

export const filterBySeenStatus = (
  movies: Movie[],
  seenFilter: "all" | "seen" | "unseen",
  seenMovies: Movie[],
): Movie[] => {
  if (seenFilter === "seen") {
    return movies.filter((movie) => seenMovies.find((a) => a.id === movie.id));
  }
  if (seenFilter === "unseen") {
    return movies.filter(
      (movie) => !seenMovies.find((a) => a.id === movie.id),
    );
  }
  return movies;
};

export const buildCountryOptions = (countryData: Record<string, string>): CountryOption[] => {
  return Object.entries(countryData).map(([code, name]) => ({
    country: name,
    countryCode: code,
    flag: `https://flagcdn.com/16x12/${code.toLowerCase()}.png`,
  }));
};

export const buildGenreOptions = (genresData: Iterable<string>): string[] => {
  return ["all", ...Array.from(genresData).sort()];
};

export const buildWatchlistTagOptions = (
  watchlist: WatchlistItem[],
): string[] => {
  const tags = new Set(watchlist.map((item) => item.tag));
  return ["all", "any", ...Array.from(tags).sort()];
};
