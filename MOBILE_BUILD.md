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

1. In Xcode: select the **App** target → **Signing & Capabilities** →
   pick your Apple Developer team. Xcode auto-creates the provisioning profile.
2. Set **Bundle Identifier** to `ng.gov.edosubeb.edolearn` (register it
   first at https://developer.apple.com/account/resources/identifiers).
3. **Product → Archive** (with "Any iOS Device" selected as the build target).
4. In the Organizer window that opens: **Distribute App → App Store Connect → Upload**.
5. App Store Connect → My Apps → New App → fill out metadata, screenshots
   (6.7", 6.5", 5.5" iPhone + 12.9" iPad), privacy details, age rating.
6. Add the uploaded build to a version → Submit for review (1–2 days).

---

## App assets you still need to create

Replace the default Capacitor placeholders before submitting:

- **App icon** — 1024×1024 PNG. Generate all sizes with
  https://icon.kitchen or `npx @capacitor/assets generate`.
- **Splash screen** — 2732×2732 PNG, centered logo on `#00843D`.
- **Screenshots** — capture from a real device or simulator at the
  required store sizes.
- **Privacy policy URL** — required by both stores. The page is live at `https://edodlah.com/privacy`.

The fastest way to generate icons + splash from one source image:

```bash
bun add -d @capacitor/assets
# put a 1024x1024 icon.png and 2732x2732 splash.png in ./assets
npx @capacitor/assets generate
```

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
