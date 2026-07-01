import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBackendUrl } from "@/lib/config";
import { ImportedMovie } from "@/lib/models";
import { Download, Upload } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface ImdbBackendMovie {
    imdb_id: string;
    id: number;
    original_title: string;
    release_date: string;
    poster_path: string;
    vote_average: number;
    vote_count: number;
    country_code: string;
  }
  
const mapMyMovieToImportedMovie = (myMovie: ImdbBackendMovie): ImportedMovie => {
    return {
      id: myMovie.id,
      title: myMovie.original_title,
      year: new Date(myMovie.release_date).getFullYear(),
      seen: true,
      source: "imdb",
      country_code: myMovie.country_code
    };
  };

  interface ImdbImportProps {
    isImporting: boolean;
    setIsImporting: React.Dispatch<React.SetStateAction<boolean>>;
    addToLog: (log: string) => void;
  }
  
export const ImdbImport = ({isImporting, setIsImporting, addToLog}: ImdbImportProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imported, setImported] = useState<ImportedMovie[]>([]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          setSelectedFile(file);
        }
    };

    useEffect(() => {
      const imp = JSON.parse(localStorage.getItem('seenMovies') || '[]')
      setImported(prev => dedupe(prev, imp))
    }, []);

    const dedupe = (prev: ImportedMovie[], imp: ImportedMovie[]) => {
      const merged = [...prev, ...imp];

      // Deduplicate by id
      const deduped = Array.from(
        new Map(merged.map(movie => [movie.id, movie])).values()
      );
    
      return deduped;
    }
  
    
    const handleImdbImport = async () => {
      if (!selectedFile) {
        toast.error("Please select a file to read");
        return;
      }
  
      setIsImporting(true);
      
      addToLog("Parsing data from IMDB");
      const data = new FormData()
      data.append('file', selectedFile)
      if(getBackendUrl()) {
        fetch(`${getBackendUrl()}/imdb/ratings`,
            {
                method: 'POST',
                body: data
            })
            .then(resp => resp.json())
            .then(json => {
              const imp: ImportedMovie[] = Object.values(json.found)
                .flat()
                .map(mapMyMovieToImportedMovie);

              const failures = Object.values(json.not_found);
            
              const existingSeenMovies: ImportedMovie[] = JSON.parse(localStorage.getItem('seenMovies') || '[]');
              const updatedSeenMovies = [...new Set([...existingSeenMovies, ...imp])];
            
              const uniqueList: ImportedMovie[] = dedupe(imported, updatedSeenMovies);
              localStorage.setItem('seenMovies', JSON.stringify(uniqueList));
              setImported(uniqueList);
            
              addToLog(`Parsed ${imp.length} movies from IMDB`);
              if(failures.length != 0) {
                addToLog(`Movies that couldn't be mapped: ${failures.length}`);
                failures.forEach(fail => addToLog(JSON.stringify(failures)));
              }
            })
            .catch((error: Error) => {
                console.error(error)
                addToLog("IMDB process error: " + JSON.stringify(error));
            })
            .finally(() => {
                addToLog("IMDB process finished");
            });
      } 
      setIsImporting(false);
    };
    
    return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-cinema-gold" />
              Import from IMDb
            </CardTitle>
            <CardDescription>
              Upload your IMDb watchlist or ratings export to automatically mark movies as seen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imdb-file">Select IMDb Export File</Label>
              <Input
                id="imdb-file"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handleImdbImport}
              disabled={!selectedFile || isImporting}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importing..." : "Import from IMDb"}
            </Button>

            <p className="text-sm text-muted-foreground">
              Export your data from IMDb's account settings and upload the CSV file here.
            </p>
          </CardContent>
        </Card>
        {imported.length > 0 && 
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-cinema-gold" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="animate-in fade-in duration-300">
                  <span className="text-green-600">$</span> {`${imported.filter(i => i.source === "imdb").length} imported movies from IMDB`}
              </div>

            </CardContent>
          </Card>
        }
      </div>
    )
}
