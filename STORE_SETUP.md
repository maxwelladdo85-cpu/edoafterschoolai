# Store Setup & CI/CD Guide

This guide walks through configuring Google Play Console and Apple App Store Connect,
then setting up GitHub Actions to build and upload both apps automatically.

---

## 1. Android — Google Play Console

### 1.1 Create a Google Play Console account

- Go to https://play.google.com/console
- Pay the one-time $25 registration fee
- Create your app: **All apps → Create app**
  - Name: **EdoLearn**
  - Default language: English (Nigeria)
  - App or game: App
  - Free or paid: Free
  - Add **Privacy Policy**: https://edodlah.com/privacy

### 1.2 Generate an upload keystore

On any machine with Java installed:

```bash
keytool -genkey -v -keystore edolearn-upload.jks -alias edolearn \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass CHANGEME -keypass CHANGEME
```

**IMPORTANT**: Save this `.jks` file and both passwords permanently. Losing them
means you can never publish a new version of this app.

### 1.3 Create a Google Cloud service account

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project (e.g. "EdoLearn Play Console")
3. **Create Credentials → Service Account**
4. Name: `edolearn-play-uploader`
5. After creation, click the service account → **Keys → Add Key → Create New Key → JSON**
6. Download the JSON file — this is your `PLAY_SERVICE_ACCOUNT_JSON`

### 1.4 Grant the service account access in Play Console

1. Play Console → **Users & permissions → Invite new user**
2. Email: the service account email from step 1.3
3. Permissions needed:
   - ✅ **Admin** (ALL permissions)

### 1.5 Set GitHub secrets

| Secret key | Value |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 edolearn-upload.jks` (one-liner) |
| `ANDROID_KEYSTORE_PASSWORD` | `storepass` from keytool |
| `ANDROID_KEY_ALIAS` | `edolearn` |
| `ANDROID_KEY_PASSWORD` | `keypass` from keytool |
| `PLAY_SERVICE_ACCOUNT_JSON` | Full content of the JSON key file |

On macOS/Linux to base64-encode the keystore:

```bash
base64 -i edolearn-upload.jks | pbcopy  # copies to clipboard
```

### 1.6 Fill in store listing (one-time)

In Play Console → **Store presence → Main store listing**:

- **App name**: EdoLearn
- **Short description** (80 chars): AI-powered learning for Edo State students.
- **Full description**: See description below
- **Screenshots**: 2–8 screenshots (phone + 7" + 10" tablet)
- **Feature graphic**: 1024×500 PNG
- **Categorisation**: Education → Education
- **Tags**: Education
- **Content rating**: Fill the questionnaire (likely Everyone / General)
- **Target audience**: Age 5–18 (or as appropriate)

Suggested description:

```
EdoLearn is the official after-school learning platform of the Edo State
Universal Basic Education Board (SUBEB). Powered by AI, it helps students
across Edo State continue learning at home with interactive courses,
personalised AI tutoring, quizzes, virtual classes, and progress tracking.

Features:
• Enrol in courses created by Edo SUBEB teachers
• AI-powered tutoring assistant that helps you understand any topic
• Take quizzes and assessments with instant feedback
• Track your learning progress and earn certificates
• Join virtual Zoom classes with your teachers
• Receive announcements and notifications from your school
• Built-in messaging to communicate with teachers and classmates
```

---

## 2. iOS — Apple App Store

### 2.1 Prerequisites

- A Mac (needed to create certificates and provisioning profiles)
- Apple Developer Program membership ($99/year)
- Register at https://developer.apple.com/programs

### 2.2 Register the App ID

1. Go to https://developer.apple.com/account/resources/identifiers → **+**
2. **App IDs → Continue → App**
3. Description: `EdoLearn`
4. Bundle ID: `ng.gov.edosubeb.edolearn` (explicit)
5. Capabilities: None needed for EdoLearn

### 2.3 Create an App Store Connect record

1. Go to https://appstoreconnect.apple.com → **My Apps → + → New App**
2. Platform: iOS
3. Name: EdoLearn
4. Primary language: English (Nigeria)
5. Bundle ID: `ng.gov.edosubeb.edolearn`
6. SKU: `edolearn-ios-001`

### 2.4 Create a distribution certificate

On a Mac:

1. Open **Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority**
2. Save the CSR to disk
3. https://developer.apple.com/account/resources/certificates → **+**
4. **Apple Distribution → Continue**
5. Upload the CSR → Download the `.cer`
6. Double-click to install in Keychain
7. Export the private key:
   - In Keychain, find the certificate → expand → select the private key
   - **File → Export Items → .p12**
   - Set a password

### 2.5 Create a provisioning profile

1. https://developer.apple.com/account/resources/profiles → **+**
2. **App Store → Continue**
3. Select your App ID (`ng.gov.edosubeb.edolearn`)
4. Select the distribution certificate
5. Name: `EdoLearn App Store`
6. Download the `.mobileprovision` file

### 2.6 Create an App Store Connect API key

1. https://appstoreconnect.apple.com/access/api → **+**
2. Name: `EdoLearn CI/CD`
3. Access: ✅ **Admin**
4. Download the `.p8` API key file
5. Note the **Key ID** and **Issuer ID** shown on the page

### 2.7 Encode secrets

```bash
# Certificate
base64 -i distribution.p12 | pbcopy

