#!/usr/bin/env node
/**
 * iOS preflight check.
 *
 * Verifies the bundle identifier is consistent across:
 *   1. capacitor.config.ts          → appId
 *   2. ios/App/App.xcodeproj/project.pbxproj
 *                                   → PRODUCT_BUNDLE_IDENTIFIER (Debug + Release)
 *   3. ios/App/App/Info.plist       → CFBundleIdentifier (usually $(PRODUCT_BUNDLE_IDENTIFIER))
 *   4. Your registered Apple App ID → passed via --apple-id or APPLE_APP_ID env var
 *                                     (and/or the team id via --team / APPLE_TEAM_ID)
 *
 * Also surfaces, when present in pbxproj:
 *   - DEVELOPMENT_TEAM
 *   - CODE_SIGN_STYLE  (Automatic vs Manual)
 *   - PROVISIONING_PROFILE_SPECIFIER
 *
 * Usage:
 *   bun run ios:preflight
 *   bun run ios:preflight -- --apple-id ng.gov.edosubeb.edolearn --team ABCDE12345
 *   APPLE_APP_ID=ng.gov.edosubeb.edolearn APPLE_TEAM_ID=ABCDE12345 bun run ios:preflight
 *
 * Exit code 0 = all checks passed, 1 = mismatch (blocks CI).
 *
 * Run this BEFORE `npx cap open ios` / Archive. A mismatch between
 * capacitor.config.ts appId and Xcode's PRODUCT_BUNDLE_IDENTIFIER is the
 * #1 cause of "No matching provisioning profile" errors at upload time.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const CONFIG = resolve(ROOT, "capacitor.config.ts");
const PBXPROJ = resolve(ROOT, "ios/App/App.xcodeproj/project.pbxproj");
const INFO_PLIST = resolve(ROOT, "ios/App/App/Info.plist");

const args = process.argv.slice(2);
let appleId = process.env.APPLE_APP_ID ?? null;
let teamId = process.env.APPLE_TEAM_ID ?? null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--apple-id") appleId = args[++i];
  else if (args[i] === "--team") teamId = args[++i];
  else {
    console.error(`Unknown arg: ${args[i]}`);
    process.exit(1);
  }
}

const problems = [];
const notes = [];
const ok = [];

function check(label, cond, detail) {
  (cond ? ok : problems).push(`${cond ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

// 1. capacitor.config.ts
if (!existsSync(CONFIG)) {
  console.error("capacitor.config.ts not found.");
  process.exit(1);
}
const configSrc = readFileSync(CONFIG, "utf8");
const appIdMatch = configSrc.match(/appId:\s*["']([^"']+)["']/);
if (!appIdMatch) {
  problems.push("✗ capacitor.config.ts — `appId` field not found");
  console.log(problems.join("\n"));
  process.exit(1);
}
const capAppId = appIdMatch[1];
ok.push(`✓ capacitor.config.ts appId = ${capAppId}`);

// 2. Xcode project.pbxproj
let pbxBundleIds = [];
let pbxTeamIds = [];
let pbxSignStyles = [];
let pbxProfiles = [];
if (existsSync(PBXPROJ)) {
  const pbx = readFileSync(PBXPROJ, "utf8");
  pbxBundleIds = [...pbx.matchAll(/PRODUCT_BUNDLE_IDENTIFIER\s*=\s*([^;]+);/g)]
    .map((m) => m[1].trim().replace(/^["']|["']$/g, ""));
  pbxTeamIds = [...pbx.matchAll(/DEVELOPMENT_TEAM\s*=\s*([^;]+);/g)]
    .map((m) => m[1].trim().replace(/^["']|["']$/g, ""));
  pbxSignStyles = [...pbx.matchAll(/CODE_SIGN_STYLE\s*=\s*([^;]+);/g)]
    .map((m) => m[1].trim().replace(/^["']|["']$/g, ""));
  pbxProfiles = [...pbx.matchAll(/PROVISIONING_PROFILE_SPECIFIER\s*=\s*([^;]+);/g)]
    .map((m) => m[1].trim().replace(/^["']|["']$/g, ""));

  if (pbxBundleIds.length === 0) {
    problems.push("✗ Xcode pbxproj — no PRODUCT_BUNDLE_IDENTIFIER entries found");
  } else {
    const unique = [...new Set(pbxBundleIds)];
    if (unique.length > 1) {
      problems.push(
        `✗ Xcode pbxproj has multiple bundle ids across build configs: ${unique.join(", ")} ` +
          "(Debug and Release must match)",
      );
    } else {
      check(
        `Xcode PRODUCT_BUNDLE_IDENTIFIER = ${unique[0]}`,
        unique[0] === capAppId,
        unique[0] === capAppId ? null : `does not match capacitor appId (${capAppId})`,
      );
    }
  }

  if (pbxTeamIds.length) {
    const uniqTeams = [...new Set(pbxTeamIds.filter(Boolean))];
    notes.push(`• DEVELOPMENT_TEAM in Xcode: ${uniqTeams.join(", ") || "(empty)"}`);
    if (teamId) {
      const allMatch = uniqTeams.every((t) => t === teamId);
      check(
        `Xcode DEVELOPMENT_TEAM matches --team ${teamId}`,
        allMatch && uniqTeams.length > 0,
        allMatch ? null : `expected ${teamId}, found ${uniqTeams.join(", ") || "(empty)"}`,
      );
    }
  } else if (teamId) {
    problems.push(
      `✗ Xcode pbxproj — no DEVELOPMENT_TEAM set, but --team ${teamId} was provided. ` +
        "Open Xcode → Signing & Capabilities and select your team.",
    );
  }

  if (pbxSignStyles.length) {
    notes.push(`• CODE_SIGN_STYLE: ${[...new Set(pbxSignStyles)].join(", ")}`);
  }
  if (pbxProfiles.length) {
    notes.push(`• PROVISIONING_PROFILE_SPECIFIER: ${[...new Set(pbxProfiles)].join(", ")}`);
  }
} else {
  notes.push(
    "• ios/ not generated yet — run `npx cap add ios` on a Mac, then re-run preflight " +
      "to validate Xcode signing.",
  );
}

// 3. Info.plist
if (existsSync(INFO_PLIST)) {
  const plist = readFileSync(INFO_PLIST, "utf8");
  const cfBundleIdMatch = plist.match(
    /<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/,
  );
  if (cfBundleIdMatch) {
    const v = cfBundleIdMatch[1];
    if (v.includes("$(PRODUCT_BUNDLE_IDENTIFIER)")) {
      ok.push("✓ Info.plist CFBundleIdentifier uses $(PRODUCT_BUNDLE_IDENTIFIER) (correct)");
    } else {
      check(
        `Info.plist CFBundleIdentifier = ${v}`,
        v === capAppId,
        v === capAppId ? null : `does not match capacitor appId (${capAppId})`,
      );
    }
  }
}

// 4. Apple App ID (from registry)
if (appleId) {
  check(
    `Apple registered App ID = ${appleId}`,
    appleId === capAppId,
    appleId === capAppId ? null : `does not match capacitor appId (${capAppId})`,
  );
} else {
  notes.push(
    "• Pass --apple-id <bundle-id> or set APPLE_APP_ID to verify against your " +
      "registered App ID at developer.apple.com.",
  );
}

console.log("\niOS preflight\n=============");
ok.forEach((l) => console.log(l));
if (notes.length) {
  console.log("\nNotes:");
  notes.forEach((l) => console.log(l));
}
if (problems.length) {
  console.log("\nProblems:");
  problems.forEach((l) => console.log(l));
  console.log(
    "\nFix the mismatches above before archiving. The bundle ID in capacitor.config.ts, " +
      "Xcode → Signing & Capabilities, and the App ID registered at developer.apple.com " +
      "MUST all be identical.",
  );
  process.exit(1);
}
console.log("\nAll checks passed. Safe to archive.");
