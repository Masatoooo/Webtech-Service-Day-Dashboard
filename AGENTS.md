# AGENTS.md

Angular 21 CSR / employee-volunteer dashboard. Frontend only: no backend or database. Seed JSON plus `localStorage` is the entire data layer; keep docs and UI copy honest about simulated auth, email, and QR verification.

## Commands

- `npm install` — use npm (lockfile + CI use `npm ci`); CI runs Node 20.
- `npm start` — dev server at `http://localhost:4200`; unauthenticated users land on `/login`.
- `npm run build` — production build; also the only typecheck (strict templates). Output is `dist/service-day-dashboard/browser/`. The initial bundle is ~481 kB (warning at 500 kB, error at 1 MB).
- `npm test -- --watch=false` — full Vitest suite. `ng test` watches by default in a TTY.
- Single file: `npm test -- --watch=false --include=src/app/core/services/auth.service.spec.ts`
- Name filter: `npm test -- --watch=false --filter='AuthGuard'`
- `npm run build:gh-pages` — GitHub Pages build; `scripts/prepare-gh-pages.js` copies `index.html` to `404.html` for SPA routing.

### Node test gotcha (verified)

On newer Node (v26 tested; CI uses v20), Node exposes `globalThis.localStorage` as `undefined`, which shadows jsdom's implementation. The storage/notification/attendance specs then fail with `Cannot read properties of undefined` and `TestBed has already been instantiated` (29 failures). Run tests as:

```bash
NODE_OPTIONS=--no-experimental-webstorage npm test -- --watch=false
```

This yields the full green suite. There is no lint target and no test step in CI; the deploy workflow only builds.

## Architecture

- Classic NgModule app, **not standalone**. Components use `standalone: false`; declare new pages in their feature module and add routes in the matching `*-routing.module.ts`.
- Root: `src/app/app.module.ts` (`APP_INITIALIZER` loads data before render), `app-routing.module.ts` (`/login`, `/register`, lazy `/admin` and `/employee`, `** -> /404`).
- `CoreModule` must only be imported by `AppModule` (its constructor throws if loaded twice). `SharedModule` re-exports `CommonModule`, forms, router, and shared components.
- Feature boundaries: `features/admin`, `features/employee` are lazy-loaded; `features/auth` is eager. Guards live in `core/guards` and expect `data: { expectedRole: 'ADMIN' | 'EMPLOYEE' }`; role mismatch redirects to that user's own landing page.
- `DataStoreService` is the single `BehaviorSubject` store (`activities$`, `users$`, etc.). Hydration order: existing `localStorage` (`sdd_*` keys) first, otherwise fetch `assets/data/*.json` via `MockDataService`. Mutations must go through `DataStoreService` setters or the domain services (`ActivityService`, `RegistrationService`, …) so state emits and persists.
- Direct `localStorage` writes do not update the store. Reset demo state with the sidebar **Reset Demo Data** button or by clearing the `sdd_*` keys.
- Auth resolves users by email from seed data; any non-empty password is accepted. Aliases: `admin@serviceday.demo` → Marcus Vance, `employee@serviceday.demo` → Alice Chen. `dev@svd.id` is an intentional super-admin account. See `docs/DEMO_CREDENTIALS.md`.
- File layout is grouped by layer (`core`, `shared`, `features`, `models`); page components live under `features/<role>/pages/<page>/` with `.ts/.html/.css/.spec.ts` siblings.

## Seed data and docs

- Only `public/assets/data/*.json` is bundled (configured in `angular.json`). `src/assets/data/` is an unused mirror and its `users.json` is already stale — edit `public/`, then sync the mirror if desired.
- Seed entities: `ngos`, `activities`, `users`, `registrations`, `notifications`, `attendance`. Registration/attendance changes affect capacity calculations reactively.
- `README.md` and `docs/COURSEWORK_DELIVERABLES_REPORT.md` contain stale details: the “Warm Editorial” palette and `dist/service-day-dashboard/` output path are outdated, and test counts (180/24) are old. Trust `angular.json`, `src/styles.css`, and the commands above. Useful references: `docs/DATA_LAYER_DOCUMENTATION.md`, `docs/MANUAL_QA_CHECKLIST.md`.

## Styling

- `src/styles.css` (~3.7k lines) is the design system: tokens, utilities, shell, and shared page styling. The palette is High-Contrast Monochrome + Electric Cobalt: obsidian/jet-black (`--ink-900: #09090B`) primary actions & sidebar, electric blue (`--electric-600: #2563EB` / `--electric-500: #3B82F6`) interactive accents, and crisp zinc-neutral surfaces (`#FAFAFA` / `#FFFFFF`). Typography uses Public Sans across UI and headings (`src/index.html`). Legacy names (`--evergreen-*`, `--marigold-*`, `--color-primary-blue`, `--color-forest`, …) are mapped onto the new tokens. Page-level `.css` files are small overrides.
- One status-chip shape covers every status class (`.badge`, `.pub-*`, `.avail-*`, `.status-pill`, `.notif-badge-*`, …). Reuse it instead of inventing new pill styles.
- Do not put `transform` on the page entrance animation (`.app-main-viewport > *`): it makes the page a containing block and traps `position: fixed` modals inside it.
- Brand mark: `public/assets/images/service-day-mark.svg` plus the text wordmark; the old PNG logos are no longer referenced.
- Production budget: component styles warn at 15 kB and fail at 25 kB. Reuse global classes rather than duplicating large style blocks.

## Conventions

- Angular 21 runs **zoneless** (no `zone.js` dependency). State changes made inside async RxJS/HTTP callbacks do not trigger re-rendering by themselves; call `ChangeDetectorRef.markForCheck()` (or use signals) or the UI stays stale. Forgetting this previously left the login button stuck on “AUTHENTICATING...” after a failed async login.
- TypeScript is strict with `strictTemplates`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature` (use `route.data['expectedRole']`, not `.expectedRole`).
- Prettier config exists (single quotes, 100 cols, Angular HTML parser) but is not enforced and the code is not fully formatted. Do not run repo-wide `prettier --write`; format only files you touch.
- QR work uses CommonJS `qrcode` and `html5-qrcode` (allow-listed in `angular.json`). Camera check-in requires localhost/HTTPS and browser permission; manual fallback is intentional.
- Deployment: pushing to `main` builds with base href `/Webtech-Service-Day-Dashboard/` and publishes `dist/service-day-dashboard/browser` to GitHub Pages.
