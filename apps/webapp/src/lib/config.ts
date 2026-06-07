import { Capacitor } from "@capacitor/core";
const platform = Capacitor.getPlatform();
const isNative = platform === "ios" || platform === "android";

const env = import.meta.env.MODE; // "development" or "production"
const envVariable = import.meta.env.VITE_TMDB_URL;

let backendUrl: string;

if (envVariable && !isNative) {
  backendUrl = envVariable;
} 
else if (env === "development") {
  backendUrl = isNative
    ? "http://192.168.1.37:8020"
    : "/tmdb";
} else {
  backendUrl = isNative
    ? "https://worldinmovies.labb.site/tmdb"
    : "/tmdb";
}

export const BACKEND_URL = backendUrl;