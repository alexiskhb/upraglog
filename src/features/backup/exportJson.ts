import { db } from "@/db/db"
import { getSettings } from "@/db/repositories/settingsRepo"
import type { BackupFile } from "./backupTypes"

export async function buildBackupFile(): Promise<BackupFile> {
  const [exercises, workouts, workoutExercises, sets, bodyMeasurements, settings] =
    await Promise.all([
      db.exercises.toArray(),
      db.workouts.toArray(),
      db.workoutExercises.toArray(),
      db.sets.toArray(),
      db.bodyMeasurements.toArray(),
      getSettings(),
    ])

  return {
    app: "upraglog",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      exercises,
      workouts,
      workoutExercises,
      sets,
      bodyMeasurements,
      settings,
    },
  }
}

export async function exportBackupJson() {
  const backup = await buildBackupFile()
  return JSON.stringify(backup, null, 2)
}

export function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
