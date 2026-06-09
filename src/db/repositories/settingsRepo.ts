import { db } from "@/db/db"
import type { AppSettings, StoredAppSettings } from "@/db/schema"

const defaultSettings: StoredAppSettings = {
  id: "app",
  unitSystem: "metric",
  keepScreenOn: true,
  updatedAt: new Date().toISOString(),
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get("app")

  if (!settings) {
    await db.settings.put(defaultSettings)
    return defaultSettings
  }

  return {
    unitSystem: settings.unitSystem,
    keepScreenOn:
      settings.keepScreenOn ?? settings.keepScreenOnDuringTraining ?? true,
  }
}

export async function updateSettings(input: Partial<AppSettings>) {
  const current = await db.settings.get("app")
  const currentSettings = current
    ? {
        unitSystem: current.unitSystem,
        keepScreenOn:
          current.keepScreenOn ?? current.keepScreenOnDuringTraining ?? true,
      }
    : defaultSettings
  const updated: StoredAppSettings = {
    ...currentSettings,
    ...input,
    id: "app",
    updatedAt: new Date().toISOString(),
  }

  await db.settings.put(updated)
  return updated
}
