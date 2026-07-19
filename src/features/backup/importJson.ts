import { db } from "@/db/db"
import { appSettingsId } from "@/shared/model/settings"
import type { BackupFile } from "./backupTypes"
import { backupFileSchema } from "./backupValidation"

export type RestoreDataSummary = {
  exerciseCount: number
  profileCount: number
  setCount: number
  workoutCount: number
}

export function parseBackupJson(text: string): BackupFile {
  return backupFileSchema.parse(JSON.parse(text))
}

export function getBackupRestoreDataSummary(
  backup: BackupFile,
): RestoreDataSummary {
  return {
    exerciseCount: backup.data.exercises.length,
    profileCount: backup.data.settings.profiles.length,
    setCount: backup.data.sets.length,
    workoutCount: backup.data.workouts.length,
  }
}

export async function getCurrentRestoreDataSummary(): Promise<RestoreDataSummary> {
  const [exerciseCount, workoutCount, setCount, settings] = await Promise.all([
    db.exercises.count(),
    db.workouts.count(),
    db.sets.count(),
    db.settings.get(appSettingsId),
  ])

  return {
    exerciseCount,
    profileCount: Array.isArray(settings?.profiles)
      ? settings.profiles.length
      : 0,
    setCount,
    workoutCount,
  }
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
        id: appSettingsId,
        ...backup.data.settings,
        updatedAt: now,
      })
    },
  )
}
