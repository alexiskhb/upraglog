# upraglog

`upraglog` is a frontend-only gym workout log web application focused on simple, fast, clean workout tracking.

The app is inspired by FitNotes: minimal, utilitarian, dark-themed, and optimized for low-friction logging during a gym session.

`upraglog` is a local-first Progressive Web App. Workout data is stored locally in IndexedDB. Google Drive can be used for optional backup, restore, import, export, or future sync. The app must remain usable offline.

## Product Goals

Build a practical workout logbook, not a social fitness app.

The app should prioritize:

* fast workout logging
* low-friction set entry
* clear workout history for each calendar date
* simple exercise management
* offline-first behavior
* readable mobile-first UI
* persistent bottom navigation
* dark theme only

Do not include:

* social feed
* gamification
* achievements
* badges
* personal-record trophy UI
* routine builder
* light theme
* backend accounts
* server-side database
* analytics
* monetization
* complex dashboards

## Overall Product Feel

* Minimal, utilitarian, fast workout logger.
* Prioritize low-friction data entry during a gym session.
* Always dark themed.
* Dark charcoal/black main surfaces.
* Accent color: cyan/teal-blue for selected controls, dividers, arrows, highlights, active states, and future graph points if graphs are added later.
* Typography: simple sans-serif, medium-small UI text, no decorative styling.
* Layout should feel like a practical logbook rather than a social fitness app.
* Keep primary actions and frequent buttons in the lower half of the screen where practical.
* No social feed, gamification, achievements, badges, or personal-record/trophy UI for now.

## Core Navigation

The main entry screen is the workout log for the selected date.

The app always uses the same persistent bottom main bar.

The bottom main bar appears on:

* Home / Daily Workout Log
* Training Screen
* Exercise Picker
* Add/Edit Exercise
* Calendar
* Body Tracker
* Settings

Do not use a separate top app bar for now.

Do not use a secondary screen-specific toolbar for now.

The bottom main bar contains:

* Choose Profile icon
* Calendar icon
* Workout List / Navigation icon
* Plus/Add icon
* Overflow menu icon

Behavior:

* The Choose Profile icon is reserved for local profile selection or a simple profile-related menu.
* The Calendar icon opens the Calendar screen.
* The Workout List / Navigation icon opens the Workout Navigation Panel.
* The Plus/Add icon opens the Exercise Picker.
* The Overflow menu contains secondary actions such as:

  * Settings
  * Body Tracker
  * Time Workout
  * Share Workout
  * Copy/Move Workout

Screen content changes above the persistent bottom bar.

## Home / Daily Workout Log

### Purpose

Show the workout for one calendar day.

Allow the user to quickly add exercises, inspect sets, and jump to past/future dates.

### Date Navigation

At the top of the content area, show a date/navigation row.

The date row has:

* left chevron for previous day
* centered date label, usually `TODAY`
* right chevron for next day

User can swipe horizontally between days.

Tapping a date in Calendar opens the Home screen for that workout date.

### Empty State

If no workout exists for the selected date:

* show a central action: `Start New Workout`
* show an optional secondary action: `Copy Previous Workout`
* keep the screen sparse

Behavior:

* `Start New Workout` opens the Exercise Picker.
* Selecting the first exercise creates the workout for the selected date.

### Workout State

Display a vertical list of exercise cards.

Each exercise card contains:

* dark surface card on a darker background
* exercise name at top-left, for example `Flat Barbell Bench Press`
* thin cyan divider under the exercise name
* set rows below, with values aligned in columns
* tapping an exercise opens the Training Screen for that exercise

Example set row format:

```txt
80.0 kgs       5 reps
```

### Home Screen Visual Example

```txt
[‹]                         TODAY                         [›]

Card:
  Flat Barbell Bench Press
  ─────────────────────────
              80.0 kgs       5 reps
             100.0 kgs       5 reps
             120.0 kgs       5 reps

Card:
  Incline Barbell Bench Press
  ─────────────────────────
              60.0 kgs      12 reps
              70.0 kgs      12 reps
              80.0 kgs      12 reps

Persistent bottom main bar:
[profile] [calendar] [workout list] [+] [⋮]
```

