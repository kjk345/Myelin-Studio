# Myelin Studio

## What This Is
A single-file HTML/CSS/JS differential learning practice app for musicians. Differential learning is a neuroscience-based motor learning method that uses structured variability (randomized constraints) to build neural pathways faster than traditional repetitive practice.

## Architecture

### Single-File Design
The entire app lives in one HTML file with all CSS and JS inline. No build step, no bundler, no framework. This is intentional — keep it that way.

- **Main app**: `differential-learning-assistant.html` (the source of truth, ~1540 lines)
- **PWA version**: `myelin-studio-pwa/index.html` (same content + PWA meta tags + service worker registration)

When making changes, edit the main file first, then sync to the PWA copy. The PWA copy adds these on top of the main file:
- `<meta name="theme-color">`, `<meta name="description">`
- `<link rel="manifest">`, `<link rel="apple-touch-icon">`, `<link rel="icon">` tags
- `<script>if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{})}</script>` before `</body>`

### PWA Files (`myelin-studio-pwa/`)
- `index.html` — the app (synced from main file + PWA tags)
- `manifest.json` — PWA manifest, uses relative URLs (`./index.html`) for GitHub Pages subdirectory compatibility
- `sw.js` — service worker, network-first strategy, uses `self.registration.scope` for relative paths
- `icons/` — 16 PNG icons generated in RGB mode (no alpha channel — critical for iOS to avoid white backgrounds)

### GitHub Pages
Deployed at `https://kjk345.github.io/myelin-studio/`. Lives in a subdirectory, so all paths must be relative (not absolute like `/index.html`).

## Supabase Backend

### Project Details
- **Project URL**: `https://qqqnqmhrcchzawfcifpb.supabase.co`
- **Anon Key**: in the app's `<script>` block (search for `SUPABASE_KEY`)
- **Supabase MCP UUID**: `5592b4e5-7c33-4f03-acfa-526edbc65359`

### Database Tables
All have RLS enabled with policies scoped to `auth.uid()`.

- `profiles` — auto-created on user signup via trigger, stores display_name and preferred_language
- `sessions` — practice session logs (exercise type, duration, settings used)
- `daily_stats` — aggregated daily practice seconds, upserts on conflict
- `user_settings` — key/value store for user preferences (language, exercise settings)
- `custom_list_items` — user-created custom items for exercises

### Triggers
- `on_auth_user_created` → auto-inserts a row into `profiles`
- `update_*_updated_at` → auto-sets `updated_at` on row changes

### Data Pattern: Dual-Write
The app uses localStorage for instant/offline access and Supabase for cloud sync when logged in. The `db` helper object in the JS handles this:

```
db.saveSetting(key, value)    // writes to localStorage always, Supabase if logged in
db.getSetting(key)            // reads from localStorage (fast)
db.addDailySeconds(seconds)   // increments today's practice time in both stores
db.saveSession(data)          // logs a completed session
db.saveCustomItems(type, items) // saves custom exercise items
db.loadCustomItems(type)      // loads from Supabase if online, localStorage fallback
```

### Auth UX
No forced signup. The app opens straight to the home screen. Sign-in/sign-up is optional, tucked into Settings under "Sync & Backup." Functions: `syncSignIn()`, `syncSignUp()`, `signOut()`, `updateSyncUI()`. On app load, it silently checks for an existing session and loads user data if found.

## Exercise Types

1. **Number Generator** — displays random numbers within configurable intervals for variable rhythm practice
2. **Draw** — shows a random drawable object to sketch (305 curated words, 6 languages synced)
3. **Write** — displays text to copy in various difficulty modes
4. **Star Exercises** — interval-based practice with star notation
5. **Coordination Grid** — grid-based coordination exercises
6. **Sequence** — sequential pattern practice

## Key App Features

### Exercise Settings Persistence
Each exercise remembers its last-used settings (intervals, durations, player count, etc.) via `saveExSettings(exerciseType)` and `restoreExSettings(exerciseType)`. Settings are restored when navigating to a setup screen. The key mapping is in `EX_SETTINGS_KEYS`.

### Haptic Feedback
`haptic(ms)` calls `navigator.vibrate()` on exercise card taps. Only works in iOS PWA standalone mode and Android.

### iOS Speech Synthesis
Uses a silent utterance on first user gesture to unlock iOS speech synthesis.

### Draw Word Lists
The `drawWords` constant contains 305 curated drawable objects per language (en/es/de/fr/ja/zh), all index-aligned. Every word must be a concrete, drawable physical object — no abstract concepts.

### Responsive Number Display
`.numdisp` CSS uses `min(vw, px)` pattern with responsive breakpoints at 600px, 768px, 900px, and 1100px. The pixel caps have been increased significantly for iPad visibility.

## Languages
English, Spanish, German, French, Japanese, Chinese. Language selector is in Settings. All exercise content (draw words, UI labels) is translated.

## CSS Conventions
- CSS variables defined in `:root` for theming (dark theme only)
- `height: 100dvh` on `#app` container (critical for mobile viewport)
- `min()` function for responsive font sizing with pixel caps
- Responsive breakpoints: 600px, 768px, 900px, 1100px

## Other Projects in This Repo Area
- `sports-differential-learning/` — a separate premium sports DL app prototype (not production-ready, graded C+ by review). Contains research docs, design specs, and a prototype `app/index.html`.

## Development Notes
- Supabase JS loaded via CDN: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
- No npm, no build process — just edit the HTML file and push
- When regenerating PWA icons, use Pillow with `Image.new('RGB', ...)` — never RGBA, or iOS adds white backgrounds
- Service worker cache name must be bumped (currently `myelin-studio-v3`) whenever content changes significantly
- Test PWA changes by clearing service worker cache in browser devtools
