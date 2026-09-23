# MB-000 — Expo staff app scaffold (setup only, no features)

| | |
|---|---|
| **Status** | Draft |
| **Implementer** | เมธี (an executor agent may run the setup commands in his session) |
| **Revision** | 1 |
| **Depends on** | none (can run in parallel with BE-000 / FE-000). Merge after `docs/fe-stack-decisions` (DR-002/003/004) |
| **References** | CLAUDE.md "Architecture → Shape" (mobile scope) · DR-002 (HeroUI, Lucide, dual theme) · DR-004 (contracts) · DR-005 (URL scheme `barapp`) · `docs/design-system.md` · UI brief: `docs/briefs/ui/staff-mobile.md` (reference only — no screens built here) |
| **Audit depth** | Compact — tooling scaffold, no business logic |

---

## 1. Goal
`app/mobile/` exists as a working Expo SDK 57 app inside the pnpm workspace: it builds, runs on an Android dev build, renders one placeholder screen with HeroUI Native + Uniwind + Lucide + Sarabun, reads an enum from `@bar/contracts`, and passes `lint` + `typecheck` + `test`.

## 2. Scope
### In
- Create the app: `pnpm dlx create-expo-app@5.0.0 app/mobile --template blank-typescript@sdk-57 --no-install`, then install from the repo root with `pnpm install`.
- `app/mobile/package.json` — name `@bar/mobile`, `"main": "expo-router/entry"`, scripts (see §3), dependencies exactly as §7.
- Expo Router setup (manual install per Expo docs) with routes under `app/mobile/src/app/`.
- `app/mobile/app.config.ts` — replaces `app.json` (see §3).
- `app/mobile/metro.config.js` — Expo default config wrapped with Uniwind (`withUniwindConfig`, CSS entry `./src/global.css`).
- `app/mobile/src/global.css` — Tailwind v4 + Uniwind + HeroUI Native styles (exact imports from HeroUI Native quick start), Sarabun mapped as the default sans font; `@source` path must resolve `heroui-native/lib` under pnpm.
- `app/mobile/src/app/_layout.tsx` — `GestureHandlerRootView` → `HeroUINativeProvider` → `Stack`. Loads Sarabun (Regular, SemiBold, Bold) with `useFonts`; renders nothing until loaded.
- `app/mobile/src/app/index.tsx` — placeholder home: title **"ระบบจัดการบาร์"**, one HeroUI Native `Button` **"เข้าสู่ระบบด้วย LINE"** (no handler — label only), one Lucide icon, and the text of one `@bar/contracts` enum value (proves workspace resolution).
- `app/mobile/tsconfig.json` — extends `expo/tsconfig.base`, `strict: true`, `noUncheckedIndexedAccess: true`, path alias `@/*` → `./src/*`.
- Jest: `jest-expo` preset + `@testing-library/react-native`; one smoke test in `app/mobile/src/__tests__/home.test.tsx`.
- ESLint via `npx expo lint` (creates `eslint.config.js` with `eslint-config-expo`).
- `app/mobile/.gitignore` — template default + `ios/`, `android/`, `.expo-export/` (Continuous Native Generation — native folders are never committed).
- `pnpm-workspace.yaml` — add `'app/mobile'` (unlocked, §8).
- `app/mobile/README.md` — ≤ 20 lines: how to run the dev build on Android, how to run tests.

### Out (do NOT build here)
- Any feature or real screen: login flow, orders, tables, notes, bottle keep, notifications.
- Auth code (DR-005), push registration (DR-003 amendment), API client, React Query, Zustand, socket.io, react-hook-form, Zod usage — each comes with the brief that needs it.
- `expo-notifications`, `expo-secure-store`, `expo-web-browser`, `@gorhom/bottom-sheet`, `expo-blur` — not installed yet.
- Manual dark/light toggle — theme follows the phone setting only.
- EAS project, `eas.json`, store builds, app icons/splash artwork, OTA updates.
- iOS dev build (optional evidence only — Android is the demo target).
- Any change to `turbo.json`, root `package.json`, `app/frontend`, `app/backend`, `@bar/contracts`.
- Empty placeholder folders (`components/`, `lib/`, `stores/`, …) — create folders when the first file needs them.

