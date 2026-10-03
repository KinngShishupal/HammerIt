# Hammer It! 🔨🐹

A whack-a-hamster arcade game built with bare React Native 0.87 (no Expo).

## Gameplay
- 9 or 12 holes depending on screen height. Hamsters pop out of random holes; tap one to smash it.
- **Hamster**: +10 · **Golden hamster**: +50 (shows up rarely, hides fast) · **Bomb**: avoid it, each hit costs 1 of your 3 lives.
- Every 5 hits in a row raises the multiplier (up to x5). A miss, a bomb, or a hamster that gets away resets it.
- A round lasts 60 seconds and keeps speeding up, with more hamsters up at once.

## Run
```bash
npm install
npm run android   # or: npm run ios (run `bundle install && cd ios && bundle exec pod install` first)
```

## Release builds (APK / AAB)
```bash
npm run build:apk       # dist/HammerIt-v<version>-<code>.apk  (install directly on phones)
npm run build:aab       # dist/HammerIt-v<version>-<code>.aab  (upload to Google Play)
npm run build:android   # both
```
The version comes from `versionName` / `versionCode` in `android/app/build.gradle`. Bump `versionCode` for every
Play Store upload.

**Signing:** without an upload key, release builds are signed with the debug key. That's fine for sideloading,
but Google Play rejects it. Create your key once:
```bash
npm run keystore:create
```
It asks for a password in a hidden prompt, then writes `android/app/hammerit-upload.keystore` and
`android/keystore.properties`. Both are git-ignored. **Back them up together with the password.** On CI, set
`HAMMERIT_UPLOAD_STORE_FILE`, `HAMMERIT_UPLOAD_STORE_PASSWORD`, `HAMMERIT_UPLOAD_KEY_ALIAS` and
`HAMMERIT_UPLOAD_KEY_PASSWORD` instead.

## Structure
```
App.tsx                    screen switching (menu, game, game over) and best score
src/game/config.ts         tuning: points, difficulty curve, spawn odds, ranks
src/game/useGameEngine.ts  spawn loop, timers, scoring, combos, lives
src/components/            Hamster, Bomb, Hole, Hammer, Effects (particles), HUD, Background, GlowButton
src/screens/               MenuScreen, GameScreen, GameOverScreen
```

Every visual is drawn with Views, CSS gradients (`backgroundImage`) and `boxShadow`, then animated with the
built-in `Animated` API on the native driver. The only extra native library is the audio engine.

## Audio
All sound effects and music are synthesized at runtime with
[react-native-audio-api](https://github.com/software-mansion/react-native-audio-api), the Web Audio API for
React Native, in `src/audio/sound.ts`. There are no audio files.
- Different hit sounds: hamster (bonk plus a squeak whose pitch climbs with the combo), golden (bonk, coin
  ka-ching and a sparkle arpeggio), bomb (sub-bass boom with a noise blast), miss (thud on the dirt), plus a
  swing whoosh on every tap.
- Pop-up cues when something appears, countdown beeps, combo jingles, clock ticks in the last 10 seconds,
  game-over jingles and a new-best fanfare.
- Two chiptune tracks: a bright home-screen theme (C major, bell melody), and an A-minor game track that
  speeds up for the final stretch. Music and SFX toggles are on the menu.

**Windows build note:** the audio library downloads prebuilt binaries with Git Bash during the Gradle build.
`android/build.gradle` puts Git's tools on that task's PATH, so `npm run android` works as is. It needs Git for
Windows installed in the default location. Run it from PowerShell or cmd; from Git Bash the CLI can't start
`gradlew.bat`.