## Training Screen / Exercise Logging

### Purpose

Log sets for a single exercise.

Show current workout sets for that exercise.

For the MVP, this is only the Track screen.

Do not implement History or Graph tabs for the Training Screen yet.

### Navigation

The Training Screen uses the same persistent bottom main bar.

Do not add a separate top app bar.

The current exercise name should be shown near the top of the content area.

### Layout

Input fields are placed in the upper/middle part of the content area.

Frequent action buttons should be easy to reach, preferably in the middle/lower half of the screen.

### Exercise Input Types

For strength exercises:

* weight, kg/lbs
* reps

For cardio exercises:

* distance
* time

Advanced exercise types may use combinations such as:

* weight/time
* reps/time
* reps only
* time only
* distance/time

Each numeric field has:

* label above the field
* minus button on the left
* large numeric value in the center
* plus button on the right

### Buttons

Below the input fields:

* primary action button: `SAVE`
* secondary action button: `CLEAR`

Button styles:

* `SAVE`: teal/green positive action
* `UPDATE`: teal/green positive action
* `CLEAR`: blue or neutral secondary action
* `DELETE`: red destructive action

Buttons should be rectangular, flat, and Material-style.

### Set List

Below the buttons, show the list of sets recorded for this exercise in the current workout.

Each set row shows:

* optional comment icon at far left
* set number
* weight/distance/time value
* reps/time value

Example:

```txt
[comment icon]  1     60.0 kgs      5 reps
[comment icon]  2     80.0 kgs      5 reps
[comment icon]  3    100.0 kgs      5 reps
```

### Set Selection

Tapping a set selects it.

When a set is selected:

* selected row becomes highlighted
* input fields populate with that set’s values
* `SAVE` changes to `UPDATE`
* `CLEAR` changes to `DELETE`
* `UPDATE` saves changes to the selected set
* `DELETE` removes the selected set and is styled red

Long-press and drag can reorder sets.

### Training Screen Visual Example

```txt
Flat Barbell Bench Press

WEIGHT (kgs)
     [-]      102.5      [+]

REPS
     [-]        5        [+]

[SAVE] [CLEAR]

Set list:
    1       60.0 kgs      5 reps
    2       80.0 kgs      5 reps
    3      100.0 kgs      5 reps
    4      102.5 kgs      5 reps

Persistent bottom main bar:
[profile] [calendar] [workout list] [+] [⋮]
```

## Exercise Picker

### Purpose

Select an exercise to add to the current workout.

Manage the exercise database.

### Entry Points

The Exercise Picker is opened by:

* tapping the Plus/Add icon on the bottom main bar
* tapping `Start New Workout` from the empty Home state
* tapping `Add Exercise` from the Workout Navigation Panel

### Behavior

Exercise Picker opens with global exercise search focused.

Keyboard opens automatically on mobile where possible.

Categories are shown below the search field as shortcuts.

Search filters all exercises globally by partial or fuzzy terms.

Example:

```txt
dum press
```

should match:

```txt
Incline Dumbbell Press
```

### Category Shortcuts

Default categories:

* Chest
* Back
* Legs
* Shoulders
* Biceps
* Triceps
* Abs
* Cardio
* Favorites, if any exercises are favorited

### Category Behavior

Tapping a category filters the exercise list to that category.

The search field remains visible.

User can clear the category filter and return to global search.

### Exercise Rows

Each exercise row shows:

* exercise name
* optional details such as workout count or last used date
* optional favorite star
* overflow/menu icon for row actions

Exercise row actions:

* Edit
* Delete
* Favorite / Unfavorite
* View exercise info, if implemented

### Favorite Exercises

Favorite exercises show a blue/cyan star.

The Favorites category appears only if there are favorited exercises.

### Create Exercise

The Plus/Add button inside Exercise Picker allows creating a new exercise.

Add/Edit Exercise screen uses the same persistent bottom main bar.

### Adding Exercise to Workout

Tapping an exercise adds it to the selected date’s workout.

If this is the first selected exercise for that date, it creates the workout.

After selecting an exercise, open the Training Screen for that exercise.

## Workout Navigation Panel

### Purpose

