import type { ExerciseCategory, ExerciseType } from "@/db/schema"

export const defaultExerciseCategories = [
  "Arms - Curl / Forearms",
  "Arms - Triceps",
  "Back - Horizontal Row",
  "Back - Vertical Pull",
  "Cardio - Bike",
  "Cardio - Conditioning / Machines",
  "Cardio - Walk / Run",
  "Chest - Fly",
  "Chest - Press",
  "Core - Anti-Extension",
  "Core - Carry / Get-Up",
  "Core - Flexion / Leg Raise",
  "Core - Rotation / Lateral Stability",
  "Legs - Calves",
  "Legs - Glutes / Hip Isolation",
  "Legs - Hamstrings / Leg Curl",
  "Legs - Hip Hinge / Posterior Chain",
  "Legs - Quad Dominant",
  "Legs - Split Squat / Lunge",
  "Shoulders - Front / Lateral Raise",
  "Shoulders - Overhead Press",
  "Shoulders - Rear Delts",
] as const satisfies readonly ExerciseCategory[]

export const exerciseTypes = [
  "strength",
  "weight_over_time",
  "reps_over_time",
  "reps_only",
  "time_only",
  "distance_over_time",
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
    reps_only: "Reps Only",
    time_only: "Time Only",
    weight_over_time: "Weight / Time",
    reps_over_time: "Reps / Time",
    distance_over_time: "Distance / Time",
  }

  return labels[type]
}
