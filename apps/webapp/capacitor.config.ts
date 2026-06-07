import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'worldinmovies.labb.site',
  appName: 'World in Movies',
  webDir: 'dist',
  server: {
    //url: 'http://192.168.1.37:8081',
    cleartext: true
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
