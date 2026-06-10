import { db } from "@/db/db"
import { getSettings } from "@/db/repositories/settingsRepo"
import type { Exercise, ExerciseCategoryEntry } from "@/db/schema"
import { normalizeExerciseCategory } from "@/shared/model/exercises"
import type { BackupFile } from "./backupTypes"

function serializeExerciseCategory(
  category: ExerciseCategoryEntry,
): ExerciseCategoryEntry {
  return {
    id: normalizeExerciseCategory(category.id),
  }
}

function serializeExercise(exercise: Exercise): Exercise {
  const id = exercise.id.trim()

  return {
    id,
    category: normalizeExerciseCategory(exercise.category),
    exerciseType: exercise.exerciseType,
    isFavorite: exercise.isFavorite,
    lastSetInput: exercise.lastSetInput,
    setIncrements: exercise.setIncrements,
  }
}

export async function buildBackupFile(): Promise<BackupFile> {
  const [exerciseCategories, exercises, workouts, workoutExercises, sets, settings] =
    await Promise.all([
      db.exerciseCategories.toArray(),
      db.exercises.toArray(),
      db.workouts.toArray(),
      db.workoutExercises.toArray(),
      db.sets.toArray(),
      getSettings(),
    ])

  return {
    app: "upraglog",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      exerciseCategories: exerciseCategories.map(serializeExerciseCategory),
      exercises: exercises.map(serializeExercise),
      workouts,
      workoutExercises,
      sets,
      settings,
    },
  }
}

export async function exportBackupJson() {
  const backup = await buildBackupFile()
  return JSON.stringify(backup, null, 2)
}

export function downloadTextFile(
  filename: string,
  text: string,
  type = "application/json",
) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
