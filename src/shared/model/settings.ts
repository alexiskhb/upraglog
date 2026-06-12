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
    id: "app",
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
    spreadsheetShareMessage:
      settings?.spreadsheetShareMessage?.trim() ||
      defaultSpreadsheetShareMessage,
    spreadsheetShareIncludeMessage:
      settings?.spreadsheetShareIncludeMessage ?? true,
    spreadsheetShareIncludeAiInstructions:
      settings?.spreadsheetShareIncludeAiInstructions ?? true,
    spreadsheetShareAttachMessageAsFile:
      settings?.spreadsheetShareAttachMessageAsFile ?? false,
    addShareShortcutToMenu: settings?.addShareShortcutToMenu ?? false,
    treatLongWorkoutTimerAsLatestSetFinish:
      settings?.treatLongWorkoutTimerAsLatestSetFinish ?? false,
    autoSortWorkoutExercisesByFirstFinishedSet:
      settings?.autoSortWorkoutExercisesByFirstFinishedSet ?? false,
    autoFinishWorkoutTimerWhenAllSetsFinished:
      settings?.autoFinishWorkoutTimerWhenAllSetsFinished ?? false,
    setCommentTemplates: normalizeSetCommentTemplates(
      settings?.setCommentTemplates,
    ),
  }
}