Quickly jump between exercises in the current workout.

Manage exercises already added to the selected workout.

### Behavior

Open by tapping the Workout List / Navigation icon in the persistent bottom main bar.

The panel may appear as a drawer, bottom sheet, or full-height panel.

It lists exercises already in the current workout.

Each row shows:

* exercise name
* number of sets recorded
* optional drag handle
* overflow menu for advanced actions

### Actions

The panel supports:

* tap exercise to open its Training Screen
* drag to reorder workout exercises
* add exercise
* delete exercise from workout
* replace exercise
* close panel and return to Home

## Set Comments

### Purpose

Attach notes to individual sets.

### Behavior

Each set can have a comment.

A comment icon appears next to the set.

Comment icon states:

* empty comment icon is gray
* existing comment icon is blue/cyan

Tapping the icon opens the Set Comment dialog.

### Comment Content

Comments can store:

* rest taken
* form notes
* machine settings
* spotter/assistance notes
* injury/discomfort notes

Comments are visible from the current workout set list.

Comments should be preserved in workout history data even if no history UI is implemented yet.

## Workout Timer

### Entry Point

Bottom main bar overflow menu -> `Time Workout`

### Allows

* Start Timer
* Stop Timer
* Manual start time
* Manual end time
* Auto-calculated duration

### Behavior

Saved workout duration appears wherever workout details are shown.

While a workout timer is active, show the duration in-app where practical.

Browser or system notifications may be used only where supported, but the app must not depend on them.

## Calendar

### Purpose

Let the user choose a workout date.

### Entry Point

Tap Calendar icon in the persistent bottom main bar.

### Behavior

Calendar opens a clear month-style view.

Dates with logged workouts should be visually marked.

Tapping a date opens the Home screen for that workout date.

Do not implement a separate Calendar List View for now.

## Body Tracker

### Purpose

Let the user track body measurements.

### Entry Point

Bottom main bar overflow menu -> `Body Tracker`

### Possible Measurements

* Body weight
* Body fat percentage
* Waist
* Chest
* Arms
* Legs
* Custom measurements

### Behavior

Body Tracker uses the same persistent bottom main bar.

It allows adding a measurement for a selected date.

It shows recent measurement entries.

Keep the UI simple and dark themed.

## Settings

### Entry Point

Bottom main bar overflow menu -> `Settings`

### General Settings

* Unit System:

  * Metric / kg
  * Imperial / lbs
* Keep Screen On:

  * Prevent screen sleeping while Training Screen is open, where supported by the browser.

### Do Not Include

* light theme setting
* theme selector
* social features
* routine settings for now

## Visual Components

### Persistent Bottom Main Bar

Always visible on main screens.

Appearance:

* dark charcoal/black background
* white icons
* active/selected icon uses cyan/teal-blue

Contains:

* Choose Profile
* Calendar
* Workout List / Navigation
* Plus/Add
* Overflow vertical dots

### Content Background

* Dark theme only.
* Main background: near-black or dark charcoal.
* Cards and panels: slightly lighter dark surface.
* Text: white or light gray.
* Secondary text: medium gray.
* Dividers and highlights: cyan/teal-blue where emphasis is needed.

### Date / Navigation Row

* Dark background.
* Centered uppercase date label.
* Cyan left/right chevrons.
* Thin cyan divider below.

### Cards

* Dark surface card.
* Slight shadow or flat separation.
* Subtle margins.
* Cyan horizontal rule under exercise title.
* White/light text.

### Buttons

* Rectangular filled buttons.
* All-caps labels.
* `SAVE` / `UPDATE`: teal/green positive action.
* `CLEAR`: blue or neutral secondary action.
* `DELETE`: red destructive action.

### Forms

* Thin cyan underline text fields.
* Numeric values large and centered.
* Plus/minus square buttons.
* Labels uppercase or small caps.

### Icons

Use simple line icons.

Needed icons:

* Calendar
* Plus
* Overflow vertical dots
* Timer/stopwatch
* Comment bubble
* Star
* Checkbox
* Drag handle
* Chevron arrows
* Workout list / navigation icon
* Profile icon

Do not include:

