export interface Movie {
  id: number;
  title: string;
  year: number;
  countryName?: string;
  country: string;
  countryCode?: string;
  countryFlag: string;
  director: string;
  rating: number;
  genres: string[];
  poster: string;
  description: string;
}

export interface ImportedMovie {
  id: number;
  title: string;
  year: number;
  seen: boolean;
  source: "trakt" | "imdb" | "letterboxd";
  country_code?: string
}

export interface DiscoverMovie {
  _id: number;
  original_title: string;
  year: number;
  estimated_country: string;
  director: string;
  imdb_vote_average: number;
  vote_average: number;
  rating: number;
  genres: string[];
  poster_path: string;
  overview: string;
}

export interface Genre {
  _id: number;
  name: string;
}

export interface BackendMovie {
  _id: number;
  original_title: string;
  year: number;
  estimated_country: string;
  director: string;
  imdb_vote_average: number;
  vote_average: number;
  rating: number;
  genres: Genre[];
  poster_path: string;
  overview: string;
}