## 3. Contract
- **Package name:** `@bar/mobile`
- **Scripts (exact names — the Turbo gate depends on them):**
  | Script | Command |
  |---|---|
  | `start` | `expo start --dev-client` |
  | `android` | `expo run:android` |
  | `ios` | `expo run:ios` |
  | `lint` | `expo lint` |
  | `typecheck` | `tsc --noEmit` |
  | `test` | `jest` |
  | `export:check` | `expo export --platform android --output-dir .expo-export` (bundle check without native toolchain; output gitignored) |
- **`app.config.ts`:** `name: 'Bar Staff'`, `slug: 'bar-staff'`, `scheme: 'barapp'` (DR-005 redirect target), `userInterfaceStyle: 'automatic'`, `android.package: 'com.barmanagement.staff'`, `ios.bundleIdentifier: 'com.barmanagement.staff'`, `plugins: ['expo-router', 'expo-font']`, `experiments.typedRoutes: true`. No secrets, no `extra.apiUrl` yet.
- **Endpoints / WS events:** none.
- **Contracts changes:** none (read-only import).
- **Permissions:** none.

## 4. Acceptance Criteria
- **AC-1** — Given a fresh clone, when `pnpm install` runs at the repo root, then it completes with `app/mobile` as workspace package `@bar/mobile` and no peer-dependency errors for the §7 packages.
- **AC-2** — Given the scaffold, when `pnpm --filter @bar/mobile export:check` runs, then Metro bundles Android JS successfully (proves Expo Router + Uniwind + HeroUI Native + `@bar/contracts` resolve under pnpm).
- **AC-3** — Given an Android emulator or device, when the dev build is installed (`pnpm --filter @bar/mobile android`) and started, then the home screen shows the Thai title in Sarabun, the HeroUI Button, the Lucide icon and the contracts enum value, with no red-box error and no "Invalid hook call".
- **AC-4** — Given the phone is switched between dark and light mode, then the home screen follows it (HeroUI Native theme changes) without a restart.
- **AC-5** — Given the smoke test, when `pnpm --filter @bar/mobile test` runs, then the home screen renders and the Thai title text is found.
- **AC-6** — `lint` and `typecheck` pass for `@bar/mobile`.
- **AC-7** — `ios/`, `android/`, `.expo/`, `.expo-export/` are not committed; `git status` is clean after a dev build.
- **AC-8** — `pnpm why react --filter @bar/mobile` shows `react@19.2.3`; the frontend still resolves its own React version and `pnpm --filter @bar/frontend lint` still passes (no workspace regression).

## 5. Test Gate
| AC | Test type | Evidence |
|---|---|---|
| AC-1 | manual | `pnpm install` output tail in the handoff |
| AC-2 | command | `export:check` output (bundle size line) |
| AC-3, AC-4 | manual | 2 screenshots (dark + light) from the Android dev build |
| AC-5 | unit | `app/mobile/src/__tests__/home.test.tsx` |
| AC-6 | command | gate output |
| AC-7 | command | `git status` after a dev build |
| AC-8 | command | `pnpm why react` output |

Gate commands (all must pass):
```bash
pnpm --filter @bar/mobile lint
pnpm --filter @bar/mobile typecheck
pnpm --filter @bar/mobile test
pnpm --filter @bar/mobile export:check
pnpm --filter @bar/frontend lint        # regression check (AC-8)
```
A required script that doesn't exist yet = **BLOCKED** — report it, never skip silently.

## 6. Constraints
- **Native packages are added with `npx expo install <pkg>`** (run inside `app/mobile/`) so versions match SDK 57 — never plain `pnpm add` for anything in §7 marked "expo install". If the resulting version differs from §7 → stop, raise a DR.
- **Tests never live under `src/app/`** — Expo Router turns every file there into a route. Tests go in `src/__tests__/`.
- **Module resolution:** mobile follows `expo/tsconfig.base` (Metro bundler resolution). The `.js`-extension-on-relative-imports rule in `docs/rules/core.md` does **not** apply to `app/mobile/` — this brief overrides it (Field will add the carve-out to the rules; see Follow-ups).
- **Styling:** Tailwind classes via Uniwind (`className`). No `StyleSheet.create` for anything a class can express; no hardcoded hex — tokens only (`docs/design-system.md` values go into `global.css` in a later brief; HeroUI defaults are fine for this scaffold).
- **HeroUI Native under Jest:** if it does not render after setting `transformIgnorePatterns` for pnpm paths, mock the minimal native modules (reanimated / gesture-handler official Jest setups). If it still fails → stop AC-5, raise a DR — do not delete the test.
- **Components:** named exports; `page`-equivalent route files (`_layout.tsx`, `index.tsx`) use default exports (Expo Router requirement).
- **Hardcoded Thai** strings, no i18n library.
- **No `.npmrc` / hoisting changes.** Expo SDK 57 supports pnpm isolated installs. If Metro cannot resolve a package without `node-linker=hoisted` → stop, raise a DR (root config).
- Do not run `expo prebuild` output into git, do not create an EAS project.

