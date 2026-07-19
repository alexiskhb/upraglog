# GitHub Issue Fix Strategy

Fetched from `https://github.com/alexiskhb/upraglog/issues` using
`.env.local::GITHUB_TOKEN`. GitHub issue bodies were empty when checked on
2026-07-19, so `Original issue text` records the exact issue title returned by
GitHub.

## Workflow

- Treat issues marked `Status: Unhandled` as available for implementation.
- When starting work, update the selected issue to `Status: In progress` if the
  work will span multiple turns or commits.
- After completing a fix, change the issue to `Status: Handled` and add a brief
  status note describing what changed, what was verified, and any remaining
  follow-up.
- After a handled issue has been responded to and closed on GitHub, change it to
  `Status: Closed`.

## Issue #1: When the 'Paste workout' list is large, the window overflows the screen boundaries

URL: https://github.com/alexiskhb/upraglog/issues/1

Original issue text: `When the 'Paste workout' list is large, the window overflows the screen boundaries`

Status: Handled

Status note:

- Updated `src/features/workout-navigation/AddExercisesDialog.tsx` so the Paste
  Workout dialog is a bounded flex column inside `calc(100dvh - 2rem)`.
- Kept the dialog shell from scrolling and made the paste textarea the bounded,
  scrollable region with fixed field sizing.
- Kept the Add button outside the textarea scroll area so it remains reachable
  when pasted workout text is large.
- Verified with `npm run lint` and `npm run build`. No browser checks were run,
  per `AGENTS.md`.

Relevant files:

- `src/features/workout-navigation/AddExercisesDialog.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/textarea.tsx`

Likely cause:

- `Textarea` defaults to `field-sizing-content`, which can size to pasted
  content.
- `AddExercisesDialog` tries to constrain the dialog with `max-h` and
  `overflow-y-auto`, but the textarea and grid layout are not explicitly given a
  bounded row/flex area. Large pasted content can still make the dialog awkward
  on small dynamic viewports.

Fix strategy:

- Make `DialogContent` in `AddExercisesDialog` an explicit bounded flex column:
  `max-h-[calc(100dvh-2rem)]`, `overflow-hidden`, and `gap-3`.
- Put the textarea in the only flexible scroll area with stable dimensions:
  `min-h-40`, `h-[min(50dvh,24rem)]` or `flex-1`, `max-h-full`, and
  `overflow-y-auto`.
- Keep the Add button footer outside the scrollable textarea area and pinned at
  the bottom of the dialog.
- Avoid relying on `field-sizing-content`; ensure the paste textarea uses fixed
  sizing even if the shared `Textarea` component defaults to content sizing.

Acceptance checks:

- Paste a very large CSV or assistant response into Paste Workout on a 320px
  wide mobile viewport.
- The dialog must remain inside the viewport, the textarea must scroll, and the
  Add button must remain reachable.
- Recheck desktop width to ensure the dialog still reads as a compact modal.

## Issue #2: Across the application, text inputs do not register immediately; user must tap outside the text area to apply changes before clicking buttons

URL: https://github.com/alexiskhb/upraglog/issues/2

Original issue text: `Across the application, text inputs do not register immediately; user must tap outside the text area to apply changes before clicking buttons`

Status: Handled

Status note:

- Updated `src/components/ui/input.tsx` and `src/components/ui/textarea.tsx`
  so native `input` events also drive React `onChange` handlers immediately,
  with a de-dupe fallback for normal React `change` events.
- Updated `src/features/training/NumericStepper.tsx`, which uses a bare
  `<input>`, to commit drafts from native `input` events as well as change
  events.
- Updated `src/features/settings/SettingsScreen.tsx` so spreadsheet export and
  share actions await the current "Last Months" draft before reading the export
  range.
- Kept blur autosave, but action buttons now use the committed draft value
  directly and stop cleanly when the draft is invalid.
- Verified with `npm run lint` and `npm run build`. No browser checks were run,
  per `AGENTS.md`.

Relevant files:

- `src/features/settings/SettingsScreen.tsx`
- `src/features/training/SetCommentDialog.tsx`
- `src/features/exercise-picker/AddEditExerciseScreen.tsx`
- `src/features/workout-navigation/AddExercisesDialog.tsx`

Likely cause:

- Some settings inputs store draft state locally and commit persisted settings
  only on `onBlur`.
