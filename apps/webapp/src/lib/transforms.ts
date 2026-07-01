import { Movie, DiscoverMovie } from "@/lib/models";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

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
    country: m.estimated_country
      ? regionNames.of(m.estimated_country)
      : "Unknown",
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
    country: m.estimated_country
      ? regionNames.of(m.estimated_country)
      : "Unknown",
    countryCode: m.estimated_country || "",
    countryFlag: m.estimated_country
      ? `https://flagcdn.com/16x12/${m.estimated_country.toLowerCase()}.png`
      : "",
    director: m.director,
    rating: m.imdb_vote_average > 0 ? m.imdb_vote_average : m.vote_average,
    genres: m.genres?.map((genre) => genre.name),
    poster: m.poster_path
      ? `https://image.tmdb.org/t/p/w300${m.poster_path}`
      : "",
    description: m.overview,
  };
};