* Trophy icon
* Personal record icon
* Achievement icon
* Routine icon for now

## MVP Screen List

1. Home / Daily Workout Log
2. Exercise Picker with Global Search and Category Shortcuts
3. Add/Edit Exercise
4. Training Screen / Track Screen
5. Workout Navigation Panel
6. Calendar
7. Body Tracker
8. Settings
9. Share Workout dialog
10. Copy/Move Workout dialog
11. Workout Timer dialog
12. Set Comment dialog

## Technical Stack and Implementation Instructions

Use the following stack unless explicitly instructed otherwise:

* Vite
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Radix UI primitives
* Dexie with IndexedDB
* Zustand
* TanStack Router
* Fuse.js
* dnd-kit
* lucide-react
* Zod
* vite-plugin-pwa
* Google Drive API for optional backup/restore/sync

This is a frontend-only, local-first Progressive Web App.

Do not introduce:

* backend
* database server
* Next.js server features
* authentication server
* REST API
* GraphQL API
* cloud database

unless explicitly requested.

The app should be optimized for mobile-first use during a gym session. Prioritize fast data entry, low friction, readable dark UI, and minimal navigation.

## Architecture Principles

Use IndexedDB through Dexie as the primary persistent storage.

Use Google Drive only for backup, restore, import, export, or optional sync.

Do not make Google Drive the live database.

The app must remain usable offline.

Do not use cookies as the primary data store. Cookies may only be used for tiny nonessential browser preferences if there is a strong reason.

Use Zustand only for temporary UI/application state, such as:

* selected date
* currently open dialog
* active bottom navigation item
* temporary form state if needed
* sync status
* selected set or exercise UI state

Do not use Zustand as the main durable database.

Use React local state for small component-level input state.

Use TypeScript strictly.

Prefer explicit domain types for:

* workouts
* exercises
* sets
* comments
* body measurements
* settings
* backup files

Avoid `any` unless there is a strong reason. If unavoidable, isolate it at API boundaries.

## Routing

Use TanStack Router.

Recommended routes:

```txt
/day/:date
/training/:workoutExerciseId
/picker
/exercise/new
/exercise/:exerciseId/edit
/calendar
/body
/settings
```

Use query/search params for temporary UI overlays where appropriate:

```txt
/day/:date?panel=workout-nav
/training/:workoutExerciseId?dialog=set-comment&setId=...
/day/:date?dialog=timer
```

Keep the persistent bottom main bar visible on all main screens.

Do not create a separate top app bar unless explicitly requested.

## Data Model Guidelines

Use stable string IDs, preferably generated UUIDs.

Store workout dates as local date strings in `YYYY-MM-DD` format.

Do not store workout dates as UTC midnight `Date` objects.

Use timestamps such as `createdAt` and `updatedAt` as ISO strings.

Recommended core entities:

```ts
type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'abs'
  | 'cardio'
  | 'custom'

type ExerciseType =
  | 'strength'
  | 'cardio'
  | 'weight_time'
  | 'reps_time'
  | 'reps_only'
  | 'time_only'
  | 'distance_time'

type Exercise = {
  id: string
  name: string
  category: ExerciseCategory
  exerciseType: ExerciseType
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

type Workout = {
  id: string
  localDate: string
  startedAt?: string
  endedAt?: string
  createdAt: string
  updatedAt: string
}

type WorkoutExercise = {
  id: string
  workoutId: string
  exerciseId: string
  order: number
  createdAt: string
  updatedAt: string
}

type SetEntry = {
  id: string
  workoutExerciseId: string
  order: number
  weight?: number
  reps?: number
  distance?: number
  durationSeconds?: number
  comment?: string
  createdAt: string
  updatedAt: string
}

type BodyMeasurementEntry = {
  id: string
  localDate: string
  measurementType: string
  value: number
  unit: string
  createdAt: string
  updatedAt: string
}

type AppSettings = {
  unitSystem: 'metric' | 'imperial'
  keepScreenOnDuringTraining: boolean
}
```

The schema may evolve, but keep it simple and normalized enough that workouts, exercises, and set history are not duplicated unnecessarily.

## Storage Rules

Use Dexie repositories or service modules instead of calling Dexie directly from every component.

