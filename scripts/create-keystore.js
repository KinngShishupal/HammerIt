#!/usr/bin/env node
/**
 * Creates the Android upload keystore used to sign release builds and writes
 * android/keystore.properties (both are git-ignored).
 *
 *   npm run keystore:create
 *
 * The password is typed into a hidden prompt and passed to keytool through an
 * environment variable, so it never shows up on screen or in the process list.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ANDROID = path.resolve(__dirname, '..', 'android');
const STORE_REL = 'app/hammerit-upload.keystore';
const STORE = path.join(ANDROID, STORE_REL);
const PROPS = path.join(ANDROID, 'keystore.properties');
const ALIAS = 'hammerit-upload';

function ask(question, { hidden = false } = {}) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = text => {
        // only echo the prompt itself, never the typed characters
        if (text.includes(question)) {
          rl.output.write(text);
        }
      };
    }
    rl.question(question, answer => {
      rl.close();
      if (hidden) {
        process.stdout.write('\n');
      }
      resolve(answer.trim());
    });
  });
}

function findKeytool() {
  const exe = process.platform === 'win32' ? 'keytool.exe' : 'keytool';
  if (process.env.JAVA_HOME) {
    const candidate = path.join(process.env.JAVA_HOME, 'bin', exe);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return 'keytool';
}

(async () => {
  if (fs.existsSync(STORE)) {
    console.error(`✖ ${path.relative(process.cwd(), STORE)} already exists. Refusing to overwrite your upload key.`);
    process.exit(1);
  }

  console.log('Creating the Hammer It! upload key.\n');
  const password = await ask('Choose a keystore password (min 6 chars): ', { hidden: true });
  if (password.length < 6) {
    console.error('✖ Password must be at least 6 characters.');
    process.exit(1);
  }
  const confirm = await ask('Repeat the password: ', { hidden: true });
  if (password !== confirm) {
    console.error('✖ Passwords do not match.');
    process.exit(1);
  }
  const owner = (await ask('Your name or studio (for the certificate) [Hammer It]: ')) || 'Hammer It';
  const country = ((await ask('Two-letter country code [IN]: ')) || 'IN').toUpperCase().slice(0, 2);

  const clean = s => s.replace(/[,=+<>#;"\\]/g, ' ');
  const result = spawnSync(
    findKeytool(),
    [
      '-genkeypair',
      '-v',
      '-storetype', 'PKCS12',
      '-keystore', STORE,
      '-alias', ALIAS,
      '-keyalg', 'RSA',
      '-keysize', '2048',
      '-validity', '10000',
      '-dname', `CN=${clean(owner)}, O=${clean(owner)}, C=${country}`,
      '-storepass:env', 'HAMMERIT_KS_PASS',
      '-keypass:env', 'HAMMERIT_KS_PASS',
    ],
    { stdio: 'inherit', env: { ...process.env, HAMMERIT_KS_PASS: password } },
  );
  if (result.error || result.status !== 0) {
    console.error('✖ keytool failed. Make sure a JDK is installed (JAVA_HOME or keytool on PATH).');
    process.exit(1);
  }

  fs.writeFileSync(
    PROPS,
    [
      '# Upload key for release builds. DO NOT COMMIT. Back this file and the keystore up somewhere safe.',
      `storeFile=${STORE_REL}`,
      `storePassword=${password}`,
      `keyAlias=${ALIAS}`,
      `keyPassword=${password}`,
      '',
    ].join('\n'),
  );

  console.log(`\n✔ Keystore: android/${STORE_REL}`);
  console.log('✔ Signing config: android/keystore.properties');
  console.log(
    '\n⚠ Back up BOTH files and the password. If you lose them you cannot ship updates\n' +
      '  to the same Play Store listing (unless Play App Signing can reset your upload key).',
  );
})();
