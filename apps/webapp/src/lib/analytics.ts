export interface ImportedMovie {
  id: number;
  title: string;
  year: number;
  seen: boolean;
  source: "trakt" | "imdb";
  country_code: string;
}

export interface AnalyticsData {
  totalMovies: number;
  countryCounts: { country: string; count: number }[];
  decadeCounts: { decade: string; count: number }[];
}

export const calculateAnalytics = (
  seenMovies: ImportedMovie[],
): AnalyticsData => {
  // Calculate country counts
  const countryMap = new Map<string, number>();
  seenMovies.forEach((movie) => {
    const count = countryMap.get(movie.country_code) || 0;
    countryMap.set(movie.country_code, count + 1);
  });
  const countryCounts = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  // Calculate decade counts
  const decadeMap = new Map<string, number>();
  seenMovies.forEach((movie) => {
    const decade = Math.floor(movie.year / 10) * 10;
    const decadeLabel = `${decade}s`;
    const count = decadeMap.get(decadeLabel) || 0;
    decadeMap.set(decadeLabel, count + 1);
  });
  const decadeCounts = Array.from(decadeMap.entries())
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));

  return {
    totalMovies: seenMovies.length,
    countryCounts,
    decadeCounts,
  };
};