Prefer this structure:

```txt
src/db/db.ts
src/db/schema.ts
src/db/repositories/workoutsRepo.ts
src/db/repositories/exercisesRepo.ts
src/db/repositories/bodyMeasurementsRepo.ts
src/db/repositories/settingsRepo.ts
```

Components should call domain-level functions, not raw database queries.

Good:

```ts
await addSetToWorkoutExercise(workoutExerciseId, input)
```

Avoid this inside UI components:

```ts
await db.sets.add(...)
```

## UI and Styling

Use Tailwind CSS for styling.

Use shadcn/ui and Radix primitives for accessible UI building blocks such as:

* Dialog
* AlertDialog
* DropdownMenu
* Sheet / Drawer
* Button
* Input
* Switch

Do not let shadcn default styling dominate the product feel.

Customize components to match the app’s dark, utilitarian workout-log design.

The app is always dark themed.

Do not implement light mode or theme switching.

Use a small internal design system with reusable components:

```txt
ScreenContainer
BottomMainBar
DateNavRow
ExerciseCard
SetRow
NumericStepper
ActionButton
IconButton
WorkoutNavigationPanel
SetCommentDialog
```

Use lucide-react for icons.

The UI should feel like a practical logbook, not a social fitness app or dashboard.

Avoid:

* gradients
* decorative animations
* achievement badges
* trophy icons
* social feed UI
* overly large cards
* excessive whitespace
* complex dashboard layouts

## Interaction Rules

The bottom main bar must be persistent across main screens.

The Plus/Add icon should open the Exercise Picker.

The Calendar icon should open the Calendar screen.

The Workout List / Navigation icon should open the Workout Navigation Panel.

The Overflow icon should contain secondary actions such as:

* Settings
* Body Tracker
* Time Workout
* Share Workout
* Copy/Move Workout

Frequent workout actions should be reachable in the middle or lower half of the screen when practical.

The Training Screen should focus on one exercise at a time.

For numeric input, use a `NumericStepper` component with:

* label
* minus button
* large centered value
* plus button

## Exercise Search

Use Fuse.js for global exercise search.

Search should support partial/fuzzy matching.

Example:

```txt
dum press
```

should match:

```txt
Incline Dumbbell Press
```

Exercise Picker behavior:

* open with search focused
* show keyboard automatically on mobile where possible
* show category shortcuts below search
* allow filtering by category
* allow clearing category filter
* allow favoriting exercises
* show Favorites category only if favorites exist

## Drag and Reordering

Use dnd-kit for:

* reordering exercises in a workout
* reordering sets inside an exercise

Keep drag-and-drop optional for basic use.

The app should still work through simple tap actions.

## PWA and Offline Behavior

Use vite-plugin-pwa.

The app should work offline.

Local workout logging must never depend on network access.

Google Drive backup/sync should be resilient:

* manual backup should be supported
* backup failures should not break workout logging
* show sync/backup status simply
* avoid aggressive automatic sync during active workout logging

## Google Drive Backup

Use Google Drive API only for backup, export, import, restore, and optional future sync.

Do not design Google Drive as a row-level database.

Prefer storing app backup data in the app-specific Google Drive app data folder if appropriate.

Backup format should be JSON.

Recommended backup structure:

```ts
type BackupFile = {
  app: 'upraglog'
  version: number
  exportedAt: string
  data: {
    exercises: Exercise[]
    workouts: Workout[]
    workoutExercises: WorkoutExercise[]
    sets: SetEntry[]
    bodyMeasurements: BodyMeasurementEntry[]
    settings: AppSettings
  }
}
```

For MVP, prefer explicit actions:

* Export backup
* Import backup
* Backup to Google Drive
* Restore from Google Drive

Automatic sync can be added later.

## Share Workout

Share Workout should be implemented as a simple frontend-only dialog.

Possible MVP options:

* copy workout summary as text
* use Web Share API where supported
* export selected workout as JSON

Do not require a backend for sharing.

## Copy / Move Workout

Copy/Move Workout should be implemented as a local operation over IndexedDB data.

The dialog should allow:

