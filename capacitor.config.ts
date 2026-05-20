import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for EdoLearn.
 *
 * This app is a TanStack Start SSR app, so the native shell loads the
 * published web app at runtime via `server.url` instead of bundling a
 * static `webDir`. Change `server.url` to your production domain before
 * submitting to the stores.
 */
const config: CapacitorConfig = {
  appId: "ng.gov.edosubeb.edolearn",
  appName: "EdoLearn",
  webDir: "dist",
  server: {
    // Point to your live published site. For testing against the Lovable
    // preview sandbox, swap this for the preview URL.
    url: "https://edoafterschoolai.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#00843D",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#00843D",
    },
  },
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