# Provisioning profile
base64 -i EdoLearn.mobileprovision | pbcopy

# API key
base64 -i AuthKey_XXXXXXXXXX.p8 | pbcopy
```

### 2.8 Set GitHub secrets

| Secret key | Value |
|---|---|
| `APPLE_TEAM_ID` | Your 10-character team ID (find in Apple Developer → Membership) |
| `IOS_CERTIFICATE_BASE64` | base64 of `.p12` distribution certificate |
| `IOS_CERTIFICATE_PASSWORD` | Password set when exporting `.p12` |
| `IOS_PROVISIONING_PROFILE_BASE64` | base64 of `.mobileprovision` |
| `APPLE_API_KEY_BASE64` | base64 of the `.p8` API key file |
| `APPLE_API_KEY_ID` | Key ID from App Store Connect API Keys page |
| `APPLE_API_ISSUER_ID` | Issuer ID from App Store Connect API Keys page |

### 2.9 Fill in App Store listing (one-time)

In App Store Connect → **App Store → App Information**:

- **Name**: EdoLearn
- **Subtitle**: AI-Powered Learning
- **Primary language**: English (Nigeria)
- **Category**: Education
- **Content rights**: Complete as appropriate
- **Age rating**: Complete the questionnaire (likely 4+)

In **App Store → Pricing**:

- **Price**: Free
- **Availability**: All territories (or Nigeria only)

In **App Store → Prepare for Submission**:

- **Description**: Same as Android description above
- **Keywords**: edo, learn, education, nigeria, subeb
- **Support URL**: https://edodlah.com
- **Marketing URL**: https://edodlah.com
- **Promotional Text**: Learn anywhere with AI-powered courses from Edo SUBEB.
- **Screenshots**: 6.7" iPhone (iPhone 15 Pro Max) + 12.9" iPad Pro
- **Icon**: 1024×1024 PNG (already in `assets/icon.png`)
- **Review contact info**: Your phone number and email

---

## 3. Triggering a release

### Automated (tag push)

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers both workflows. On success, the AAB and IPA are uploaded to their
respective stores automatically.

### Manual (GitHub UI)

1. Go to your repo → **Actions** tab
2. Select **Android Release** or **iOS Release**
3. Click **Run workflow**
4. Optionally enter a version override

---

## 4. Workflow file reference

| File | Purpose |
|---|---|
| `.github/workflows/android-release.yml` | Builds signed AAB + uploads to Google Play |
| `.github/workflows/ios-release.yml` | Builds signed IPA + uploads to App Store Connect |
| `.github/export-options.plist` | iOS export configuration for App Store |
| `.github/release-notes/production.txt` | What's new text for Android releases |

---

## 5. Updating the app later

### Content changes (no store resubmit needed)

The app loads its UI from `https://edoafterschoolai.lovable.app`. Publish there
and all users get the update instantly.

### Binary changes (must resubmit)

Update `version` in `capacitor.config.ts`, push a new tag:

```bash
# Bump version
git tag v1.0.1
git push origin v1.0.1
```

The CI/CD pipeline rebuilds and uploads automatically.

### App Store screenshots

Capture on iOS Simulator:

```bash
xcrun simctl io booted screenshot screenshot-6.7.png
```