* selecting source workout date
* selecting target workout date
* copying workout exercises and sets
* moving workout data from one date to another

Do not overwrite existing target-date workout data without confirmation.

## Code Style

Use small, focused components.

Prefer composition over large monolithic screens.

Separate:

* domain types
* database access
* UI components
* feature screens
* utility functions

Use clear names rather than clever abstractions.

Avoid premature abstraction.

Avoid introducing global state unless it clearly improves ergonomics.

When creating components, prefer this style:

```txt
FeatureScreen.tsx
FeatureComponent.tsx
featureTypes.ts
featureUtils.ts
```

Use Zod for validating imported backup files and possibly form data where useful.

## Error Handling

Handle database and backup errors gracefully.

Show user-friendly messages.

Do not crash the workout logging flow because backup failed.

For destructive actions such as deleting an exercise, deleting a set, or deleting a workout exercise, use confirmation dialogs where appropriate.

## Suggested Project Setup

```bash
npm create vite@latest upraglog -- --template react-ts
cd upraglog

npm install \
  dexie \
  zustand \
  @tanstack/react-router \
  zod \
  date-fns \
  fuse.js \
  @dnd-kit/core \
  @dnd-kit/sortable \
  @dnd-kit/utilities \
  lucide-react

npm install tailwindcss @tailwindcss/vite
npm install -D vite-plugin-pwa

npx shadcn@latest init
npx shadcn@latest add button dialog alert-dialog dropdown-menu input switch sheet
```

## Recommended Project Structure

```txt
src/
  app/
    App.tsx
    router.tsx
    AppShell.tsx

  db/
    db.ts
    schema.ts
    migrations.ts
    repositories/
      workoutsRepo.ts
      exercisesRepo.ts
      bodyMeasurementsRepo.ts
      settingsRepo.ts

  features/
    workout-log/
      HomeScreen.tsx
      ExerciseCard.tsx
      DateNavRow.tsx

    training/
      TrainingScreen.tsx
      NumericStepper.tsx
      SetRow.tsx
      SetCommentDialog.tsx

    exercise-picker/
      ExercisePickerScreen.tsx
      ExerciseSearch.tsx
      ExerciseCategoryChips.tsx
      AddEditExerciseScreen.tsx

    workout-navigation/
      WorkoutNavigationPanel.tsx

    calendar/
      CalendarScreen.tsx

    body-tracker/
      BodyTrackerScreen.tsx

    settings/
      SettingsScreen.tsx

    backup/
      googleDriveBackup.ts
      exportJson.ts
      importJson.ts
      backupTypes.ts
      backupValidation.ts

  shared/
    ui/
      BottomMainBar.tsx
      ActionButton.tsx
      ScreenContainer.tsx
      IconButton.tsx

    model/
      ids.ts
      dates.ts
      units.ts
```

## Implementation Order

Build the MVP in this order:

1. Project setup with Vite, React, TypeScript, Tailwind, shadcn/ui.
2. Static dark app shell with persistent bottom main bar.
3. Home / Daily Workout Log static UI.
4. Training Screen static UI.
5. Dexie schema and seed exercise database.
6. Home screen connected to local data.
7. Exercise Picker with search and category filtering.
8. Add exercise to selected date.
9. Add/update/delete sets on Training Screen.
10. Workout Navigation Panel.
11. Calendar with workout markers.
12. Set comments.
13. Add/Edit Exercise screen.
14. Settings.
15. Body Tracker.
16. JSON export/import.
17. Google Drive backup/restore.
18. PWA offline/install behavior.
19. Keep Screen On behavior for Training Screen.

## AI Agent Behavior

When generating code, prefer complete, copy-pasteable files.

When making changes, state exactly which files should be created or modified.

Do not introduce libraries outside the chosen stack unless there is a clear reason.

If a new dependency is suggested, explain why it is needed.

Prefer minimal working implementation over architectural perfection.

When unsure between two approaches, choose the simpler one that keeps the app local-first, mobile-first, and easy to modify.

Do not add features that are explicitly out of scope, including:

* social feeds
* achievements
* badges
* personal record trophies
* routine builder
* light theme
* backend accounts
* server-side database
* analytics
* monetization
* complex dashboards
