import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router"
import { AppShell } from "./AppShell"
import { IndexRedirect } from "./IndexRedirect"
import { HomeScreen } from "@/features/workout-log/HomeScreen"
import { TrainingScreen } from "@/features/training/TrainingScreen"
import { ExercisePickerScreen } from "@/features/exercise-picker/ExercisePickerScreen"
import { AddEditExerciseScreen } from "@/features/exercise-picker/AddEditExerciseScreen"
import { CalendarScreen } from "@/features/calendar/CalendarScreen"
import { BodyTrackerScreen } from "@/features/body-tracker/BodyTrackerScreen"
import { SettingsScreen } from "@/features/settings/SettingsScreen"

const rootRoute = createRootRoute({
  component: AppShell,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexRedirect,
})

const dayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/day/$date",
  component: HomeScreen,
})

const trainingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/training/$workoutExerciseId",
  component: TrainingScreen,
})

const pickerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/picker",
  component: ExercisePickerScreen,
})

const newExerciseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/exercise/new",
  component: AddEditExerciseScreen,
})

const editExerciseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/exercise/$exerciseId/edit",
  component: AddEditExerciseScreen,
})

const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calendar",
  component: CalendarScreen,
})

const bodyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/body",
  component: BodyTrackerScreen,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsScreen,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  dayRoute,
  trainingRoute,
  pickerRoute,
  newExerciseRoute,
  editExerciseRoute,
  calendarRoute,
  bodyRoute,
  settingsRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
