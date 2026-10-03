#!/usr/bin/env node
/**
 * Builds release Android artifacts and copies them to dist/.
 *
 *   node scripts/build-android.js apk        -> dist/HammerIt-v1.0-1.apk
 *   node scripts/build-android.js aab        -> dist/HammerIt-v1.0-1.aab  (Google Play)
 *   node scripts/build-android.js apk aab    -> both
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ANDROID = path.join(ROOT, 'android');
const DIST = path.join(ROOT, 'dist');

const TARGETS = {
  apk: {
    task: 'assembleRelease',
    output: path.join(ANDROID, 'app/build/outputs/apk/release/app-release.apk'),
  },
  aab: {
    task: 'bundleRelease',
    output: path.join(ANDROID, 'app/build/outputs/bundle/release/app-release.aab'),
  },
};

const kinds = [...new Set(process.argv.slice(2))];
if (!kinds.length || kinds.some(k => !TARGETS[k])) {
  console.error('Usage: node scripts/build-android.js <apk|aab> [apk|aab]');
  process.exit(1);
}

function versionInfo() {
  const gradle = fs.readFileSync(path.join(ANDROID, 'app/build.gradle'), 'utf8');
  const name = (gradle.match(/versionName\s+"([^"]+)"/) || [])[1] || '0';
  const code = (gradle.match(/versionCode\s+(\d+)/) || [])[1] || '0';
  return { name, code };
}

function usesUploadKey() {
  if (process.env.HAMMERIT_UPLOAD_STORE_FILE) {
    return true;
  }
  const props = path.join(ANDROID, 'keystore.properties');
  if (!fs.existsSync(props)) {
    return false;
  }
  const storeFile = (fs.readFileSync(props, 'utf8').match(/^storeFile=(.+)$/m) || [])[1];
  return !!storeFile && fs.existsSync(path.join(ANDROID, storeFile.trim()));
}

const isWindows = process.platform === 'win32';
const gradlew = path.join(ANDROID, isWindows ? 'gradlew.bat' : 'gradlew');
const tasks = kinds.map(k => TARGETS[k].task);

console.log(`\n▶ Building ${kinds.join(' + ').toUpperCase()} (${tasks.join(', ')})\n`);
const result = spawnSync(isWindows ? `"${gradlew}"` : gradlew, [...tasks, '--console=plain'], {
  cwd: ANDROID,
  stdio: 'inherit',
  shell: isWindows,
});
if (result.status !== 0) {
  console.error('\n✖ Gradle build failed.');
  process.exit(result.status || 1);
}

const { name, code } = versionInfo();
fs.mkdirSync(DIST, { recursive: true });
console.log('');
for (const kind of kinds) {
  const src = TARGETS[kind].output;
  if (!fs.existsSync(src)) {
    console.error(`✖ Expected output not found: ${path.relative(ROOT, src)}`);
    process.exit(1);
  }
  const dest = path.join(DIST, `HammerIt-v${name}-${code}.${kind}`);
  fs.copyFileSync(src, dest);
  const mb = (fs.statSync(dest).size / 1024 / 1024).toFixed(1);
  console.log(`✔ ${path.relative(ROOT, dest)}  (${mb} MB)`);
}

if (!usesUploadKey()) {
  console.warn(
    '\n⚠ Signed with the DEBUG key. Fine for sideloading/testing, but Google Play will reject it.\n' +
      '  Run `npm run keystore:create` once to create your upload key, then rebuild.',
  );
} else {
  console.log('\n🔐 Signed with your upload key.');
}
