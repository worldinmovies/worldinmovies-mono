import { Capacitor } from "@capacitor/core";

let cachedUrl: string | undefined;

export const getBackendUrl = (): string => {
  if (cachedUrl !== undefined) return cachedUrl;

  const platform = Capacitor.getPlatform();
  const isNative = platform === "ios" || platform === "android";
  const env = import.meta.env.MODE;
  const envVariable = import.meta.env.VITE_TMDB_URL;

  if (envVariable && !isNative) {
    cachedUrl = envVariable;
  } else if (env === "development") {
    cachedUrl = isNative ? "http://192.168.1.37:8020" : "/tmdb";
  } else {
    cachedUrl = isNative ? "https://worldinmovies.labb.site/tmdb" : "/tmdb";
  }

  return cachedUrl;
};