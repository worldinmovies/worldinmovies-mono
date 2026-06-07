/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TMDB_URL: string
    readonly VITE_SENTRY_DSN?: string
    // add other env variables here
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  