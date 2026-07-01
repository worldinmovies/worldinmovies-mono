import { useState, useEffect, useCallback } from "react"; // <-- CHANGED
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Tv, Terminal, CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";
import { ImportedMovie } from "@/lib/models";
import { Capacitor, PluginListenerHandle, CapacitorHttp, HttpResponse } from "@capacitor/core";
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser'; // <-- ADDED
import { Preferences } from '@capacitor/preferences'; // <-- ADDED
import { useNavigate } from "react-router-dom";

// Client ID is safe to be public - it just identifies your app
const TRAKT_CLIENT_ID = '284dd0bd619c3cbd73ce225fd4ee12cb1332cc515d4b8da81aaf992093bd2a26';
const isMobileApp = Capacitor.isNativePlatform();
const TRAKT_REDIRECT_URI = isMobileApp
  ? "worldinmovie://trakt-callback"
  : `${window.location.origin}/trakt-callback`;


interface TraktMovie {
  movie: {
    title: string;
    year: number;
    ids: {
      trakt: number;
      slug: string;
      imdb: string;
      tmdb: number;
    };
  };
  watched_at?: string;
  rated_at?: string;
}

import { generateCodeVerifier, generateCodeChallenge } from "@/lib/pkce";

const traktApiRequest = async (
  url: string,
  method: 'GET' | 'POST',
  accessToken: string | null,
  data?: any
) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "application/json",
    "trakt-api-version": "2",
    "trakt-api-key": TRAKT_CLIENT_ID,
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  if (isMobileApp) {
    // Use Capacitor HTTP for native
    const options = {
      url,
      method,
      headers,
      data,
    };
    const response: HttpResponse = await CapacitorHttp.request(options); // <-- Use CapacitorHttp
    return response.data; // Capacitor HTTP returns parsed JSON
  } else {
    // Use standard fetch for web
    const options: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    };
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_description || "API request failed");
    }
    return response.json();
  }
};

export const TraktImport = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

