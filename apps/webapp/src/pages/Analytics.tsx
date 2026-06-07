import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Film, Globe, Calendar, TrendingUp } from "lucide-react";
import { Movie } from "@/lib/models";

interface ImportedMovie {
  id: number;
  title: string;
  year: number;
  seen: boolean;
  source: "trakt" | "imdb";
  country_code: string
}

interface AnalyticsData {
  totalMovies: number;
  countryCounts: { country: string; count: number }[];
  decadeCounts: { decade: string; count: number }[];
  //genreCounts: { genre: string; count: number }[];
  //averageRating: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--cinema-gold))', 'hsl(var(--cinema-silver))'];

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateAnalytics = () => {
      const saved = localStorage.getItem('seenMovies');
      if (!saved) {
        setLoading(false);
        return;
      }

      const seenMovies: ImportedMovie[] = JSON.parse(saved);
      
      if (seenMovies.length === 0) {
        setLoading(false);
        return;
      }
      // Calculate country counts
      const countryMap = new Map<string, number>();
      seenMovies.forEach(movie => {
        const count = countryMap.get(movie.country_code) || 0;
        countryMap.set(movie.country_code, count + 1);
      });
      const countryCounts = Array.from(countryMap.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate decade counts
      const decadeMap = new Map<string, number>();
      seenMovies.forEach(movie => {
        const decade = Math.floor(movie.year / 10) * 10;
        const decadeLabel = `${decade}s`;
        const count = decadeMap.get(decadeLabel) || 0;
        decadeMap.set(decadeLabel, count + 1);
      });
      const decadeCounts = Array.from(decadeMap.entries())
        .map(([decade, count]) => ({ decade, count }))
        .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));

      // Calculate genre counts
      const genreMap = new Map<string, number>();
      /*
      seenMovies.forEach(movie => {
        const genres = movie.genres
        genres?.forEach(genre => {
          if (genre) {
            const count = genreMap.get(genre) || 0;
            genreMap.set(genre, count + 1);
          }
        });
      });

      const genreCounts = Array.from(genreMap.entries())
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      */
     /*
      // Calculate average rating
      const totalRating = seenMovies.reduce((sum, movie) => sum + movie.rating, 0);
      const averageRating = totalRating / seenMovies.length;
      */
      setAnalytics({
        totalMovies: seenMovies.length,
        countryCounts,
        decadeCounts
        //genreCounts,
        //averageRating,
      });
      
      setLoading(false);
    };

    calculateAnalytics();

    // Listen to custom event for real-time updates
    const handleSeenChanged = () => {
      calculateAnalytics();
    };

    window.addEventListener('seenMoviesChanged', handleSeenChanged as EventListener);

    return () => {
      window.removeEventListener('seenMoviesChanged', handleSeenChanged as EventListener);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your cinema journey...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Film className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Films Tracked Yet</h2>
          <p className="text-muted-foreground">Mark some movies as "seen" to start tracking your cinema journey!</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-accent bg-clip-text text-transparent">
            Your Cinema Journey
          </h1>
          <p className="text-xl text-muted-foreground">
            Explore the patterns and stories behind your film collection
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Films</CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalMovies}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Countries</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.countryCounts.length}</div>
            </CardContent>
          </Card>
          
          {/*
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
            </CardContent>
          </Card>
          */}
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Decades</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.decadeCounts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Country Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Films by Country</CardTitle>
              <CardDescription>Your top countries by film count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.countryCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="country" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Genre Distribution */}
          {/*
          <Card>
            <CardHeader>
              <CardTitle>Genre Distribution</CardTitle>
              <CardDescription>Your favorite film genres</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.genreCounts}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="count"
                  >
                    {analytics.genreCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          /*}

          {/* Decade Timeline */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Timeline of Cinema</CardTitle>
              <CardDescription>Films across decades</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.decadeCounts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="decade" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--accent))" name="Films" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