- Button handlers such as spreadsheet export and share read from persisted
  `settings`, so tapping an action while an input is focused can run the action
  before the blur-driven save has completed.
- The spreadsheet month limit is the clearest current example:
  `spreadsheetMonthLimitDraft` saves on blur, while `exportSpreadsheet` and
  `shareSpreadsheet` read `settings.spreadsheetExportMonthLimit`.

Fix strategy:

- Do not rely on blur as the only commit path for inputs that affect an action.
- Add a small SettingsScreen helper that normalizes and saves pending
  spreadsheet draft values, returns the committed value, and is awaited by
  `exportSpreadsheet` and `shareSpreadsheet`.
- Prefer form submit handlers or action-local draft normalization for simple
  add/save flows. Button handlers should use current React draft state directly
  when possible.
- Keep `onBlur` as a convenience autosave, but make the action path authoritative.
- After fixing the known settings case, audit other button-plus-input flows:
  profile add, comment template add, set comment save, exercise add/edit, and
  paste workout import.

Acceptance checks:

- Change the spreadsheet range field and immediately tap Download Spreadsheet.
  The exported CSV must use the newly typed value.
- Change the spreadsheet share message and immediately tap Share. The shared
  message must include the newly typed text.
- Repeat on mobile Safari or a mobile viewport where tapping a button dismisses
  the keyboard.

## Issue #3: Change 'LAST MONTHS' spreadsheet export option to be set in days

URL: https://github.com/alexiskhb/upraglog/issues/3

Original issue text: `Change 'LAST MONTHS' spreadsheet export option to be set in days`

Status: Handled

Status note:

- Replaced the persisted spreadsheet range setting with
  `spreadsheetExportDayLimit` across settings state, backup export/import
  validation, CSV export, and share export.
- Preserved old settings and backup compatibility by normalizing legacy
  `spreadsheetExportMonthLimit` values to days using `monthLimit * 30`.
- Updated the Settings UI from "Last Months" to "Last Days"; disabling "Export
  All History" now defaults to `90` days.
- Made the CSV range inclusive, so a day limit of `1` exports only workouts on
  the current local day.
- Verified with `npm run lint` and `npm run build`. No browser checks were run,
  per `AGENTS.md`.

Relevant files:

- `src/db/schema.ts`
- `src/shared/model/settings.ts`
- `src/features/settings/SettingsScreen.tsx`
- `src/features/backup/exportTrainingLogCsv.ts`
- `src/features/backup/backupValidation.ts`
- `src/features/backup/exportJson.ts`
- `src/features/backup/importJson.ts`

Current behavior:

- Settings persist `spreadsheetExportMonthLimit`.
- CSV export receives `monthLimit` and computes the cutoff with `subMonths`.
- The UI label is "Last Months" and the disabled placeholder is "All".

Fix strategy:

- Introduce a day-based setting, preferably `spreadsheetExportDayLimit`.
- Preserve backward compatibility by accepting old backups and IndexedDB rows
  with `spreadsheetExportMonthLimit`; normalize them to days during settings
  load. A conservative conversion is `monthLimit * 30`.
- Consider a Dexie version upgrade if the stored settings shape should be
  rewritten immediately. If not, `normalizeSettings` can bridge old data and
  `updateSettings` can write the new field the next time settings are saved.
- Update `backupValidation` so both old and new backup files parse, but export
  new backups with the day-based field.
- Rename UI state and helpers from month to day terminology:
  `spreadsheetDayLimitDraft`, `saveSpreadsheetDayLimit`, "Last Days", and
  "Enter a day count greater than 0."
- Replace `subMonths` with `subDays` in `exportTrainingLogCsv`.
- When the user turns off "Export All History", default to `90` days to preserve
  the old 3-month intent.

Acceptance checks:

- Existing users with `spreadsheetExportMonthLimit: 3` should effectively export
  the last 90 days after the update.
- New JSON backups should contain the day-based setting.
- Old JSON backups with only the month-based setting should restore correctly.
- CSV export should include workouts on or after today minus the configured
  number of days.

## Issue #4: Allow users to add the same exercise multiple times within a single workout

URL: https://github.com/alexiskhb/upraglog/issues/4

Original issue text: `Allow users to add the same exercise multiple times within a single workout`

