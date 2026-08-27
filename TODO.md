# Final Luna plan — IceCold Sprint Study App

Repository: `C:\Users\91829\OneDrive\Documents\GitHub\lablab-hackathon-study-app`
Reviewed: clean `main` at `1d1613b` on 2026-08-25
Feature branch: `codex/luna-icecold-state-recovery`

## Current verified baseline

- TypeScript and Vite production build pass through `npm.cmd run check`.
- `npm.cmd run smoke` is blocked because the expected Playwright Chromium executable is not installed. This is an environment blocker, not a passing browser test.
- Timer pause/resume and storage-error messaging exist.

## Code-review conclusion

Stored values are unversioned per-key JSON, so incompatible shapes have no migration contract. Cross-tab removal events are ignored because the hook only handles truthy `newValue`. The timer uses wall-clock deltas without an explicit backwards/forwards clock-change policy. These are correctness slices before quiz polish.

## Build checklist

- [ ] **1. Restore the browser verification prerequisite**
  Files: README, smoke script, package scripts/CI.
  What to build: Pin/document Playwright browser installation and make missing-browser output a concise prerequisite failure.
  Acceptance: A clean environment can install the pinned browser and run smoke without manual path guessing.
  Verify: `npx.cmd playwright install chromium` in an authorized environment, then `npm.cmd run smoke`.

- [ ] **2. Introduce a versioned storage envelope**
  Files: `useLocalStorage.ts`, types, storage utilities, tests.
  What to build: Store schema version plus payload, validate parsed shapes, migrate supported old versions, and offer repair/export/reset for unsupported/corrupt data.
  Acceptance: Corrupt, quota, disabled, and incompatible storage never silently resets user work; memory-only mode is explicit.
  Verify: Unit tests for first load, legacy migration, corrupt JSON, quota failure, key removal, and cross-tab update/removal.

- [ ] **3. Make timer recovery deterministic**
  Files: `StudyPlan.tsx`, timer type/utility, tests.
  What to build: Represent running timer with a deadline plus saved remaining time, define tab sleep/reload/visibility behavior, and detect implausible clock jumps. Pause/resume must be idempotent.
  Acceptance: Only one active timer exists; reload cannot add or lose elapsed time outside the documented policy; zero never becomes negative.
  Verify: Fake-timer tests for pause, resume, reload, hidden tab, expiry, block switch, backward clock, and large forward jump.

- [ ] **4. Couple block completion and timer state safely**
  Files: plan state transitions and tests.
  What to build: Prevent double completion, stop/clear the relevant timer deliberately, distinguish skip from complete, and preserve prior quiz/progress history on review.
  Acceptance: Repeated clicks and cross-tab updates cannot toggle a completed block accidentally.
  Verify: Reducer/domain tests plus browser double-click/reload flow.

- [ ] **5. Finish quiz/progress recovery**
  Files: quiz, progress summaries, storage schemas.
  What to build: Preserve attempts, distinguish review/new attempt, explain correct/partial/unanswered, and show remaining work without false precision.
  Acceptance: Quiz failure or reload does not erase prior progress; corrupted quiz state enters the same repair flow.
  Verify: Unit and browser tests for retry, reload, reset cancel/confirm, and empty state.

- [ ] **6. Expand the smoke journey**
  Files: `scripts/smoke.mjs` or structured browser suite.
  What to build: Cover setup validation, deterministic generation, timer lifecycle, reload, quiz retry, storage failure, export/repair, reset, keyboard, mobile, and reduced motion.
  Acceptance: The complete first-run-to-completion path passes in a clean browser profile.
  Verify: `npm.cmd run check`; `npm.cmd run smoke`; `git diff --check`.

- [ ] **7. Verify product boundaries and deployment**
  Files: README/troubleshooting and private deployment notes.
  What to build: Keep the deterministic local generator labelled; do not add or imply AI/provider behavior unless separately authorized. Verify offline caching and deployed state apart from local dev.
  Acceptance: Local, fallback, offline, hosted, and any future provider behavior are unambiguous.
  Verify: Offline reload on deployed origin and cache-update recovery.

## Commit checkpoints

1. `feat(storage): add versioned recoverable study state`
2. `fix(timer): make pause reload and clock changes deterministic`
3. `test(study): extend full browser recovery journey`

## Definition of done

- [ ] Storage is versioned, validated, migratable, and recoverable.
- [ ] Timer and block completion semantics are deterministic and tested.
- [ ] Browser smoke passes with the pinned Playwright browser.
- [ ] Local/deterministic/offline/hosted claims remain honest.
- [ ] Feature branch is pushed and clean; `main` is untouched and unmerged.
