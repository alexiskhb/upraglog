import type { ExerciseCategory, ExerciseType } from "@/db/schema"

export const defaultExerciseCategories = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Abs",
  "Cardio",
  "Custom",
] as const satisfies readonly ExerciseCategory[]

export const exerciseTypes = [
  "strength",
  "cardio",
  "weight_time",
  "reps_time",
  "reps_only",
  "time_only",
  "distance_time",
] as const satisfies readonly ExerciseType[]

export function formatExerciseCategory(category: ExerciseCategory) {
  return category
}

export function normalizeExerciseCategory(category: ExerciseCategory) {
  const trimmedCategory = category.trim()
  const defaultCategory = defaultExerciseCategories.find(
    (currentCategory) =>
      currentCategory.toLocaleLowerCase() ===
      trimmedCategory.toLocaleLowerCase(),
  )

  return defaultCategory ?? trimmedCategory
}

export function formatExerciseType(type: ExerciseType) {
  const labels: Record<ExerciseType, string> = {
    strength: "Strength",
    cardio: "Cardio",
    weight_time: "Weight / Time",
    reps_time: "Reps / Time",
    reps_only: "Reps Only",
    time_only: "Time Only",
    distance_time: "Distance / Time",
  }

  return labels[type]
}