## 7. Decision Points (Field Guard)
- **Pre-decided (exact only):**
  | Package | Version | How |
  |---|---|---|
  | `expo` | `~57.0.24` | template |
  | `react` | `19.2.3` | template |
  | `react-native` | `0.86.3` | template |
  | `expo-status-bar` | `~57.0.1` | template |
  | `expo-router` | `~57.0.22` | expo install |
  | `expo-linking` | `~57.0.10` | expo install (router peer) |
  | `expo-constants` | `~57.0.19` | expo install (router peer) |
  | `react-native-safe-area-context` | `~5.7.0` | expo install |
  | `react-native-screens` | `~4.26.0` | expo install |
  | `expo-dev-client` | `~57.0.19` | expo install |
  | `expo-font` | `~57.0.4` | expo install |
  | `@expo-google-fonts/sarabun` | `^0.4.1` | pnpm add |
  | `heroui-native` | `1.0.10` (exact) | pnpm add |
  | `react-native-reanimated` | `4.5.1` | expo install |
  | `react-native-worklets` | `0.10.1` | expo install |
  | `react-native-gesture-handler` | `~2.32.0` | expo install |
  | `react-native-svg` | `15.15.4` | expo install |
  | `tailwind-variants` | `^3.3.1` | pnpm add |
  | `tailwind-merge` | `^3.7.0` | pnpm add |
  | `uniwind` | `^1.12.0` | pnpm add |
  | `lucide-react-native` | `^1.47.0` | pnpm add |
  | `@bar/contracts` | `workspace:*` | pnpm add |
  | dev: `tailwindcss` | `^4.3.3` | pnpm add -D |
  | dev: `typescript` | `~6.0.3` | template |
  | dev: `@types/react` | `~19.2.2` | template |
  | dev: `jest-expo` | `~57.0.5` | expo install |
  | dev: `jest` | `~29.7.0` (jest-expo 57 is on Jest 29) | pnpm add -D |
  | dev: `@types/jest` | `~29.5.14` | pnpm add -D |
  | dev: `test-renderer` | `^1.3.0` (peer of RNTL 14) | pnpm add -D |
  | dev: `@testing-library/react-native` | `^14.0.1` | pnpm add -D |
  | dev: `eslint`, `eslint-config-expo` `~57.0.2` | as installed by `npx expo lint` | expo lint |
- **Pre-decided (paths):** `app/mobile/**` as listed in §2; `pnpm-workspace.yaml` line `- 'app/mobile'`.
- **Likely DRs:** pnpm hoisting needed for Metro · HeroUI Native not renderable under Jest · a version mismatch from `expo install` · any extra package the template or a guide asks for (e.g. `expo-splash-screen`, `react-native-web`) — remove it or raise a DR, never keep it silently.

## 8. Unlocked Protected Files
- `pnpm-workspace.yaml`

---

## Before Ready (Field)
- DR-002 approved (HeroUI Native + Lucide on mobile).
- ~~DR-005 approved~~ ✅ 2026-09-23

## After Done (Field / follow-ups)
- เมธี spike: **menu list screen on HeroUI Native** on a throwaway branch off `main` (same spike as the web one before FE-000). Result recorded in DR-002 before any MB feature brief is Ready.
- Field adds `docs/rules/mobile.md` + thin wrappers (`.cursor/rules/mobile.mdc`, `.agents/rules/mobile.md`, glob `app/mobile/**`) and the `app/mobile` carve-out in `core.md` (`.js` extension / NodeNext rule).
- CLAUDE.md / AGENTS.md / `core.md` repo tree: `app/mobile/` — "planned" → created.
- SH-001 AC-3: a contracts change now also runs `@bar/mobile` tasks (Turbo does this automatically once it's in the workspace — note it in the SH-001 evidence).

---

## Changelog
| Rev | Date | Change |
|---|---|---|
| 1 | 2026-09-23 | Initial draft (Cowork) |
