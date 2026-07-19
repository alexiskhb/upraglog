# AGENTS.md

Guidance for LLMs and automated coding agents working in this repository.

## Project Shape

- `upraglog` is a local-first gym workout log built with Vite, React,
  TypeScript, Tailwind CSS, Radix/shadcn UI components, Dexie IndexedDB,
  Zustand, and TanStack Router.
- Routes live in `src/app/router.tsx`; app-level shell behavior lives in
  `src/app/AppShell.tsx`.
- Feature screens live under `src/features/*`.
- IndexedDB schema and seed data live in `src/db/db.ts`; shared TypeScript data
  types live in `src/db/schema.ts`.
- Database access should go through `src/db/repositories/*` unless a new
  repository-level helper is warranted.
- Shared domain helpers live in `src/shared/model/*`; shared UI primitives live
  in `src/shared/ui/*`; shadcn-style primitives live in `src/components/ui/*`.

## Commands

- Install dependencies with `npm install`.
- Run local development with `npm run dev`.
- Check code with `npm run lint`.
- Verify production output with `npm run build`.
- GitHub Pages-specific builds use `npm run build:pages` and
  `npm run preview:pages`.

## Data Model Rules

- `Exercise.id` is the catalog exercise name/identity.
- `WorkoutExercise.id` is the workout instance identity. Sets belong to
  `workoutExerciseId`, not directly to `exerciseId`.
- Duplicate exercise instances in one workout should be represented by multiple
  `WorkoutExercise` rows that reference the same `exerciseId`.
- When changing persisted settings, update all of these together:
  `src/db/schema.ts`, `src/shared/model/settings.ts`, backup validation,
  backup export/import behavior, and any settings UI drafts.
- Keep old backups and old IndexedDB settings compatible when renaming or
  replacing persisted fields. Normalize old shapes instead of breaking restore.
- Dexie schema changes belong in `src/db/db.ts` as a new versioned upgrade when
  stored table/index shape changes. Pure normalization can often stay in
  `normalizeSettings`.

## UI Rules

- The app is compact, mobile-first, dark, and task-focused. Keep screens dense
  but readable; avoid marketing-style sections.
- Maintain support for 320px wide mobile viewports.
- Dialogs and bottom sheets must use dynamic viewport constraints such as
  `dvh`, bounded `max-h`, and explicit scroll regions so virtual keyboards and
  long content do not push actions off-screen.
- Use existing `ActionButton`, `IconButton`, shadcn/Radix primitives, and
  lucide-react icons where they already fit.
- Keep list keys tied to stable instance ids such as `workoutExercise.id` or
  `set.id`, not display labels.
- Do not rely on `onBlur` as the only way to commit input that affects a nearby
  action button. Action handlers should commit or read the current draft value
  directly.

## Security And Secrets

- Do not print `.env.local` or secret values.
- `.env.local::GITHUB_TOKEN` may be used for GitHub API access when needed, but
  keep it in the environment or request headers and never commit it.
- If network access is sandboxed, request approval before retrying the GitHub
  API call.

## Git And Editing

- Preserve user changes in the working tree. Do not reset, checkout, or revert
  unrelated work unless the user explicitly asks.
- Prefer focused changes that follow existing feature and repository boundaries.
- Use `rg` for searching.
- Keep comments sparse and useful; avoid narrating obvious code.

## Verification

- Run `npm run lint` and `npm run build` before handing off code changes when
  feasible.
- For workout flow changes, manually test home, picker, workout navigation,
  training screen, backup/export settings, and JSON restore.
- Don't run browser checks.


## Issues

When asked to work on issues, select an open, unhandled issue from `ISSUE_STRATEGY.md` and implement the fix. After completing the work, update the corresponding entry in `ISSUE_STRATEGY.md` with a brief status note describing what was done and any remaining work.

If `ISSUE_STRATEGY.md` contains no unhandled issues, fetch open issues from `https://github.com/alexiskhb/upraglog/issues` that are not already documented in the file. Use the GitHub token from `.env.local` under `GITHUB_TOKEN`, then add a proposed implementation strategy for each newly discovered issue to `ISSUE_STRATEGY.md`.

When asked to respond to issues, review the open issues at `https://github.com/alexiskhb/upraglog/issues` and identify those that are already marked as handled in `ISSUE_STRATEGY.md`. Post an appropriate response to each matching issue and close it when the implemented work fully resolves it.
