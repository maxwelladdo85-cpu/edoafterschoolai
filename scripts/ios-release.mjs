#!/usr/bin/env node
/**
 * Bumps ios.buildNumber in capacitor.config.ts and regenerates the iOS
 * native project so a fresh archive can be uploaded to App Store Connect.
 *
 * Usage:
 *   bun run ios:release           # bumps buildNumber by 1
 *   bun run ios:release -- 42     # sets buildNumber to "42"
 *   bun run ios:release -- --version 1.1.0   # also bump marketing version
 *
 * What it does:
 *   1. Reads capacitor.config.ts
 *   2. Increments (or sets) ios.buildNumber — App Store Connect rejects
 *      uploads that reuse a build number.
 *   3. Optionally updates the marketing `version`.
 *   4. Writes the file back.
 *   5. Runs `npx cap sync ios` so Xcode picks up the new Info.plist values.
 *
 * After this, open Xcode (`npx cap open ios`) → Product → Archive → Distribute.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const CONFIG = resolve(process.cwd(), "capacitor.config.ts");

if (!existsSync(CONFIG)) {
  console.error("capacitor.config.ts not found in", process.cwd());
  process.exit(1);
}

const args = process.argv.slice(2);
let explicitBuild = null;
let newVersion = null;
let skipSync = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--version") newVersion = args[++i];
  else if (a === "--no-sync") skipSync = true;
  else if (/^\d+$/.test(a)) explicitBuild = a;
  else {
    console.error(`Unknown arg: ${a}`);
    process.exit(1);
  }
}

let src = readFileSync(CONFIG, "utf8");

// Bump ios.buildNumber
const buildRe = /(buildNumber:\s*")(\d+)(")/;
const buildMatch = src.match(buildRe);
if (!buildMatch) {
  console.error('Could not find `buildNumber: "<n>"` in capacitor.config.ts');
  process.exit(1);
}
const current = parseInt(buildMatch[2], 10);
const next = explicitBuild ?? String(current + 1);
src = src.replace(buildRe, `$1${next}$3`);
console.log(`ios.buildNumber: ${current} → ${next}`);

// Optionally bump marketing version
if (newVersion) {
  const versionRe = /(version:\s*")([^"]+)(")/;
  const vMatch = src.match(versionRe);
  if (!vMatch) {
    console.error("Could not find marketing `version` field.");
    process.exit(1);
  }
  src = src.replace(versionRe, `$1${newVersion}$3`);
  console.log(`version: ${vMatch[2]} → ${newVersion}`);
}

writeFileSync(CONFIG, src);

if (skipSync) {
  console.log("Skipping `cap sync ios` (--no-sync).");
  process.exit(0);
}

console.log("\nRunning `npx cap sync ios`…");
const result = spawnSync("npx", ["cap", "sync", "ios"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (result.status !== 0) {
  console.error(
    "\n`cap sync ios` failed. If you haven't run `npx cap add ios` yet, do that first (macOS only).",
  );
  process.exit(result.status ?? 1);
}

console.log(
  `\nDone. Build ${next} is ready.\nNext: npx cap open ios → Product → Archive → Distribute App → App Store Connect.`,
);
