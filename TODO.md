# IceCold Sprint TODO

Last reviewed: 2026-08-09

Current branch: `codex/icecold-sprint-core-workflow`

Current state: the local MVP changes are committed and synced with the remote feature branch. This checklist is intentionally uncommitted. Native.builder synchronization, public deployment verification, AI-provider behavior, and hackathon submission evidence remain outstanding.

## Completed local checkpoint — 2026-08-09

- [x] Added repeatable `npm.cmd run check` validation (`typecheck` plus production build).
- [x] Cleared stale quiz results when starting a new sprint or regenerating a plan.
- [x] Cleared stale quiz-topic navigation state when starting or regenerating a sprint.
- [x] Reused the shared topic-priority scorer for next-topic recommendations.
- [x] Preserved the plan-to-quiz handoff marker until persisted setup hydration is available, with a localStorage fallback for the topic lookup.
- [x] Made fallback quiz question and option ordering deterministic per topic.
- [x] Added a repeatable `npm.cmd run smoke` P0 workflow check for any local or deployed target URL.
- [x] Expanded the source-repository README with the workflow and local commands.
- [x] Confirmed `npm.cmd run check` passes locally after the current feature checkpoint.

## Preview checkpoint — 2026-08-09

- [x] Authenticated native.builder project workspace and preview were inspected.
- [x] Preview exposed and then cleared a real plan-to-quiz race: clicking `Start Quiz — Cell Biology` now reaches the first question and answer controls without reload.
- [x] Hardened the source implementation against persisted-setup and React StrictMode races; pushed commit `b7faf27` on `codex/icecold-sprint-core-workflow`.
- [x] Builder preview reached question 5 with `5/5 answered`, `Correct: 5`, and the `Finish Quiz` control visible.
- [ ] Native.builder is not yet confirmed to contain source commit `a23b4fa`; Builder's internal one-file repair is not GitHub-synced.
- [x] Builder publish control reported success for `https://icecold-sprint.nativelyai.app`.
- [ ] The named public URL still serves the old shell after publish.

## P0 — Publish a working submission

- [ ] Confirm the exact hackathon submission deadline and required form fields.
- [ ] Confirm that native.builder can sync this feature branch, or document the approved sync path.
- [ ] Sync the current application into the native.builder project.
- [x] Trigger Builder publish for the intended public URL.
- [ ] Confirm the intended public URL serves the functional workflow, not the old shell.
- [ ] Test the public app in a fresh, logged-out browser.
- [ ] Verify this complete path without manual recovery:
  - [ ] Choose the Biology sample sprint.
  - [ ] Set confidence, importance, and available study time.
  - [ ] Generate a plan that does not exceed the available time.
  - [ ] Open the recommended topic.
  - [ ] Complete five quiz questions.
  - [ ] Receive a score and useful feedback.
  - [ ] See a different next recommendation based on the result.
  - [ ] Refresh and confirm progress persists.
  - [ ] Reset and confirm the sprint returns to a clean state.
- [x] Record the public URL, verification date, browser, and result in the evidence repository.

### P0 source implementation gate

- [x] Biology sample sprint and editable confidence/importance/study-time setup are implemented.
- [x] Deterministic plan generation keeps scheduled time within the selected study budget.
- [x] Recommended-topic quiz opens with exactly five questions and answer explanations.
- [x] Score bands expose feedback and an adaptive next-topic/review action.
- [x] Progress and quiz results persist through refresh using localStorage.
- [x] Reset Sprint clears setup, plan, quiz results, and quiz handoff state.
- [x] `npm.cmd run smoke` covers the complete source workflow, refresh persistence, and reset behavior.
- [ ] Execute the smoke workflow against a fresh browser/public deployment; this remains external/runtime verification.

## P1 — Add one reliable AI capability

- [ ] Add one visible AI-assisted behavior through native.builder, preferably explanation or post-quiz feedback.
- [ ] Keep the deterministic quiz and recommendation path as the fallback.
- [ ] Keep provider credentials server-side and out of browser storage and source.
- [ ] Verify behavior when the provider is unavailable or returns invalid data.
- [ ] Record the actual provider, model, prompt purpose, and fallback behavior.

## P1 — Harden the user experience

- [ ] Remove remaining placeholder or misleading copy.
- [ ] Make the primary next action obvious on every screen.
- [ ] Verify mobile layout and narrow-screen navigation.
- [ ] Verify keyboard access for setup controls, quiz answers, and reset.
- [ ] Add clear empty, loading, error, and completed states.
- [ ] Ensure reset clears every persisted sprint, plan, quiz, score, and recommendation value.
- [ ] Confirm no API key, session token, or private builder data is exposed in the client bundle.

## P1 — Validation

- [x] Run `npx.cmd tsc --noEmit`.
- [x] Run `npm.cmd run build`.
- [ ] Manually test the complete flow locally with a fresh browser profile.
- [ ] Test insufficient study time, custom topics, repeated quiz attempts, refresh, and reset.
- [ ] Check the browser console for errors and failed network requests.
- [ ] Re-run the same checks against the published URL.

## P2 — Demo and submission package

- [ ] Capture screenshots of setup, generated plan, quiz, result, recommendation, and progress.
- [ ] Record a demo of no more than three minutes:
  - [ ] Problem and target student.
  - [ ] Setup and plan generation.
  - [ ] Quiz, score, and changed recommendation.
  - [ ] Persistence and reset.
  - [ ] Native.builder and tools disclosure.
- [ ] Prepare the project description and target-user statement.
- [ ] Describe exactly how native.builder was used.
- [ ] List all external APIs, models, datasets, libraries, and tools actually used.
- [ ] Confirm the app URL and native.builder project URL work for judges.
- [ ] Submit before the cutoff and save a copy of the final submission.

## P3 — Only after submission is safe

- [ ] Add more subject packs.
- [ ] Improve quiz variety and explanations.
- [ ] Add richer progress analytics.
- [ ] Add authentication or database persistence.
- [ ] Add automated end-to-end tests and CI.

## Stop conditions

- Do not add authentication, payments, social features, or a database before the public core flow is verified.
- Do not replace the deterministic fallback with an external model dependency.
- Do not claim AI integration, native.builder usage, or public readiness until each is verified.
- Do not merge this branch into `main` without explicit approval.
