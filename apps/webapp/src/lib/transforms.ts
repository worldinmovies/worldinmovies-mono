import { Movie, DiscoverMovie } from "@/lib/models";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

// Intl.DisplayNames.of() throws RangeError for malformed region codes
// (e.g. empty/whitespace). Never let a single bad code nuke a whole batch
// of mapped movies — fall back to the raw code instead.
const countryName = (code?: string): string => {
  const trimmed = code?.trim();
  if (!trimmed) return "Unknown";
  try {
    return regionNames.of(trimmed) || trimmed;
  } catch {
    return trimmed;
  }
};

export const shuffleArray = (array: Movie[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const transferDiscoverMovie = (m: DiscoverMovie): Movie => {
  return {
    id: m._id,
    title: m.original_title,
    year: m.year,
    country: countryName(m.estimated_country),
    countryCode: m.estimated_country || "",
    countryFlag: m.estimated_country
      ? `https://flagcdn.com/16x12/${m.estimated_country.toLowerCase()}.png`
      : "",
    director: m.director,
    rating: m.imdb_vote_average > 0 ? m.imdb_vote_average : m.vote_average,
    genres: m.genres?.map((genre) => genre),
    poster: m.poster_path
      ? `https://image.tmdb.org/t/p/w300${m.poster_path}`
      : "",
    description: m.overview,
  };
};

export const transferBackendMovie = (m: import("@/lib/models").BackendMovie): Movie => {
  return {
    id: m._id,
    title: m.original_title,
    year: m.year,
    country: countryName(m.estimated_country),
    countryCode: m.estimated_country || "",
    countryFlag: m.estimated_country
      ? `https://flagcdn.com/16x12/${m.estimated_country.toLowerCase()}.png`
      : "",
    director: m.director,
    rating: m.imdb_vote_average > 0 ? m.imdb_vote_average : m.vote_average,
    genres: m.genres?.map((genre) => genre.name) || [],
    poster: m.poster_path
      ? `https://image.tmdb.org/t/p/w300${m.poster_path}`
      : "",
    description: m.overview,
    cast: m.credits?.cast?.map((c) => c.name) || [],
    production_companies: m.production_companies?.map((pc) => pc.name) || []
  };
};
