# Hammer It! — Google Play listing

Copy-paste values for Play Console. Character limits are Google's.

---

## App identity

**Package name / application ID:** `com.kinngshishupal.hammerit` (iOS bundle ID is the same). This becomes
permanent once you upload the first build to Play Console.

---

## Main store listing

**App name** (max 30)
```
Hammer It! – Whack a Hamster
```

**Short description** (max 80)
```
Smash hamsters, dodge bombs & chain combos in this neon whack-a-mole arcade!
```

**Full description** (max 4000)
```
Grab your mallet. The hamsters are back, and they're faster than ever!

Hammer It! is a fast, colourful whack-a-mole arcade game. Hamsters pop out of their holes at random. Smash
them before they duck back down, and chain hits together for huge combo multipliers. But watch out: not
everything that pops up is a hamster…

🐹 SMASH HAMSTERS: every hit scores points. Hit them back-to-back to build your combo.
⭐ GOLDEN HAMSTERS: rare, shiny and quick. Catch one for 5x the points!
💣 DODGE THE BOMBS: hit a bomb and you lose a life. Lose all three and it's KABOOM.
🔥 COMBO MULTIPLIER: every 5 hits in a row raises your multiplier, all the way up to x5.
⏱ 60-SECOND ROUNDS: the action speeds up as the clock runs down, with more hamsters, more bombs and less
time to react. The final 10 seconds are pure chaos!
🏆 EARN YOUR RANK: go from Gentle Tapper to Hamster Legend.

WHY YOU'LL LOVE IT
• Gorgeous neon visuals with juicy hit effects, particles and screen shake
• Satisfying sound effects: every hamster, golden hamster and bomb sounds different
• An original chiptune soundtrack that ramps up with the action
• Haptic feedback on every smack
• Quick rounds, perfect for a coffee break
• Plays fully offline, so no internet is needed
• No ads. No in-app purchases. No sign-up. No data collected.

How fast are your reflexes? Pick up the hammer and find out!
```

---

## Categorisation

| Field | Value |
|---|---|
| App or game | **Game** |
| Category | **Arcade** (alternative: Casual) |
| Tags (pick up to 5) | Arcade, Casual, Action, Reflex, Offline |
| Free or paid | **Free** |
| Contains ads | **No** |
| In-app purchases | **No** |

---

## App content (Policy → App content)

**Privacy policy URL:** Play Console asks every app for one. Host the text below somewhere public (GitHub
Pages, Google Sites or a Notion public page) and paste its URL.

**Ads:** No, my app does not contain ads.

**App access:** All functionality is available without special access (no login).

**Target audience and content**
- Recommended target age groups: **13–15, 16–17, 18+**.
- If you also tick **under 13**, the app joins Google's *Families* program. That means extra review and
  stricter requirements: a privacy policy is mandatory, and you must answer the teacher-approved and ads
  questions. It's doable because the app collects nothing, but only select it if you mean to target kids.
- "Could the app unintentionally appeal to children?" Answer **Yes** (cartoon art), then confirm there are
  no ads and no data collection.

**Content rating (IARC questionnaire)**
- Category: **Game**
- Violence: **Yes, cartoon/fantasy violence**. Mild, comical, against non-realistic cartoon animals, no blood.
- Blood/gore: No · Sexual content: No · Profanity: No · Drugs/alcohol/tobacco: No
- Gambling or simulated gambling: No
- Users can interact or exchange content: No · Shares location: No · Digital purchases: No
- *Expected result:* roughly **Everyone / PEGI 7** (mild cartoon violence).

**Data safety**
- Does your app collect or share any of the required user data types? **No**
- (Encryption in transit / data deletion questions then don't apply.)
- Why this is accurate: the game makes no network requests, has no analytics or ads SDKs, and doesn't save
  anything to the device. Permissions used are `VIBRATE` (haptics) and the standard React Native `INTERNET`
  permission (not used by the game).

**Government app:** No · **Financial features:** None · **Health:** No · **News app:** No

---

## Graphics checklist

| Asset | Requirement | Status |
|---|---|---|
| App icon | 512×512 PNG, ≤ 1 MB | ✅ `assets/icon/playstore-512.png` |
| Feature graphic | 1024×500 PNG/JPG, **required** | ❌ to create |
| Phone screenshots | 2–8 images, PNG/JPG, 320–3840 px, long side ≤ 2× the short side | ❌ to create (see note) |
| 7"/10" tablet screenshots | optional | — |

Note: raw screenshots from your phone are 1220×2712, a 2.22:1 ratio. **Play rejects anything longer than
2:1**, so crop or pad them, for example to 1220×2440 or 1080×1920. Good shots: the menu, a busy round with a
hit burst, a golden hamster, a bomb explosion, and the game-over screen with a rank.

---

## Release (Production / Testing track)

**Release name:** `1.0 (1)`

**Release notes** (`<en-US>`, max 500)
```
Hammer It! is here! 🔨🐹
• Smash hamsters, catch rare golden ones and dodge the bombs
• Combo multiplier up to x5
• 60-second rounds that speed up as time runs out
• Neon visuals, juicy effects, haptics and an original soundtrack
• No ads, no purchases, plays offline
```

**Before uploading**
1. `npm run keystore:create` (once), then back up the keystore, `android/keystore.properties` and the password.
2. Bump `versionCode` in `android/app/build.gradle` for every new upload.
3. `npm run build:aab` and upload `dist/HammerIt-v<version>-<code>.aab`.
4. Keep **Play App Signing** enabled (the default). Google holds the app signing key, and your keystore
   becomes the *upload* key, which Google can reset if you ever lose it.
5. New personal developer accounts must run a **closed test with at least 12 testers for 14 days** before
   production access is granted.

---

## Store contact details
- Email: *(required; use an address you're happy to show publicly)*
- Website: optional
- Phone: optional

---

## Privacy policy (template)

> Host this text publicly and link it in Play Console. Fill in the bracketed parts.

```
Privacy Policy for Hammer It!
Last updated: [DATE]

Hammer It! ("the app") is developed by [YOUR NAME / STUDIO].

Information we collect
The app does not collect, store, or share any personal information. It does not require an account, does
not use analytics or advertising services, and does not connect to the internet during gameplay.

Device permissions
• Vibration: used only to provide haptic feedback during the game.

Children's privacy
The app does not knowingly collect any information from anyone, including children under 13.

Third-party services
The app does not include third-party services that collect information.

Changes to this policy
If this policy changes, the updated version will be posted on this page with a new "Last updated" date.

Contact
If you have questions about this policy, contact: [YOUR EMAIL]
```
