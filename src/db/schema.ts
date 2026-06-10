export type ExerciseCategory = string

export type ExerciseCategoryEntry = {
  id: ExerciseCategory
}

export type ExerciseType =
  | "strength"
  | "weight_over_time"
  | "reps_over_time"
  | "reps_only"
  | "time_only"
  | "distance_over_time"

export type SetFieldKey = "weight" | "reps" | "distance" | "durationSeconds"

export type ExerciseSetDefaults = {
  weight?: number | null
  reps?: number | null
  distance?: number | null
  durationSeconds?: number | null
}

export type ExerciseSetIncrements = Partial<Record<SetFieldKey, number>>

export type Exercise = {
  id: string
  category: ExerciseCategory
  exerciseType: ExerciseType
  isFavorite: boolean
  lastSetInput?: ExerciseSetDefaults
  setIncrements?: ExerciseSetIncrements
}

export type Workout = {
  id: string
  localDate: string
  profileName: string
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
  finishedAt?: string
  createdAt: string
  updatedAt: string
}

export type AppSettings = {
  keepScreenOn: boolean
  skipEmptyDaysOnDayNavigation: boolean
  profiles: string[]
  selectedProfile: string
  exportAllProfiles: boolean
  spreadsheetExportMonthLimit: number | null
  spreadsheetShareMessage: string
  spreadsheetShareIncludeMessage: boolean
  spreadsheetShareIncludeAiInstructions: boolean
  treatLongWorkoutTimerAsLatestSetFinish: boolean
  setCommentTemplates: string[]
}

export type StoredAppSettings = AppSettings & {
  id: "app"
  updatedAt: string
  keepScreenOnDuringTraining?: boolean
  skipEmptyDaysOnSwipe?: boolean
  unitSystem?: "metric" | "imperial"
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
  id: string
  category: ExerciseCategory
  exerciseType: ExerciseType
  isFavorite?: boolean
  setIncrements?: ExerciseSetIncrements
}
