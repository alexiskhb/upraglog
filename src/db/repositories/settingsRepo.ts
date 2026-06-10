import { db } from "@/db/db"
import type { AppSettings, StoredAppSettings } from "@/db/schema"
import {
  defaultProfileName,
  defaultProfileNames,
  resolveSelectedProfile,
} from "@/shared/model/profiles"
import {
  defaultSetCommentTemplates,
  normalizeSetCommentTemplates,
} from "@/shared/model/setCommentTemplates"

const defaultSettings: StoredAppSettings = {
  id: "app",
  keepScreenOn: true,
  skipEmptyDaysOnDayNavigation: false,
  profiles: [...defaultProfileNames],
  selectedProfile: defaultProfileName,
  exportAllProfiles: false,
  spreadsheetExportMonthLimit: null,
  spreadsheetShareMessage: "",
  spreadsheetShareIncludeMessage: true,
  spreadsheetShareIncludeAiInstructions: true,
  setCommentTemplates: [...defaultSetCommentTemplates],
  updatedAt: new Date().toISOString(),
}

function normalizeSpreadsheetMonthLimit(monthLimit?: number | null) {
  if (monthLimit === null) {
    return null
  }

  if (!monthLimit || !Number.isFinite(monthLimit) || monthLimit < 1) {
    return null
  }

  return Math.floor(monthLimit)
}

function normalizeSettings(settings?: Partial<StoredAppSettings>): AppSettings {
  const resolvedProfiles = resolveSelectedProfile(
    settings?.profiles,
    settings?.selectedProfile,
  )

  return {
    keepScreenOn:
      settings?.keepScreenOn ?? settings?.keepScreenOnDuringTraining ?? true,
    skipEmptyDaysOnDayNavigation:
      settings?.skipEmptyDaysOnDayNavigation ??
      settings?.skipEmptyDaysOnSwipe ??
      false,
    profiles: resolvedProfiles.profiles,
    selectedProfile: resolvedProfiles.selectedProfile,
    exportAllProfiles: settings?.exportAllProfiles ?? false,
    spreadsheetExportMonthLimit: normalizeSpreadsheetMonthLimit(
      settings?.spreadsheetExportMonthLimit,
    ),
    spreadsheetShareMessage: settings?.spreadsheetShareMessage ?? "",
    spreadsheetShareIncludeMessage:
      settings?.spreadsheetShareIncludeMessage ?? true,
    spreadsheetShareIncludeAiInstructions:
      settings?.spreadsheetShareIncludeAiInstructions ?? true,
    setCommentTemplates: normalizeSetCommentTemplates(
      settings?.setCommentTemplates,
    ),
  }
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get("app")

  if (!settings) {
    await db.settings.put(defaultSettings)
    return normalizeSettings(defaultSettings)
  }

  return normalizeSettings(settings)
}

export async function updateSettings(input: Partial<AppSettings>) {
  const current = await db.settings.get("app")
  const currentSettings = normalizeSettings(current ?? defaultSettings)
  const nextSettings = normalizeSettings({
    ...currentSettings,
    ...input,
  })
  const updated: StoredAppSettings = {
    ...nextSettings,
    id: "app",
    updatedAt: new Date().toISOString(),
  }

  await db.settings.put(updated)
  return nextSettings
}