Status: Handled

Status note:

- Updated `src/db/repositories/workoutsRepo.ts` so adding an exercise creates a
  fresh `WorkoutExercise` instance instead of returning an existing row with the
  same catalog `exerciseId`.
- Updated `src/features/exercise-picker/ExercisePickerScreen.tsx` to use the
  explicit fresh-instance helper, allowing the same exercise to be selected
  multiple times for one workout.
- Updated `src/features/workout-navigation/importWorkoutRoutineCsv.ts` so
  adjacent pasted routine rows for the same exercise still share one imported
  workout-exercise instance and become multiple sets.
- Verified with `npm run lint` and `npm run build`. No browser checks were run,
  per `AGENTS.md`.

Relevant files:

- `src/db/repositories/workoutsRepo.ts`
- `src/features/exercise-picker/ExercisePickerScreen.tsx`
- `src/features/workout-navigation/importWorkoutRoutineCsv.ts`
- `src/features/workout-navigation/WorkoutNavigationPanel.tsx`
- `src/features/workout-log/HomeScreen.tsx`
- `src/features/backup/exportTrainingLogCsv.ts`

Current behavior:

- The schema already supports duplicate exercise instances because
  `WorkoutExercise.id` is the row identity and `exerciseId` is only a catalog
  reference.
- `addExerciseToDate` currently blocks duplicates by looking for an existing
  row with the same `workoutId` and `exerciseId`, then returning it.

Fix strategy:

- Split the repository behavior so the intent is explicit:
  - `addExerciseToDate` or a new `addWorkoutExerciseInstanceToDate` always
    creates a new workout-exercise row.
  - A separate helper can find an existing row when a caller really wants to add
    sets to an existing instance.
- Update `ExercisePickerScreen.selectExercise` to create a fresh instance when
  not in replacement mode.
- Preserve paste-workout semantics in `importWorkoutRoutineCsvToDate`. Today it
  relies on de-duping so repeated CSV rows for the same exercise become multiple
  sets on one exercise. Do not accidentally turn every repeated set row into a
  duplicate exercise instance. Group routine rows intentionally, likely by
  contiguous exercise name or by an explicit importer-local current instance.
- Check all rendering keys. Most UI lists already use `workoutExercise.id`, which
  is correct for duplicates.
- Consider displaying a subtle instance marker in workout navigation only if two
  adjacent rows have the same exercise name. Avoid changing exported exercise
  names unless the user needs a distinct instance label.

Acceptance checks:

- Add "Barbell Bench Press" twice on the same date through the picker. Two rows
  should appear in the workout list and home screen.
- Add sets to each duplicate instance and confirm they remain separate.
- Replace one duplicate instance and confirm the other stays unchanged.
- Paste a normal CSV routine with multiple set rows for one exercise and confirm
  it still creates one exercise row with multiple sets.
- Export CSV and JSON, then restore JSON, and confirm duplicate instances are
  preserved.

## Issue #5: Add a warning prompt when 'Import JSON' or 'Restore from Drive' will overwrite or erase existing workout history

URL: https://github.com/alexiskhb/upraglog/issues/5

Original issue text: `Add a warning prompt when 'Import JSON' or 'Restore from Drive' will overwrite or erase existing workout history`

Status: Unhandled

Relevant files:

- `src/features/settings/SettingsScreen.tsx`
- `src/features/backup/importJson.ts`
- `src/features/backup/googleDriveBackup.ts`
- `src/features/backup/backupTypes.ts`
- `src/components/ui/alert-dialog.tsx`

Current behavior:

- `restoreBackup` clears exercises, categories, workouts, workout exercises,
  sets, and settings before importing backup data.
- Restore From Drive has a basic `window.confirm`.
- Import JSON runs after file selection with no warning.

Fix strategy:

- Add a reusable destructive-restore confirmation flow in `SettingsScreen` using
  the existing `AlertDialog` components rather than `window.confirm`.
- Parse the selected JSON file first, store it as pending restore state, and show
  a confirmation dialog before calling `restoreBackup`.
- Split Drive restore into fetch/parse and apply steps. For example,
  `loadBackupFromGoogleDrive` can return `{ backup, fileName }`, while
  `restoreBackup` is called only after the user confirms.
