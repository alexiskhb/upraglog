import { db } from "@/db/db"
import type { BackupFile } from "./backupTypes"
import { backupFileSchema } from "./backupValidation"

export function parseBackupJson(text: string): BackupFile {
  return backupFileSchema.parse(JSON.parse(text))
}

export async function restoreBackup(backup: BackupFile) {
  const now = new Date().toISOString()

  await db.transaction(
    "rw",
    [
      db.exerciseCategories,
      db.exercises,
      db.workouts,
      db.workoutExercises,
      db.sets,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.sets.clear(),
        db.workoutExercises.clear(),
        db.workouts.clear(),
        db.exercises.clear(),
        db.exerciseCategories.clear(),
        db.settings.clear(),
      ])

      await db.exerciseCategories.bulkPut(backup.data.exerciseCategories)
      await db.exercises.bulkPut(backup.data.exercises)
      await db.workouts.bulkAdd(backup.data.workouts)
      await db.workoutExercises.bulkAdd(backup.data.workoutExercises)
      await db.sets.bulkAdd(backup.data.sets)
      await db.settings.add({
        id: "app",
        ...backup.data.settings,
        updatedAt: now,
      })
    },
  )
}
