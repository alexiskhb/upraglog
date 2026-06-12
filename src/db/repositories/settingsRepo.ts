import { db } from "@/db/db"
import type { AppSettings, StoredAppSettings } from "@/db/schema"
import {
  appSettingsId,
  createDefaultStoredAppSettings,
  normalizeSettings,
} from "@/shared/model/settings"

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get(appSettingsId)

  if (!settings) {
    const defaultSettings = createDefaultStoredAppSettings()

    await db.settings.put(defaultSettings)
    return normalizeSettings(defaultSettings)
  }

  return normalizeSettings(settings)
}

export async function updateSettings(input: Partial<AppSettings>) {
  const current = await db.settings.get(appSettingsId)
  const defaultSettings = createDefaultStoredAppSettings()
  const currentSettings = normalizeSettings(current ?? defaultSettings)
  const nextSettings = normalizeSettings({
    ...currentSettings,
    ...input,
  })
  const updated: StoredAppSettings = {
    ...nextSettings,
    id: appSettingsId,
    updatedAt: new Date().toISOString(),
  }

  await db.settings.put(updated)
  return nextSettings
}
