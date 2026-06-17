import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for EdoDLAH.
 *
 * The native shell loads the published web app via `server.url`, so most
 * content updates ship instantly without resubmitting binaries. The
 * settings below are what Xcode reads when generating the iOS project —
 * change `version` / `ios.buildNumber` before each App Store submission.
 */
const config: CapacitorConfig = {
  // Reverse-DNS bundle identifier. Must match the App ID registered at
  // https://developer.apple.com/account/resources/identifiers and the
  // Bundle Identifier shown in Xcode → Signing & Capabilities.
  appId: "ng.gov.edosubeb.edolearn",

  // Display name shown under the icon on the Home Screen.
  appName: "EdoDLAH",

  // Web bundle directory (used only if you switch off `server.url`).
  webDir: "dist",

  // Marketing version → CFBundleShortVersionString in Info.plist.
  // Bump for every public release (e.g. "1.0.1", "1.1.0").
  version: "1.4.0",

  server: {
    url: "https://edodlah.com",
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
    // Allowed external origins the WebView may navigate to.
    allowNavigation: [
      "edoafterschoolai.lovable.app",
      "edodlah.com",
      "*.edodlah.com",
      "*.supabase.co",
    ],
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#00843D",
      androidSplashResourceName: "splash",
      showSpinner: false,
      iosSpinnerStyle: "small",
      splashFullScreen: true,
      splashImmersive: true,
      autoHide: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#00843D",
      overlaysWebView: false,
    },
  },

  ios: {
    // CFBundleVersion — App Store Connect requires this to increase
    // on every upload, even for the same marketing `version`.
    buildNumber: "1",
    contentInset: "always",
    // Background color shown behind the WebView during transitions.
    backgroundColor: "#00843D",
    // Use the WKWebView's built-in scrolling.
    scrollEnabled: true,
    // Set to "production" once you have a release signing cert configured
    // in Xcode → Signing & Capabilities. "automatic" lets Xcode pick.
    scheme: "App",
    // Minimum iOS supported. iOS 14+ matches Capacitor 8's floor and
    // covers ~99% of active devices.
    // (Apply by editing ios/App/App.xcodeproj after `cap add ios`.)
    // We document this here for the maintainer.
    // limitsNavigationsToAppBoundDomains: false,
  },

  android: {
    allowMixedContent: false,
  },
};

export default config;
