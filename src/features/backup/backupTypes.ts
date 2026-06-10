import type {
  AppSettings,
  Exercise,
  ExerciseCategoryEntry,
  SetEntry,
  Workout,
  WorkoutExercise,
} from "@/db/schema"

export type BackupFile = {
  app: "upraglog"
  version: number
  exportedAt: string
  data: {
    exerciseCategories: ExerciseCategoryEntry[]
    exercises: Exercise[]
    workouts: Workout[]
    workoutExercises: WorkoutExercise[]
    sets: SetEntry[]
    settings: AppSettings
  }
}
