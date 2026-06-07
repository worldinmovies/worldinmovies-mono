import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BACKEND_URL } from "@/lib/config";
import { ImportedMovie } from "@/lib/models";
import { Download, Upload } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface LetterboxdBackendMovie {
    imdb_id: string;
    id: number;
    original_title: string;
    release_date: string;
    poster_path: string;
    vote_average: number;
    vote_count: number;
    country_code: string;
  }

const mapMyMovieToImportedMovie = (myMovie: LetterboxdBackendMovie): ImportedMovie => {
    return {
      id: myMovie.id,
      title: myMovie.original_title,
      year: new Date(myMovie.release_date).getFullYear(),
      seen: true,
      source: "letterboxd",
      country_code: myMovie.country_code
    };
  };

  interface LetterboxdImportProps {
    isImporting: boolean;
    setIsImporting: React.Dispatch<React.SetStateAction<boolean>>;
    addToLog: (log: string) => void;
  }

export const LetterboxdImport = ({isImporting, setIsImporting, addToLog}: LetterboxdImportProps) => {
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


    const handleLetterboxdImport = async () => {
      if (!selectedFile) {
        toast.error("Please select a file to read");
        return;
      }
      setIsImporting(true);
      addToLog("Parsing data from Letterboxd");
      const data = new FormData()
      data.append('file', selectedFile)
      if(BACKEND_URL) {
        fetch(`${BACKEND_URL}/letterboxd/ratings`,
            {
                method: 'POST',
                body: data
            })
            .then(resp => resp.json())
            .then(json => {
              const imp: ImportedMovie[] = Object.values(json.found)
                .flat()
                .map(mapMyMovieToImportedMovie);
            
              setImported(dedupe(imp))

              const failures = Object.values(json.not_found);
            
              const existingSeenMovies: ImportedMovie[] = JSON.parse(localStorage.getItem('seenMovies') || '[]');
              const updatedSeenMovies = [...new Set([...existingSeenMovies, ...imp])];
              const uniqueList: ImportedMovie[] = dedupe(imported, updatedSeenMovies)

              localStorage.setItem('seenMovies', JSON.stringify(uniqueList));
              addToLog(`Parsed ${imp.length} movies from Letterboxd`);
              if(failures.length != 0) {
                addToLog(`Movies that couldn't be mapped: ${failures.length}`);
                failures.forEach(fail => addToLog(JSON.stringify(failures)));
              }
            })
            .catch((error: Error) => {
                addToLog("Letterboxd process error: " + JSON.stringify(error));
            })
            .finally(() => {
                addToLog("Letterboxd process finished");
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
              Import from Letterboxd
            </CardTitle>
            <CardDescription>
              Upload your Letterboxd watchlist or ratings export to automatically mark movies as seen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="letterboxd-file">Select Letterboxd Export File</Label>
              <Input
                id="letterboxd-file"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleLetterboxdImport}
              disabled={!selectedFile || isImporting}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? "Importing..." : "Import from Letterboxd"}
            </Button>

            <p className="text-sm text-muted-foreground">
              Export your data from <a href="https://letterboxd.com/settings/data/">Letterboxd's account settings</a> and upload the watched.csv file here.
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
                  <span className="text-green-600">$</span> {`${imported.filter(i => i.source === "letterboxd").length} imported movies from Letterboxd`}
              </div>

            </CardContent>
          </Card>
        }

      </div>
    )
}
