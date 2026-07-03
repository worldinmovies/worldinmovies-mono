import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Tv, CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";
import { ImportedMovie } from "@/lib/models";
import { Capacitor } from "@capacitor/core";
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { useNavigate } from "react-router-dom";
import { getBackendUrl } from "@/lib/config";

// Client ID is safe to be public - it just identifies your app
const TRAKT_CLIENT_ID = '284dd0bd619c3cbd73ce225fd4ee12cb1332cc515d4b8da81aaf992093bd2a26';
const isMobileApp = Capacitor.isNativePlatform();
const TRAKT_REDIRECT_URI = isMobileApp
  ? "worldinmovie://trakt-callback"
  : `${window.location.origin}/trakt-callback.html`;

// ---- Helpers ----

const backendUrl = () => `${getBackendUrl()}/trakt`;

async function backendGet(path: string) {
  const res = await fetch(`${backendUrl()}${path}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

async function backendPost(path: string, data: unknown) {
  const res = await fetch(`${backendUrl()}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

async function backendDelete(path: string) {
  const res = await fetch(`${backendUrl()}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ---- Types ----

interface TraktMovieItem {
  movie: {
    title: string;
    year: number;
    ids: { trakt: number; slug: string; imdb: string; tmdb: number };
  };
  watched_at?: string;
  rated_at?: string;
}

// ---- Component ----

export const TraktImport = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const addToLog = useCallback((log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setImportLogs(prev => [...prev, `[${timestamp}] ${log}`]);
  }, []);

  const navigate = useNavigate();

  // ---- Check session on mount ----
  useEffect(() => {
    backendGet('/session')
      .then(data => setIsConnected(data.connected))
      .catch(() => setIsConnected(false));
  }, []);

  // ---- Start OAuth (web: popup, mobile: in-app browser) ----
  const handleTraktOAuth = async () => {
    if (!TRAKT_CLIENT_ID) {
      toast.error("Please configure TRAKT_CLIENT_ID in the component");
      return;
    }
    setIsConnecting(true);
    try {
      const { generateCodeVerifier, generateCodeChallenge } = await import("@/lib/pkce");
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store code verifier for callback
      if (isMobileApp) {
        await Preferences.set({ key: 'trakt_code_verifier', value: codeVerifier });
      } else {
        sessionStorage.setItem('trakt_code_verifier', codeVerifier);
      }

      const authUrl = new URL("https://trakt.tv/oauth/authorize");
      authUrl.searchParams.set("client_id", TRAKT_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", TRAKT_REDIRECT_URI);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");

      if (isMobileApp) {
        await Browser.open({ url: authUrl.toString() });
      } else {
        // Open popup — if blocked, show error
        const popup = window.open(authUrl.toString(), 'trakt-oauth', 'width=600,height=700');
        if (!popup || popup.closed) {
          toast.error("Popup was blocked. Please allow popups for this site and try again.");
          setIsConnecting(false);
          return;
        }
        // Monitor popup close — if user closes without authorizing, reset
        const timer = setInterval(() => {
          if (popup.closed) {
            clearInterval(timer);
            setIsConnecting(false);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      toast.error("Failed to start OAuth flow");
      setIsConnecting(false);
      Sentry.captureException(error);
    }
  };

  // ---- Fetch and merge movies via Django proxy ----
  const fetchAndImport = useCallback(async () => {
    addToLog("Fetching watched and rated movies from Trakt...");
    const data = await backendGet('/import');
    const watchedMovies: TraktMovieItem[] = data.watched || [];
    const ratedMovies: TraktMovieItem[] = data.rated || [];
    addToLog(`Found ${watchedMovies.length} watched movies`);

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

    setTimeout(() => navigate('/'), 2000);
  }, [addToLog, navigate]);

  // ---- Handle OAuth callback ----
  const handleOAuthCallback = useCallback(async (code: string) => {
    setIsImporting(true);
    setImportLogs([]);
    addToLog("Received authorization code");

    try {
      // Get stored code verifier
      let codeVerifier: string | null;
      if (isMobileApp) {
        const { value } = await Preferences.get({ key: 'trakt_code_verifier' });
        codeVerifier = value;
      } else {
        codeVerifier = sessionStorage.getItem('trakt_code_verifier');
      }

      if (!codeVerifier) {
        throw new Error("Code verifier not found. Please try connecting again.");
      }
      addToLog("Exchanging authorization code for access token...");

      // Send code + verifier to Django backend (sets httpOnly cookie)
      await backendPost('/callback', {
        code,
        code_verifier: codeVerifier,
        redirect_uri: TRAKT_REDIRECT_URI,
      });
      addToLog("Successfully authenticated with Trakt");
      setIsConnected(true);

      // Clean up code verifier
      if (isMobileApp) {
        await Preferences.remove({ key: 'trakt_code_verifier' });
      } else {
        sessionStorage.removeItem('trakt_code_verifier');
      }

      // Fetch and import movies
      await fetchAndImport();
    } catch (error) {
      console.error('Error during Trakt import:', error);
      Sentry.captureException(error);
      addToLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error(`Failed to import from Trakt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      setIsConnecting(false);
    }
  }, [addToLog, fetchAndImport]);

  // ---- Listen for postMessage from OAuth popup (web only) ----
  useEffect(() => {
    if (isMobileApp) return;

    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'trakt-oauth') return;

      if (event.data.error) {
        toast.error(`Authorization denied: ${event.data.error}`);
        setIsConnecting(false);
      } else if (event.data.code) {
        handleOAuthCallback(event.data.code);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleOAuthCallback]);

  // ---- Listen for Capacitor deep link (mobile only) ----
  useEffect(() => {
    if (!isMobileApp) return;

    let listener: { remove: () => void } | null = null;
    (async () => {
      listener = await App.addListener('appUrlOpen', (data) => {
        if (data.url.startsWith('worldinmovie://trakt-callback')) {
          const url = new URL(data.url);
          const code = url.searchParams.get('code');
          if (code) {
            handleOAuthCallback(code);
            Browser.close();
          }
        }
      });
    })();
    return () => {
      if (listener) listener.remove();
    };
  }, [handleOAuthCallback]);

  // ---- Disconnect ----
  const handleDisconnect = async () => {
    try {
      await backendDelete('/logout');
      setIsConnected(false);
      toast.success("Disconnected from Trakt.tv");
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast.error("Failed to disconnect");
    }
  };

  // ---- Render ----
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
                {!isImporting && (
                  <Button
                    onClick={fetchAndImport}
                    className="w-full"
                    variant="secondary"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Import Movies
                  </Button>
                )}
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

        {importLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-cinema-gold" />
                Import Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded max-h-64 overflow-y-auto font-mono text-xs space-y-1">
                {importLogs.map((log, i) => (
                  <div key={i} className="text-muted-foreground">{log}</div>
                ))}
                {isImporting && (
                  <div className="text-cinema-gold animate-pulse">Processing...</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate('/import')}>
            ← Back to Import Options
          </Button>
        </div>
      </div>
    </div>
  );
};