// --- START: `useCallback` FIX ---
  // Wrap state-updating functions in `useCallback` to make them stable
  // This prevents stale closures in the `useEffect` listener
  const addToLog = useCallback((log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setImportLogs(prev => [...prev, `[${timestamp}] ${log}`]);
  }, []); // <-- Empty dependency array is fine here

  const navigate = useNavigate()

  const handleTraktOAuth = async () => {
    if (!TRAKT_CLIENT_ID) {
      toast.error("Please configure TRAKT_CLIENT_ID in the component");
      return;
    }

    setIsConnecting(true);
    
    try {
      // Generate PKCE values
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Store code verifier for later use
      if (isMobileApp) {
        await Preferences.set({ key: 'trakt_code_verifier', value: codeVerifier }); // <-- CHANGED
      } else {
        sessionStorage.setItem('trakt_code_verifier', codeVerifier); // <-- CHANGED
      }
      
      // Trakt OAuth flow with PKCE
      const authUrl = new URL("https://trakt.tv/oauth/authorize");
      authUrl.searchParams.set("client_id", TRAKT_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", TRAKT_REDIRECT_URI);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");
      
      const url = authUrl.toString();

      // Open the URL using the correct method
      if (isMobileApp) {
        await Browser.open({ url }); // <-- CHANGED
      } else {
        window.location.href = url; // <-- CHANGED
      }
    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      toast.error("Failed to start OAuth flow");
      setIsConnecting(false);
      Sentry.captureException(error);
    }
  };


  const fetchWatchedMovies = useCallback(async (accessToken: string) => {
    try {
      addToLog("Fetching watched movies from Trakt...");

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "trakt-api-version": "2",
        "trakt-api-key": TRAKT_CLIENT_ID,
      };

      // Fetch watched movies
      const watchedResponse = await fetch("https://api.trakt.tv/sync/watched/movies", {
        headers,
      });

      if (!watchedResponse.ok) {
        throw new Error("Failed to fetch watched movies");
      }

      const watchedMovies: TraktMovie[] = await watchedResponse.json();
      addToLog(`Found ${watchedMovies.length} watched movies`);

      // Fetch rated movies
      addToLog("Fetching rated movies from Trakt...");
      const ratingsResponse = await fetch("https://api.trakt.tv/sync/ratings/movies", {
        headers,
      });

      let ratedMovies: TraktMovie[] = [];
      if (ratingsResponse.ok) {
        ratedMovies = await ratingsResponse.json();
        addToLog(`Found ${ratedMovies.length} rated movies`);
      }

      // Combine and deduplicate
      const allMovieIds = new Set<number>();
      const importedMovies: ImportedMovie[] = [];

      [...watchedMovies, ...ratedMovies].forEach((item) => {
        const movieId = item.movie.ids.tmdb;
        if (movieId && !allMovieIds.has(movieId)) {
          allMovieIds.add(movieId);
          importedMovies.push({
            id: movieId,
            title: item.movie.title,
            year: item.movie.year,
            seen: true,
            source: "trakt",
            country_code: "",
          });
        }
      });

      addToLog(`Processing ${importedMovies.length} unique movies...`);

      // Merge with existing seen movies
      const existingSeenMovies: ImportedMovie[] = JSON.parse(
        localStorage.getItem('seenMovies') || '[]'
      );
      
      const allMovies = [...existingSeenMovies, ...importedMovies];
      const uniqueList: ImportedMovie[] = Array.from(
        new Map(allMovies.map(movie => [movie.id, movie])).values()
      );

      localStorage.setItem('seenMovies', JSON.stringify(uniqueList));

      addToLog(`Successfully imported ${importedMovies.length} movies from Trakt`);
      addToLog("Import completed!");
      
      toast.success(`Successfully imported ${importedMovies.length} movies from Trakt.tv!`);

      // Reload page after 2 seconds to show updated data
      setTimeout(() => {
        navigate('/');
        //window.location.href = '/';
      }, 2000);

    } catch (error) {
        Sentry.captureException(error);
        console.error("Error fetching movie details:", error);
    }
  }, [addToLog, navigate]);

  const handleOAuthCallback = useCallback(async (code: string) => {
    setIsImporting(true);
    setImportLogs([]);
    addToLog("Received authorization code");

    try {
      // Get stored code verifier
      let codeVerifier: string | null;
      if (isMobileApp) {
        const { value } = await Preferences.get({ key: 'trakt_code_verifier' }); // <-- CHANGED
        codeVerifier = value;
      } else {
        codeVerifier = sessionStorage.getItem('trakt_code_verifier'); // <-- CHANGED
      }

      if (!codeVerifier) {
        throw new Error("Code verifier not found. Please try connecting again.");
      }
      toast.success(`Got codeVerifier`);


      // Exchange code for access token using PKCE
      addToLog("Exchanging authorization code for access token...");

      const tokenData = await traktApiRequest(
        "https://api.trakt.tv/oauth/token",
        "POST",
        null, // No access token yet
        {
          code: code,
          client_id: TRAKT_CLIENT_ID,
          redirect_uri: TRAKT_REDIRECT_URI,
          grant_type: "authorization_code",
          code_verifier: codeVerifier,
        }
      );

      const accessToken = tokenData.access_token;

      addToLog("Successfully authenticated with Trakt");

      // Store access token for future use
      localStorage.setItem('trakt_access_token', accessToken);
      localStorage.setItem('trakt_refresh_token', tokenData.refresh_token);

      // Clean up code verifier
      if (isMobileApp) {
        await Preferences.remove({ key: 'trakt_code_verifier' }); // <-- CHANGED
      } else {
        sessionStorage.removeItem('trakt_code_verifier'); // <-- CHANGED
      }
      // Fetch watched movies
      await fetchWatchedMovies(accessToken);

    } catch (error) {
      console.error('Error during Trakt import:', error);
      Sentry.captureException(error);
      addToLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error(`Failed to import from Trakt. Please try again.: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      setIsConnecting(false);

      // Clean up URL
      if (!isMobileApp) { // <-- ADDED check
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [addToLog, fetchWatchedMovies, traktApiRequest]);


  const handleDisconnect = () => {
    localStorage.removeItem('trakt_access_token');
    localStorage.removeItem('trakt_refresh_token');
    toast.success("Disconnected from Trakt.tv");
  };

  // --- START: `useEffect` FIX ---
  // This `useEffect` now correctly handles both platforms
  // and has the correct dependency to avoid stale closures
  useEffect(() => {
    if (isMobileApp) {
      // Native platform: Listen for app URL opens

      // We need a variable to hold the listener handle once the promise resolves
      let listenerHandle: PluginListenerHandle | null = null;

      const addListener = async () => {
        listenerHandle = await App.addListener('appUrlOpen', (data) => {
          if (data.url.startsWith('worldinmovie://trakt-callback')) {
            const url = new URL(data.url);
            const code = url.searchParams.get('code');
            if (code) {
              handleOAuthCallback(code);
              // Optionally close the browser tab if it's still open
              Browser.close();
            }
          }
        });
      };

      // Call the async function to add the listener
      addListener();

      // Return a cleanup function
      return () => {
        // Check if the listener handle exists (i.e., the promise resolved)
        // and then call remove()
        if (listenerHandle) {
          listenerHandle.remove();
        }
      };

    } else {
      // Web platform: Check URL params on load
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code) {
        handleOAuthCallback(code);
      }
    }
  }, [handleOAuthCallback]); // <-- This dependency is correct
  // --- END: `useEffect` FIX ---

  const isConnected = !!localStorage.getItem('trakt_access_token');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Import from Trakt.tv</h1>
          <p className="text-muted-foreground">
            Connect your Trakt.tv account to import your watched and rated movies
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv className="w-5 h-5 text-cinema-gold" />
              Trakt.tv Connection
            </CardTitle>
            <CardDescription>
              Securely connect your Trakt.tv account to import your complete watch history and ratings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <>
                <Button 
                  onClick={handleTraktOAuth}
                  disabled={isConnecting || isImporting}
                  className="w-full"
                  size="lg"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {isConnecting ? "Connecting..." : "Connect to Trakt.tv"}
                </Button>
                
                <div className="text-xs text-muted-foreground bg-muted p-3 rounded space-y-2">
                  <p className="font-medium">Secure Connection:</p>
                  <p>This uses OAuth 2.0 with PKCE (Proof Key for Code Exchange), which means:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>No secrets are stored in the browser</li>
                    <li>Your Trakt password is never shared</li>
                    <li>You can revoke access anytime from Trakt settings</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Connected to Trakt.tv</span>
                </div>
                <Button 
                  onClick={handleDisconnect}
                  variant="outline"
                  className="w-full"
                >
                  Disconnect
                </Button>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">This integration will import:</p>
              <ul className="list-disc list-inside ml-2">
                <li>All movies marked as watched</li>
                <li>All movies you've rated</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate('/import')}>
            ← Back to Import Options
          </Button>
        </div>
      </div>
    </div>
  );
}