import { db } from "@/db/db"
import type { AppSettings, StoredAppSettings } from "@/db/schema"

const defaultSettings: StoredAppSettings = {
  id: "app",
  keepScreenOn: true,
  skipEmptyDaysOnDayNavigation: false,
  updatedAt: new Date().toISOString(),
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get("app")

  if (!settings) {
    await db.settings.put(defaultSettings)
    return defaultSettings
  }

  return {
    keepScreenOn:
      settings.keepScreenOn ?? settings.keepScreenOnDuringTraining ?? true,
    skipEmptyDaysOnDayNavigation:
      settings.skipEmptyDaysOnDayNavigation ??
      settings.skipEmptyDaysOnSwipe ??
      false,
  }
}

export async function updateSettings(input: Partial<AppSettings>) {
  const current = await db.settings.get("app")
  const currentSettings = current
    ? {
        keepScreenOn:
          current.keepScreenOn ?? current.keepScreenOnDuringTraining ?? true,
        skipEmptyDaysOnDayNavigation:
          current.skipEmptyDaysOnDayNavigation ??
          current.skipEmptyDaysOnSwipe ??
          false,
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
