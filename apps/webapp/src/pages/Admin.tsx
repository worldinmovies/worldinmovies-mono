import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Server, Database, LucideLogs } from "lucide-react";
import { toast } from "sonner";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useStatus } from "@/hooks/useStatus";
import { getBackendUrl } from "@/lib/config";

const Admin = () => {
  const { status } = useStatus();
  const { connected, messages, clearMessages } = useWebSocket();
  const [logs, setLogs] = useState<string[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Add websocket messages to logs
  useEffect(() => {
    setLogs(prev => [...prev, ...messages].slice(-100)); // Keep last 100 logs
  }, [messages]);

  // Simulate adding logs if no websocket
  useEffect(() => {
    if (connected) return; // Don't simulate if websocket is connected

    const interval = setInterval(() => {
      const logMessages = [
        `[${new Date().toLocaleTimeString()}] System check completed successfully`,
        `[${new Date().toLocaleTimeString()}] Database connection established`,
        `[${new Date().toLocaleTimeString()}] Cache cleared and rebuilt`,
        `[${new Date().toLocaleTimeString()}] User session validated`,
        `[${new Date().toLocaleTimeString()}] Background task executed`,
        `[${new Date().toLocaleTimeString()}] API endpoint responding normally`,
      ];
      
      const randomLog = logMessages[Math.floor(Math.random() * logMessages.length)];
      setLogs(prev => [...prev.slice(-99), randomLog]); // Keep last 100 logs
    }, 2000);

    return () => clearInterval(interval);
  }, [connected]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [logs]);

  const clearLogs = () => {
    setLogs([]);
    clearMessages();
    toast.success("Logs cleared successfully");
  };

  const triggerBackend = (path: string) => {
    fetch(`${getBackendUrl()}${path}`)
      .catch(error => toast.error(`Could not trigger ${path}: error=${JSON.stringify(error)}`))
      .then((response: Response) => {
        const data: string = response.json() ? JSON.stringify(response.json()) : JSON.stringify(response.body);
        setLogs(prev => [...prev.slice(-99), data])
      })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              WebSocket: {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>TMDB Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => triggerBackend('/import/base')} variant="secondary" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Import TMDB Base</span>
              </Button>
              <Button onClick={() => triggerBackend('/import/tmdb/data')} variant="secondary" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Import TMDB Data</span>
              </Button>
              <Button onClick={() => triggerBackend('/import/tmdb/changes')} variant="secondary" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Import TMDB Changes</span>
              </Button>
              <Button onClick={() => triggerBackend('/redo/populatediscovery')} variant="secondary" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Populate Discovery Collection</span>
              </Button>
              <Button onClick={() => triggerBackend('/index/movies')} variant="secondary" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Reindex movie search</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>IMDB Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => triggerBackend('/import/imdb/ratings')} variant="secondary"  className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Import IMDB Ratings</span>
              </Button>
              <Button onClick={() => triggerBackend('/import/imdb/titles')} variant="secondary" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Import IMDB Titles</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LucideLogs className="h-4 w-4"/>
              <span>Import Status </span>
              <span className="text-sm text-muted-foreground">{status ? `Fetched ${status.fetched} out of ${status.total} movies which
                    is ${status.percentageDone.toFixed(2)}%` : "Loading status"}</span>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Terminal Logs */}
        <Card className="h-96">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Terminal className="h-5 w-5" />
              <span>System Logs</span>
              <span className="text-sm text-muted-foreground">({logs.length} entries)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea ref={scrollAreaRef} className="h-80 w-full p-4 bg-slate-950 text-green-400 font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">No logs available...</div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-green-400">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;