# IceCold Sprint

IceCold Sprint is a focused study-planning MVP for students preparing for an exam with limited time. It turns topic confidence, exam importance, and available study time into a deterministic sprint plan, then uses short quizzes to update the next recommended action.

## Current workflow

1. Configure an exam or load the Biology sample sprint.
2. Add topics and rate confidence and importance.
3. Generate a time-bounded prioritized plan.
4. Take a five-question topic quiz.
5. See the score, explanations, progress, and next recommendation.
6. Refresh to restore local progress or reset the sprint to start again.

The current implementation uses localStorage and deterministic sample quiz data. Any future model integration must remain optional and preserve the deterministic fallback.

## Local development

```powershell
npm.cmd install
npm.cmd run dev
```

Run the local validation checkpoint with:

```powershell
npm.cmd run check
```

## Repository workflow

- Implementation source: this repository.
- Evidence and submission notes: the separate `icecold-sprint-docs` repository.
- Active implementation branch: `codex/icecold-sprint-core-workflow`.
- Keep `main` unchanged until the feature branch has been reviewed and the native.builder sync path is confirmed.
