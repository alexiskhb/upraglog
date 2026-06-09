import type { ExerciseCategory, ExerciseType } from "@/db/schema"

export const exerciseCategories = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "biceps",
  "triceps",
  "abs",
  "cardio",
  "custom",
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
  return category.charAt(0).toUpperCase() + category.slice(1)
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