- Make the prompt specific: restoring will replace local exercises, profiles,
  workouts, sets, and settings. Include counts when cheap to compute, such as
  current workout count and imported workout count.
- Disable destructive restore buttons while a restore is pending or in progress.
- Always reset the hidden file input after confirm or cancel so selecting the
  same file again re-triggers `onChange`.

Acceptance checks:

- Selecting Import JSON with existing data opens a warning before any local data
  is cleared.
- Canceling the warning leaves all data unchanged.
- Confirming imports the backup and refreshes settings/profile state.
- Restore From Drive shows an equivalent warning after the Drive file is found
  and before local tables are cleared.

## Issue #6: Automatically advance to the next exercise when the last set of the current exercise is checked

URL: https://github.com/alexiskhb/upraglog/issues/6

Original issue text: `Automatically advance to the next exercise when the last set of the current exercise is checked`

Status: Unhandled

Relevant files:

- `src/features/training/TrainingScreen.tsx`
- `src/features/training/SetRow.tsx`
- `src/db/repositories/workoutsRepo.ts`

Current behavior:

- The double-tap next action already starts the timer, checks the next
  unfinished set, and advances when that check finishes the exercise.
- Directly tapping a set checkbox calls `updateSetFinishedRow`, then refreshes
  detail in place.

Fix strategy:

- Reuse the double-tap next action logic for manual checkbox checks, but only
  when `finished === true`.
- Before calling `updateSetFinished`, determine whether the checked set is the
  last unfinished set in the current exercise:
  `detail.sets.every((set) => set.finishedAt || set.id === setId)`.
- After the update, if the current exercise became finished, navigate to the
  next workout exercise using the pre-update order from `detail.workoutExerciseIds`.
- If there is no next exercise, refresh in place.
- Do not auto-advance when unchecking a set, when editing an already finished
  set, or when the checkbox event originated from an outdated detail snapshot.
- Be mindful of auto-sort. The current double-tap path navigates based on the
  pre-sort order and then bumps refresh; matching that behavior will keep the
  experience consistent.

Acceptance checks:

- In a workout with at least two exercises, checking the final unfinished set in
  exercise 1 navigates to exercise 2.
- Checking a non-final set does not navigate.
- Unchecking a finished set does not navigate.
- The behavior still works with auto-sort enabled and disabled.

## Issue #7: Shift "Set Comment" popup position upward

URL: https://github.com/alexiskhb/upraglog/issues/7

Original issue text: `Shift "Set Comment" popup position upward`

Status: Unhandled

Relevant files:

- `src/features/training/SetCommentDialog.tsx`
- `src/components/ui/dialog.tsx`

Current behavior:

- `SetCommentDialog` uses the shared centered `DialogContent`, which places it
  at `top-1/2` with vertical translation.

Fix strategy:

- Override the comment dialog position in `SetCommentDialog` rather than
  changing all dialogs.
- On small screens, use an upper viewport position such as `top-4` or
  `top-[18dvh]` with `translate-y-0`.
- Keep a reasonable desktop position, for example `sm:top-[42%]` with
  `sm:-translate-y-1/2`, if centered desktop dialogs still feel right.
- Add `max-h-[calc(100dvh-2rem)]` and `overflow-y-auto` so templates plus input
  do not overflow when the keyboard is visible.
- Verify that the close button and Save/Clear actions remain reachable.

Acceptance checks:

- Open a set comment on a mobile viewport. The dialog should appear noticeably
  above vertical center.
- Focus the input so the virtual keyboard would appear. The input and Save
  action should remain visible or reachable by scrolling.
- Template chips should scroll horizontally without widening the dialog.

## Suggested implementation order

1. Fix #2 first because it affects user trust across settings/actions.
2. Fix #5 next because it protects data.
3. Fix #4 with care because it touches workout identity semantics and paste
   imports.
4. Fix #6 after #4 so next-exercise navigation is tested with duplicate
   instances.
5. Fix #3 with compatibility work for settings and backups.
6. Fix #1 and #7 together as dialog viewport polish.

## Verification checklist

- Run `npm run lint`.
- Run `npm run build`.
- Manually test at 320px wide and desktop widths.
- For data-shape changes, test JSON export/import round trips and old backup
  restore compatibility.
- For GitHub follow-up, do not print tokens. Use the local `GITHUB_TOKEN` only
  through environment variables or request headers.
