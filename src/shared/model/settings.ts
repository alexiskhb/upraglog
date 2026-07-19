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
import { defaultSpreadsheetShareMessage } from "@/shared/model/spreadsheetShare"

export const appSettingsId = "app"

export const defaultAppSettings: AppSettings = {
  keepScreenOn: false,
  skipEmptyDaysOnDayNavigation: true,
  profiles: [...defaultProfileNames],
  selectedProfile: defaultProfileName,
  exportAllProfiles: true,
  spreadsheetExportDayLimit: null,
  spreadsheetShareMessage: defaultSpreadsheetShareMessage,
  spreadsheetShareIncludeMessage: true,
  spreadsheetShareIncludeAiInstructions: true,
  spreadsheetShareAttachMessageAsFile: true,
  addShareShortcutToMenu: true,
  autoSortWorkoutExercisesByFirstFinishedSet: true,
  autoFinishWorkoutTimerWhenAllSetsFinished: true,
  setCommentTemplates: [...defaultSetCommentTemplates],
}

export function createDefaultAppSettings(): AppSettings {
  return {
    ...defaultAppSettings,
    profiles: [...defaultAppSettings.profiles],
    setCommentTemplates: [...defaultAppSettings.setCommentTemplates],
  }
}

export function createDefaultStoredAppSettings(
  updatedAt = new Date().toISOString(),
): StoredAppSettings {
  return {
    ...createDefaultAppSettings(),
    id: appSettingsId,
    updatedAt,
  }
}

function normalizePositiveIntegerLimit(limit?: number | null) {
  if (limit === null) {
    return null
  }

  if (!limit || !Number.isFinite(limit) || limit < 1) {
    return null
  }

  return Math.floor(limit)
}

function monthLimitToDayLimit(monthLimit?: number | null) {
  const normalizedMonthLimit = normalizePositiveIntegerLimit(monthLimit)

  return normalizedMonthLimit === null ? null : normalizedMonthLimit * 30
}

function resolveSpreadsheetExportDayLimit(
  settings?: Partial<StoredAppSettings>,
) {
  if (settings?.spreadsheetExportDayLimit !== undefined) {
    return settings.spreadsheetExportDayLimit
  }

  if (settings?.spreadsheetExportMonthLimit !== undefined) {
    return monthLimitToDayLimit(settings.spreadsheetExportMonthLimit)
  }

  return defaultAppSettings.spreadsheetExportDayLimit
}

export function normalizeSettings(
  settings?: Partial<StoredAppSettings>,
): AppSettings {
  const resolvedProfiles = resolveSelectedProfile(
    settings?.profiles,
    settings?.selectedProfile,
  )
  const spreadsheetExportDayLimit = resolveSpreadsheetExportDayLimit(settings)

  return {
    keepScreenOn:
      settings?.keepScreenOn ??
      settings?.keepScreenOnDuringTraining ??
      defaultAppSettings.keepScreenOn,
    skipEmptyDaysOnDayNavigation:
      settings?.skipEmptyDaysOnDayNavigation ??
      settings?.skipEmptyDaysOnSwipe ??
      defaultAppSettings.skipEmptyDaysOnDayNavigation,
    profiles: resolvedProfiles.profiles,
    selectedProfile: resolvedProfiles.selectedProfile,
    exportAllProfiles:
      settings?.exportAllProfiles ?? defaultAppSettings.exportAllProfiles,
    spreadsheetExportDayLimit: normalizePositiveIntegerLimit(
      spreadsheetExportDayLimit,
    ),
    spreadsheetShareMessage:
      settings?.spreadsheetShareMessage?.trim() ||
      defaultAppSettings.spreadsheetShareMessage,
    spreadsheetShareIncludeMessage:
      settings?.spreadsheetShareIncludeMessage ??
      defaultAppSettings.spreadsheetShareIncludeMessage,
    spreadsheetShareIncludeAiInstructions:
      settings?.spreadsheetShareIncludeAiInstructions ??
      defaultAppSettings.spreadsheetShareIncludeAiInstructions,
    spreadsheetShareAttachMessageAsFile:
      settings?.spreadsheetShareAttachMessageAsFile ??
      defaultAppSettings.spreadsheetShareAttachMessageAsFile,
    addShareShortcutToMenu:
      settings?.addShareShortcutToMenu ??
      defaultAppSettings.addShareShortcutToMenu,
    autoSortWorkoutExercisesByFirstFinishedSet:
      settings?.autoSortWorkoutExercisesByFirstFinishedSet ??
      defaultAppSettings.autoSortWorkoutExercisesByFirstFinishedSet,
    autoFinishWorkoutTimerWhenAllSetsFinished:
      settings?.autoFinishWorkoutTimerWhenAllSetsFinished ??
      defaultAppSettings.autoFinishWorkoutTimerWhenAllSetsFinished,
    setCommentTemplates: normalizeSetCommentTemplates(
      settings?.setCommentTemplates ?? defaultAppSettings.setCommentTemplates,
    ),
  }
}
