import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Terminal,
  Tv,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ImdbImport } from "@/pages/import/ImdbComponent";
import { LetterboxdImport } from "@/pages/import/LetterboxdComponent";


const Import = () => {
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const navigate = useNavigate()


  const addToLog = (log: string) => {
    setImportLogs(prev => [...prev, log]);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Import Your Movies
            </span>
          </h1>
          <p className="text-xl text-cinema-silver max-w-2xl mx-auto">
            Import your watched movies from various platforms to track your viewing history
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <ImdbImport isImporting={isImporting} setIsImporting={setIsImporting} addToLog={addToLog} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-cinema-gold" />
                Import from Trakt.tv
              </CardTitle>
              <CardDescription>
                Connect your Trakt.tv account to sync your watched movies automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => navigate('/trakt-import')}
                disabled={isImporting}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {isImporting ? "Connecting..." : "Connect to Trakt.tv"}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Authorize the app to access your Trakt.tv account and import your viewing history.
              </p>
            </CardContent>
          </Card>

          <LetterboxdImport isImporting={isImporting} setIsImporting={setIsImporting} addToLog={addToLog} />
        </div>

        {importLogs.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cinema-gold" />
                Import Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto border">
                {importLogs.map((log, index) => (
                  <div key={index} className="animate-in fade-in duration-300">
                    <span className="text-green-600">$</span> {log}
                  </div>
                ))}
                {isImporting && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-green-600">$</span>
                    <span className="animate-pulse">Processing...</span>
                    <span className="animate-bounce">_</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Import;
