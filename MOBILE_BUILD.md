# Building EdoLearn for Google Play & Apple App Store

Capacitor is configured. The native shell loads the published web app
(`https://edoafterschoolai.lovable.app`) at runtime — so every Lovable
publish updates the mobile app instantly, without resubmitting binaries
for content changes.

You only resubmit when the **native shell** itself changes (icons,
splash, plugins, permissions, version code).

---

## Prerequisites

| Tool | For | Where |
|---|---|---|
| Node.js 20+ & bun | Both | https://bun.sh |
| Android Studio (latest) | Android | https://developer.android.com/studio |
| JDK 17 | Android | bundled with Android Studio |
| Xcode 15+ | iOS | Mac App Store (macOS only) |
| CocoaPods | iOS | `sudo gem install cocoapods` |
| Google Play Console account ($25 one-time) | Play Store | https://play.google.com/console |
| Apple Developer Program ($99/year) | App Store | https://developer.apple.com/programs |

> iOS builds **require a Mac**. There is no workaround.

---

## 1. Clone & install

Pull the project to your local machine via GitHub (Lovable → GitHub → Connect),
then:

```bash
bun install
```

## 2. Add native platforms (one-time)

```bash
npx cap add android
npx cap add ios     # macOS only
```

This creates `android/` and `ios/` folders. Commit them.

## 3. Sync after any change to capacitor.config.ts or plugins

```bash
npx cap sync
```

## 4. Open in native IDEs

```bash
npx cap open android   # Android Studio
npx cap open ios       # Xcode
```

---

## Android — building a signed AAB for Play Store

1. In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**.
2. Create a new keystore (save the `.jks` file and password — losing it
   means you can never update the app).
3. Choose `release` build variant → finish. The `.aab` lands in
   `android/app/release/`.
4. Play Console → Create app → upload the `.aab` under **Production → Create new release**.
5. Fill out: store listing, content rating, target audience, data safety,
   privacy policy URL, screenshots (phone + 7" + 10" tablet), feature graphic.
6. Submit for review (usually a few hours to 2 days).

**App ID:** `ng.gov.edosubeb.edolearn` (change in `capacitor.config.ts` if
you want a different bundle ID — must be done before first Play upload).

---

## iOS — building an IPA for App Store

### One-time setup in Apple Developer portal

1. **Register the App ID** at https://developer.apple.com/account/resources/identifiers
   → "+" → App IDs → App → Bundle ID = `ng.gov.edosubeb.edolearn` (explicit).
   Enable any capabilities the app needs (Push Notifications, Sign in with
   Apple, etc.). Today EdoLearn needs none of these.
2. **Create an App Store Connect record** at https://appstoreconnect.apple.com
   → My Apps → "+" → New App. Select the Bundle ID you just registered,
   SKU = `edolearn-ios-001`, primary language = English (Nigeria).

### Project settings already configured in `capacitor.config.ts`

These are read every time you run `npx cap sync ios`:

| Setting | Value | Maps to in Xcode / Info.plist |
|---|---|---|
| `appId` | `ng.gov.edosubeb.edolearn` | Bundle Identifier (PRODUCT_BUNDLE_IDENTIFIER) |
| `appName` | `EdoLearn` | Display Name (CFBundleDisplayName) |
| `version` | `1.0.0` | Marketing Version (CFBundleShortVersionString) |
| `ios.buildNumber` | `1` | Build (CFBundleVersion) — **must increase on every upload** |
| `ios.backgroundColor` | `#00843D` (Edo green) | Window background |
| `SplashScreen` plugin | green + 1.5s | LaunchScreen storyboard tint |
| `StatusBar` plugin | dark icons on green | Info.plist `UIStatusBarStyle` |

When you ship a new build, run the automated bump script instead of editing
the config by hand:

```bash
bun run ios:preflight              # verify bundle ID matches Xcode + Apple
bun run ios:preflight -- --apple-id ng.gov.edosubeb.edolearn --team ABCDE12345
```

