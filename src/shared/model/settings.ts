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
  keepScreenOn: true,
  skipEmptyDaysOnDayNavigation: false,
  profiles: [...defaultProfileNames],
  selectedProfile: defaultProfileName,
  exportAllProfiles: false,
  spreadsheetExportMonthLimit: null,
  spreadsheetShareMessage: defaultSpreadsheetShareMessage,
  spreadsheetShareIncludeMessage: true,
  spreadsheetShareIncludeAiInstructions: true,
  spreadsheetShareAttachMessageAsFile: false,
  addShareShortcutToMenu: false,
  treatLongWorkoutTimerAsLatestSetFinish: false,
  autoSortWorkoutExercisesByFirstFinishedSet: false,
  autoFinishWorkoutTimerWhenAllSetsFinished: false,
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

function normalizeSpreadsheetMonthLimit(monthLimit?: number | null) {
  if (monthLimit === null) {
    return null
  }

  if (!monthLimit || !Number.isFinite(monthLimit) || monthLimit < 1) {
    return null
  }

  return Math.floor(monthLimit)
}

export function normalizeSettings(
  settings?: Partial<StoredAppSettings>,
): AppSettings {
  const resolvedProfiles = resolveSelectedProfile(
    settings?.profiles,
    settings?.selectedProfile,
  )
  const spreadsheetExportMonthLimit =
    settings?.spreadsheetExportMonthLimit === undefined
      ? defaultAppSettings.spreadsheetExportMonthLimit
      : settings.spreadsheetExportMonthLimit

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
    spreadsheetExportMonthLimit: normalizeSpreadsheetMonthLimit(
      spreadsheetExportMonthLimit,
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
    treatLongWorkoutTimerAsLatestSetFinish:
      settings?.treatLongWorkoutTimerAsLatestSetFinish ??
      defaultAppSettings.treatLongWorkoutTimerAsLatestSetFinish,
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
