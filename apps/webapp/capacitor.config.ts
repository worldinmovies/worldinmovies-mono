import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const config: CapacitorConfig = {
  appId: 'worldinmovies.labb.site',
  appName: 'World in Movies',
  webDir: 'dist',
  server: {
    cleartext: isDev,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    CapacitorHttp: {
      enabled: true,
    },
  }
};

export default config;
