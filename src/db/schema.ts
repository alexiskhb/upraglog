export type ExerciseCategory =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "abs"
  | "cardio"
  | "custom"

export type ExerciseType =
  | "strength"
  | "cardio"
  | "weight_time"
  | "reps_time"
  | "reps_only"
  | "time_only"
  | "distance_time"

export type UnitSystem = "metric" | "imperial"

export type ExerciseSetDefaults = {
  weight?: number | null
  reps?: number | null
  distance?: number | null
  durationSeconds?: number | null
}

export type Exercise = {
  id: string
  name: string
  category: ExerciseCategory
  exerciseType: ExerciseType
  isFavorite: boolean
  lastSetInput?: ExerciseSetDefaults
  createdAt: string
  updatedAt: string
}

export type Workout = {
  id: string
  localDate: string
  startedAt?: string
  endedAt?: string
  createdAt: string
  updatedAt: string
}

export type WorkoutExercise = {
  id: string
  workoutId: string
  exerciseId: string
  order: number
  createdAt: string
  updatedAt: string
}

export type SetEntry = {
  id: string
  workoutExerciseId: string
  order: number
  weight?: number | null
  reps?: number | null
  distance?: number | null
  durationSeconds?: number | null
  comment?: string
  createdAt: string
  updatedAt: string
}

export type AppSettings = {
  unitSystem: UnitSystem
  keepScreenOn: boolean
  skipEmptyDaysOnDayNavigation: boolean
}

export type StoredAppSettings = AppSettings & {
  id: "app"
  updatedAt: string
  keepScreenOnDuringTraining?: boolean
  skipEmptyDaysOnSwipe?: boolean
}

export type WorkoutExerciseDetail = {
  workoutExercise: WorkoutExercise
  exercise: Exercise
  sets: SetEntry[]
}

export type WorkoutDayDetail = {
  workout?: Workout
  exercises: WorkoutExerciseDetail[]
}

export type ExerciseUsageStats = {
  workoutCount: number
  lastUsedDate?: string
}

export type SetEntryInput = {
  weight?: number | null
  reps?: number | null
  distance?: number | null
  durationSeconds?: number | null
  comment?: string
}

export type ExerciseInput = {
  name: string
  category: ExerciseCategory
  exerciseType: ExerciseType
  isFavorite?: boolean
}