The preflight (`scripts/ios-preflight.mjs`) compares `appId` in
`capacitor.config.ts` against `PRODUCT_BUNDLE_IDENTIFIER` in
`ios/App/App.xcodeproj/project.pbxproj`, `CFBundleIdentifier` in
`Info.plist`, and (optionally) the App ID you registered at
developer.apple.com (pass `--apple-id` or set `APPLE_APP_ID`). It also
reports the `DEVELOPMENT_TEAM`, `CODE_SIGN_STYLE`, and provisioning profile
configured in Xcode so you catch signing mismatches before archiving. A
mismatch is the #1 cause of "No matching provisioning profile" errors at
upload time. `bun run ios:release` runs the preflight automatically and
aborts if any check fails.



```bash
bun run ios:release                 # buildNumber += 1, then `cap sync ios`
bun run ios:release -- 42           # set buildNumber to "42"
bun run ios:release -- --version 1.1.0   # also bump marketing version
bun run ios:release -- --no-sync    # bump only, skip cap sync
```

The script (`scripts/ios-release.mjs`) rewrites `ios.buildNumber` in
`capacitor.config.ts` and runs `npx cap sync ios` so Xcode's Info.plist
picks up the new `CFBundleVersion` before you archive. App Store Connect
rejects re-uploads that reuse a build number, so run this every time.

### Building the IPA

1. `npx cap open ios` — opens `ios/App/App.xcworkspace` in Xcode.
2. Select the **App** target → **Signing & Capabilities** → tick
   *Automatically manage signing* → pick your Apple Developer team.
   Xcode creates the provisioning profile and signing cert.
3. Confirm **Bundle Identifier** = `ng.gov.edosubeb.edolearn` and
   **Deployment Target** = iOS 14.0 (Capacitor 8 minimum).
4. Top bar: change run destination to **Any iOS Device (arm64)**.
5. **Product → Archive**. When the build finishes, the Organizer opens.
6. In Organizer: **Distribute App → App Store Connect → Upload**.
   Xcode uploads the `.ipa` directly to App Store Connect.
7. App Store Connect → your app → TestFlight tab shows the build after
   ~10 min of processing. Add it to a version, fill in metadata
   (screenshots: 6.7", 6.5", 5.5" iPhone + 12.9" iPad; privacy details;
   age rating) → **Submit for Review** (typically 1–2 days).

---

## App assets you still need to create

Source images live in `assets/`:

- `assets/icon.png` — 1024×1024, no transparency, no rounded corners
  (iOS masks them automatically).
- `assets/splash.png` — 2732×2732, centered logo on `#00843D`.

Generate every platform-specific size with one command:

```bash
bun add -d @capacitor/assets
npx @capacitor/assets generate --iconBackgroundColor "#00843D" --splashBackgroundColor "#00843D"
```

This writes:
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/*` (all required iOS sizes)
- `ios/App/App/Assets.xcassets/Splash.imageset/*`
- Equivalent Android resources under `android/app/src/main/res/`

Other required URLs (already live):
- Privacy Policy — https://edodlah.com/privacy
- Terms of Service — https://edodlah.com/terms
- Cookie Policy — https://edodlah.com/cookies

App Store screenshots: capture in the iOS Simulator
(`xcrun simctl io booted screenshot shot.png`) on an iPhone 15 Pro Max
(6.7") and iPad Pro 12.9" — those two sizes satisfy Apple's minimum.

---

## Updating the app later

- **Content / UI changes**: just publish on Lovable — mobile users get
  it instantly (because the shell loads the live URL).
- **Native changes** (new plugin, icon, permission): bump `versionCode`
  / `CFBundleVersion`, rebuild, re-upload to the stores.

---

## Switching to fully offline (optional, advanced)

If you later want the app to ship its own bundled web build instead of
loading the hosted URL:

1. Remove the `server.url` block from `capacitor.config.ts`.
2. Convert the app to a static export (TanStack Start prerender) OR
   build a separate SPA bundle and point `webDir` at it.
3. `npx cap sync` → rebuild → resubmit.

This is more work but lets the app run with no internet.
