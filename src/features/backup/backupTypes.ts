import type {
  AppSettings,
  BodyMeasurementEntry,
  Exercise,
  SetEntry,
  Workout,
  WorkoutExercise,
} from "@/db/schema"

export type BackupFile = {
  app: "upraglog"
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
