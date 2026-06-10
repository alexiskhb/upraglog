import type { ExerciseCategory, ExerciseType } from "@/db/schema"

export const defaultExerciseCategories = [
  "Arms - Biceps Curl",
  "Arms - Forearms",
  "Arms - Triceps Extension",
  "Arms - Triceps Pushdown",
  "Back - Horizontal Row",
  "Back - Lower Back / Hinge",
  "Back - Pullover / Straight-Arm Pull",
  "Back - Single-Arm Pull",
  "Back - Traps / Shrugs",
  "Back - Vertical Pull",
  "Cardio - Bike",
  "Cardio - Conditioning",
  "Cardio - Row / Ski Erg",
  "Cardio - Stairs",
  "Cardio - Walk / Run",
  "Chest - Fly",
  "Chest - Horizontal Press",
  "Chest - Incline Press",
  "Chest - Push-Up / Dip",
  "Core - Anti-Extension",
  "Core - Anti-Rotation",
  "Core - Flexion",
  "Core - Lateral Stability",
  "Core - Leg Raise",
  "Core - Loaded Carry",
  "Core - Rotation",
  "Legs - Calves",
  "Legs - Hip Abduction",
  "Legs - Hip Adduction",
  "Legs - Hip Hinge",
  "Legs - Hip Thrust / Glutes",
  "Legs - Leg Curl / Hamstrings",
  "Legs - Leg Extension",
  "Legs - Leg Press",
  "Legs - Split Squat / Lunge",
  "Legs - Squat Pattern",
  "Shoulders - Lateral Raise",
  "Shoulders - Overhead Press",
  "Shoulders - Rear Delts",
  "Shoulders - Shoulder Stability",
  "Shoulders",
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
