import { useEffect, useRef, useState } from "react"
import { ChevronDown, Trash2 } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import type { AppSettings } from "@/db/schema"
import { getSettings, updateSettings } from "@/db/repositories/settingsRepo"
import { autoSortWorkoutExercisesByFirstFinishedSetForAllWorkouts } from "@/db/repositories/workoutsRepo"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { ActionButton } from "@/shared/ui/ActionButton"
import { useAppStore } from "@/shared/store/appStore"
import { normalizeProfileName } from "@/shared/model/profiles"
import {
  normalizeSetCommentTemplate,
} from "@/shared/model/setCommentTemplates"
import { createDefaultAppSettings } from "@/shared/model/settings"
import { appVersion } from "@/shared/model/appVersion"
import { todayString } from "@/shared/model/dates"
import {
  downloadTextFile,
  exportBackupJson,
} from "@/features/backup/exportJson"
import { exportTrainingLogCsv } from "@/features/backup/exportTrainingLogCsv"
import {
  backupToGoogleDrive,
  loadBackupFromGoogleDrive,
  preloadGoogleDriveBackup,
} from "@/features/backup/googleDriveBackup"
import {
  shareTrainingLogCsv,
  type ShareTrainingLogCsvResult,
} from "@/features/backup/shareTrainingLogCsv"
import type { BackupFile } from "@/features/backup/backupTypes"
import {
  getBackupRestoreDataSummary,
  getCurrentRestoreDataSummary,
  parseBackupJson,
  restoreBackup,
  type RestoreDataSummary,
} from "@/features/backup/importJson"

function formatShareResultMessage(result: ShareTrainingLogCsvResult) {
  if (result.status === "shared") {
    return "Spreadsheet shared."
  }

  if (result.status === "canceled") {
    return "Share canceled."
  }

  if (result.reason === "share-unavailable") {
    return "Sharing is not available in this browser, so the CSV was downloaded."
  }

  if (result.reason === "files-not-shareable") {
    return "CSV file sharing is not available in this browser, so the CSV was downloaded."
  }

  return "Sharing failed, so the CSV was downloaded."
}

const privacyPolicyPath = `${import.meta.env.BASE_URL}privacy.html`
const termsOfServicePath = `${import.meta.env.BASE_URL}terms.html`

type PendingRestoreSource = "drive" | "json"

type PendingRestore = {
  backup: BackupFile
  currentSummary: RestoreDataSummary
  fileName: string
  importedSummary: RestoreDataSummary
  source: PendingRestoreSource
  successMessage: string
}

function formatCount(label: string, count: number) {
  return `${count} ${label}${count === 1 ? "" : "s"}`
}

function formatRestoreDataSummary(summary: RestoreDataSummary) {
  return [
    formatCount("workout", summary.workoutCount),
    formatCount("set", summary.setCount),
    formatCount("exercise", summary.exerciseCount),
    formatCount("profile", summary.profileCount),
  ].join(", ")
}

function restoreSourceLabel(source: PendingRestoreSource) {
  return source === "drive" ? "Google Drive backup" : "JSON backup"
}

export function SettingsScreen() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const selectedDate = useAppStore((state) => state.selectedDate)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const setReplaceWorkoutExerciseId = useAppStore(
    (state) => state.setReplaceWorkoutExerciseId,
  )
  const closeTaskUi = useAppStore((state) => state.closeTaskUi)
  const setProfileState = useAppStore((state) => state.setProfileState)
  const [settings, setSettings] = useState<AppSettings>(() =>
    createDefaultAppSettings(),
  )
  const [newProfileName, setNewProfileName] = useState("")
  const [newSetCommentTemplate, setNewSetCommentTemplate] = useState("")
  const [spreadsheetDayLimitDraft, setSpreadsheetDayLimitDraft] =
    useState("")
  const [spreadsheetShareMessageDraft, setSpreadsheetShareMessageDraft] =
    useState("")
  const [message, setMessage] = useState<string | undefined>()
  const [googleDriveBusy, setGoogleDriveBusy] = useState(false)
  const [pendingRestore, setPendingRestore] = useState<
    PendingRestore | undefined
  >()
  const [restoreBusy, setRestoreBusy] = useState(false)
  const restoreControlsDisabled =
    googleDriveBusy || restoreBusy || Boolean(pendingRestore)

  const setSpreadsheetDrafts = (appSettings: AppSettings) => {
    setSpreadsheetDayLimitDraft(
      appSettings.spreadsheetExportDayLimit?.toString() ?? "",
    )
    setSpreadsheetShareMessageDraft(appSettings.spreadsheetShareMessage)
  }

  useEffect(() => {
    let cancelled = false

    preloadGoogleDriveBackup()

    getSettings().then((appSettings) => {
      if (!cancelled) {
        setSettings(appSettings)
        setSpreadsheetDrafts(appSettings)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const saveSettings = async (input: Partial<AppSettings>) => {
    const updated = await updateSettings(input)
    setSettings(updated)
    setProfileState(updated.profiles, updated.selectedProfile)
    bumpRefresh()
    return updated
  }

  const saveAutoSortWorkoutExercises = async (
    autoSortWorkoutExercisesByFirstFinishedSet: boolean,
  ) => {
    await saveSettings({ autoSortWorkoutExercisesByFirstFinishedSet })

    if (autoSortWorkoutExercisesByFirstFinishedSet) {
      await autoSortWorkoutExercisesByFirstFinishedSetForAllWorkouts()
      bumpRefresh()
    }
  }

  const addProfile = async () => {
    const profileName = normalizeProfileName(newProfileName)

    if (!profileName) {
      setMessage("Enter a profile name.")
      return
    }

    const profileExists = settings.profiles.some(
      (currentProfileName) =>
        currentProfileName.toLocaleLowerCase() ===
        profileName.toLocaleLowerCase(),
    )

    if (profileExists) {
      setMessage("Profile already exists.")
      return
    }

    await saveSettings({
      profiles: [...settings.profiles, profileName],
      selectedProfile: profileName,
    })
    setNewProfileName("")
    setMessage("Profile added.")
  }

  const deleteProfile = async (profileName: string) => {
    if (settings.profiles.length <= 1) {
      setMessage("Keep at least one profile.")
      return
    }

    const profiles = settings.profiles.filter(
      (currentProfileName) => currentProfileName !== profileName,
    )

    await saveSettings({
      profiles,
      selectedProfile:
        settings.selectedProfile === profileName
          ? profiles[0]
          : settings.selectedProfile,
    })
    setMessage("Profile deleted.")
  }

  const addSetCommentTemplate = async () => {
    const template = normalizeSetCommentTemplate(newSetCommentTemplate)

    if (!template) {
      setMessage("Enter a comment template.")
      return
    }

    const templateExists = settings.setCommentTemplates.some(
      (currentTemplate) =>
        currentTemplate.toLocaleLowerCase() === template.toLocaleLowerCase(),
    )

    if (templateExists) {
      setMessage("Comment template already exists.")
      return
    }

    await saveSettings({
      setCommentTemplates: [...settings.setCommentTemplates, template],
    })
    setNewSetCommentTemplate("")
    setMessage("Comment template added.")
  }

  const deleteSetCommentTemplate = async (template: string) => {
    await saveSettings({
      setCommentTemplates: settings.setCommentTemplates.filter(
        (currentTemplate) => currentTemplate !== template,
      ),
    })
    setMessage("Comment template deleted.")
  }

  const exportJson = async () => {
    const text = await exportBackupJson()
    downloadTextFile(`upraglog-backup-${new Date().toISOString()}.json`, text)
    setMessage("Backup exported.")
  }

  const exportSpreadsheet = async () => {
    const dayLimit = await saveSpreadsheetDayLimit()

    if (dayLimit === undefined) {
      return
    }

    const { filename, text } = await exportTrainingLogCsv({
      dayLimit,
    })

    downloadTextFile(filename, text, "text/csv;charset=utf-8")
    setMessage("Spreadsheet CSV exported.")
  }

  const saveSpreadsheetDayLimit = async () => {
    if (settings.spreadsheetExportDayLimit === null) {
      return null
    }

    const dayLimit = Number(spreadsheetDayLimitDraft)

    if (!Number.isFinite(dayLimit) || dayLimit < 1) {
      setSpreadsheetDayLimitDraft(
        settings.spreadsheetExportDayLimit?.toString() ?? "",
      )
      setMessage("Enter a day count greater than 0.")
      return undefined
    }

    const normalizedDayLimit = Math.floor(dayLimit)

    setSpreadsheetDayLimitDraft(normalizedDayLimit.toString())
    if (normalizedDayLimit !== settings.spreadsheetExportDayLimit) {
      await saveSettings({ spreadsheetExportDayLimit: normalizedDayLimit })
    }

    return normalizedDayLimit
  }

  const saveSpreadsheetShareMessage = async () => {
    if (spreadsheetShareMessageDraft === settings.spreadsheetShareMessage) {
      return spreadsheetShareMessageDraft
    }

    await saveSettings({ spreadsheetShareMessage: spreadsheetShareMessageDraft })
    return spreadsheetShareMessageDraft
  }

  const shareSpreadsheet = async () => {
    try {
      const dayLimit = await saveSpreadsheetDayLimit()

      if (dayLimit === undefined) {
        return
      }

      const shareMessage = await saveSpreadsheetShareMessage()
      const result = await shareTrainingLogCsv({
        dayLimit,
        shareMessage,
        includeMessage: settings.spreadsheetShareIncludeMessage,
        includeAiInstructions: settings.spreadsheetShareIncludeAiInstructions,
        attachMessageAsFile: settings.spreadsheetShareAttachMessageAsFile,
      })

      setMessage(formatShareResultMessage(result))
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Spreadsheet could not be shared.",
      )
    }
  }

  const resetImportFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const refreshSettingsAfterRestore = async () => {
    const appSettings = await getSettings()

    setSettings(appSettings)
    setSpreadsheetDrafts(appSettings)
    setProfileState(appSettings.profiles, appSettings.selectedProfile)
    bumpRefresh()
  }

  const queuePendingRestore = async ({
    backup,
    fileName,
    source,
    successMessage,
  }: {
    backup: BackupFile
    fileName: string
    source: PendingRestoreSource
    successMessage: string
  }) => {
    const currentSummary = await getCurrentRestoreDataSummary()

    setPendingRestore({
      backup,
      currentSummary,
      fileName,
      importedSummary: getBackupRestoreDataSummary(backup),
      source,
      successMessage,
    })
  }

  const importJson = async (file: File) => {
    try {
      const text = await file.text()
      const backup = parseBackupJson(text)
      await queuePendingRestore({
        backup,
        fileName: file.name || "Selected JSON file",
        source: "json",
        successMessage: "Backup imported.",
      })
      setMessage("Review the restore warning.")
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Backup import failed.",
      )
    } finally {
      resetImportFileInput()
    }
  }

  const clearPendingRestore = () => {
    if (restoreBusy) {
      return
    }

    setPendingRestore(undefined)
    resetImportFileInput()
  }

  const confirmPendingRestore = async () => {
    const restore = pendingRestore

    if (!restore || restoreBusy) {
      return
    }

    setRestoreBusy(true)
    setMessage("Restoring backup...")

    try {
      await restoreBackup(restore.backup)
      await refreshSettingsAfterRestore()
      setPendingRestore(undefined)
      setMessage(restore.successMessage)
    } catch (error) {
      setPendingRestore(undefined)
      setMessage(
        error instanceof Error ? error.message : "Backup restore failed.",
      )
    } finally {
      setRestoreBusy(false)
      resetImportFileInput()
    }
  }

  const backupGoogleDrive = async () => {
    setGoogleDriveBusy(true)
    setMessage("Opening Google Drive...")

    try {
      setMessage(await backupToGoogleDrive())
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Google Drive backup failed.",
      )
    } finally {
      setGoogleDriveBusy(false)
    }
  }

  const restoreGoogleDrive = async () => {
    setGoogleDriveBusy(true)
    setMessage("Opening Google Drive...")

    try {
      const loadedBackup = await loadBackupFromGoogleDrive()

      await queuePendingRestore({
        backup: loadedBackup.backup,
        fileName: loadedBackup.fileName,
        source: "drive",
        successMessage: `Google Drive backup restored from ${loadedBackup.fileName}.`,
      })
      setMessage("Review the restore warning.")
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Google Drive restore failed.",
      )
    } finally {
      setGoogleDriveBusy(false)
    }
  }

  const goHome = () => {
    setReplaceWorkoutExerciseId(undefined)
    closeTaskUi()
    void navigate({
      to: "/day/$date",
      params: { date: selectedDate || todayString() },
    })
  }

  return (
    <ScreenContainer className="gap-4">
      <div className="pt-3">
        <button
          className="min-w-0 cursor-pointer text-left text-[17px] font-semibold text-zinc-50"
          type="button"
          onClick={goHome}
        >
          Settings
        </button>
        <div className="mt-2 h-px bg-cyan-300/50" />
      </div>

      {message && (
        <div className="rounded-md border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
          {message}
        </div>
      )}

      <section className="app-surface space-y-4 rounded-md p-3.5">
        <label className="flex items-center justify-between gap-3">
          <span>
            <Label className="text-sm text-zinc-200">
              Keep Screen On
            </Label>
            <span className="mt-1 block text-xs text-zinc-500">
              Applies throughout Upraglog.
            </span>
          </span>
          <Switch
            checked={settings.keepScreenOn}
            className="data-checked:bg-cyan-500"
            onCheckedChange={(keepScreenOn) =>
              void saveSettings({ keepScreenOn })
            }
          />
        </label>

        <label className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span>
            <Label className="text-sm text-zinc-200">
              Skip Empty Days
            </Label>
            <span className="mt-1 block text-xs text-zinc-500">
              Day arrows and swipes move only through training history.
            </span>
          </span>
          <Switch
            checked={settings.skipEmptyDaysOnDayNavigation}
            className="data-checked:bg-cyan-500"
            onCheckedChange={(skipEmptyDaysOnDayNavigation) =>
              void saveSettings({ skipEmptyDaysOnDayNavigation })
            }
          />
        </label>

        <label className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span className="min-w-0">
            <Label className="text-sm text-zinc-200">
              Auto-Sort Workout List
            </Label>
            <span className="mt-1 block text-xs text-zinc-500">
              Finished exercises move by first checked set; unfinished exercises
              stay after them.
            </span>
          </span>
          <Switch
            checked={settings.autoSortWorkoutExercisesByFirstFinishedSet}
            className="data-checked:bg-cyan-500"
            onCheckedChange={(autoSortWorkoutExercisesByFirstFinishedSet) =>
              void saveAutoSortWorkoutExercises(
                autoSortWorkoutExercisesByFirstFinishedSet,
              )
            }
          />
        </label>

        <label className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span className="min-w-0">
            <Label className="text-sm text-zinc-200">
              Auto-Finish Workout Timer
            </Label>
            <span className="mt-1 block text-xs text-zinc-500">
              Stops an active timer when every logged set in the workout is
              checked.
            </span>
          </span>
          <Switch
            checked={settings.autoFinishWorkoutTimerWhenAllSetsFinished}
            className="data-checked:bg-cyan-500"
            onCheckedChange={(autoFinishWorkoutTimerWhenAllSetsFinished) =>
              void saveSettings({ autoFinishWorkoutTimerWhenAllSetsFinished })
            }
          />
        </label>
      </section>

      <section className="app-surface space-y-3 rounded-md p-3.5">
        <div className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
          Spreadsheet
        </div>
        <div className="text-xs text-zinc-500">
          Export training logs as CSV for spreadsheet apps.
        </div>
        <label className="flex items-center justify-between gap-3">
          <span>
            <Label className="text-sm text-zinc-200">
              Export All Profiles
            </Label>
          </span>
          <Switch
            checked={settings.exportAllProfiles}
            className="data-checked:bg-cyan-500"
            onCheckedChange={(exportAllProfiles) =>
              void saveSettings({ exportAllProfiles })
            }
          />
        </label>
        <label className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span>
            <Label className="text-sm text-zinc-200">
              Export All History
            </Label>
          </span>
          <Switch
            checked={settings.spreadsheetExportDayLimit === null}
            className="data-checked:bg-cyan-500"
            onCheckedChange={(exportAllHistory) => {
              const dayLimit = exportAllHistory ? null : 90

              setSpreadsheetDayLimitDraft(dayLimit?.toString() ?? "")
              void saveSettings({ spreadsheetExportDayLimit: dayLimit })
            }}
          />
        </label>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Last Days
          </Label>
          <Input
            className="h-11 rounded-md border-white/10 bg-[var(--app-surface)] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
            disabled={settings.spreadsheetExportDayLimit === null}
            inputMode="numeric"
            min="1"
            placeholder="All"
            type="number"
            value={spreadsheetDayLimitDraft}
            onBlur={() => void saveSpreadsheetDayLimit()}
            onChange={(event) =>
              setSpreadsheetDayLimitDraft(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur()
              }
            }}
          />
        </div>
        <details className="group rounded-md border border-white/10 bg-[var(--app-surface-muted)] px-3 py-2">
          <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold uppercase tracking-normal text-zinc-400 [&::-webkit-details-marker]:hidden">
            Message
            <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
          </summary>
          <label className="mt-2 flex min-h-10 items-center justify-between gap-3 rounded-md border border-white/10 bg-[var(--app-surface)] px-3">
            <span className="text-sm text-zinc-200">
              Include AI Instructions
            </span>
            <input
              checked={settings.spreadsheetShareIncludeAiInstructions}
              className="size-5 accent-cyan-500"
              type="checkbox"
              onChange={(event) =>
                void saveSettings({
                  spreadsheetShareIncludeAiInstructions: event.target.checked,
                })
              }
            />
          </label>
          <label className="mt-3 flex min-h-10 items-center justify-between gap-3 rounded-md border border-white/10 bg-[var(--app-surface)] px-3">
            <span className="text-sm text-zinc-200">Include Message</span>
            <input
              checked={settings.spreadsheetShareIncludeMessage}
              className="size-5 accent-cyan-500"
              type="checkbox"
              onChange={(event) =>
                void saveSettings({
                  spreadsheetShareIncludeMessage: event.target.checked,
                })
              }
            />
          </label>
          <Textarea
            className="mt-2 min-h-24 rounded-md border-white/10 bg-[var(--app-surface)] text-base text-zinc-100 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
            disabled={!settings.spreadsheetShareIncludeMessage}
            value={spreadsheetShareMessageDraft}
            onBlur={() => void saveSpreadsheetShareMessage()}
            onChange={(event) =>
              setSpreadsheetShareMessageDraft(event.target.value)
            }
          />
          <label className="mt-3 flex min-h-10 items-center justify-between gap-3 rounded-md border border-white/10 bg-[var(--app-surface)] px-3">
            <span className="text-sm text-zinc-200">
              Attach message as TXT file
            </span>
            <input
              checked={settings.spreadsheetShareAttachMessageAsFile}
              className="size-5 accent-cyan-500"
              type="checkbox"
              onChange={(event) =>
                void saveSettings({
                  spreadsheetShareAttachMessageAsFile: event.target.checked,
                })
              }
            />
          </label>
        </details>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton tone="secondary" onClick={exportSpreadsheet}>
            Download Spreadsheet
          </ActionButton>
          <ActionButton tone="secondary" onClick={shareSpreadsheet}>
            Share
          </ActionButton>
        </div>
      </section>

      <section className="app-surface space-y-3 rounded-md p-3.5">
        <div className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
          Profiles
        </div>
        <div className="space-y-2">
          {settings.profiles.map((profileName) => (
            <div
              className="grid min-h-11 grid-cols-[1fr_2.75rem] items-center gap-2 rounded-md border border-white/10 bg-[var(--app-surface-muted)] px-3"
              key={profileName}
            >
              <span className="min-w-0 truncate text-sm text-zinc-100">
                {profileName}
              </span>
              <button
                className="inline-flex size-9 cursor-pointer items-center justify-center justify-self-end rounded-md text-zinc-500 hover:bg-white/10 hover:text-red-300 disabled:pointer-events-none disabled:opacity-40"
                disabled={settings.profiles.length <= 1}
                title="Delete profile"
                type="button"
                onClick={() => void deleteProfile(profileName)}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Input
            className="h-11 rounded-md border-white/10 bg-[var(--app-surface)] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
            placeholder="New profile"
            value={newProfileName}
            onChange={(event) => setNewProfileName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void addProfile()
              }
            }}
          />
          <ActionButton
            className="w-24 flex-none"
            tone="secondary"
            onClick={addProfile}
          >
            Add
          </ActionButton>
        </div>
      </section>

      <section className="app-surface space-y-3 rounded-md p-3.5">
        <div className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
          Backup
        </div>
        <div className="text-xs text-zinc-500">
          Save or restore all exercises, profiles, workouts, sets, and settings.
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton tone="secondary" onClick={exportJson}>
            Export JSON
          </ActionButton>
          <ActionButton
            disabled={restoreControlsDisabled}
            tone="neutral"
            onClick={() => fileInputRef.current?.click()}
          >
            Import JSON
          </ActionButton>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            disabled={googleDriveBusy || restoreBusy}
            tone="secondary"
            onClick={backupGoogleDrive}
          >
            Backup to Drive
          </ActionButton>
          <ActionButton
            disabled={restoreControlsDisabled}
            tone="neutral"
            onClick={restoreGoogleDrive}
          >
            Restore From Drive
          </ActionButton>
        </div>
        <input
          accept="application/json"
          className="hidden"
          disabled={restoreControlsDisabled}
          ref={fileInputRef}
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0]

            if (file) {
              void importJson(file)
            }
          }}
        />
      </section>

      <details className="app-surface group rounded-md p-3.5">
        <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold uppercase tracking-normal text-zinc-400 [&::-webkit-details-marker]:hidden">
          Set Comment Templates
          <ChevronDown className="size-4 text-zinc-500 transition group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            {settings.setCommentTemplates.map((template) => (
              <div
                className="grid min-h-11 grid-cols-[1fr_2.75rem] items-center gap-2 rounded-md border border-white/10 bg-[var(--app-surface-muted)] px-3"
                key={template}
              >
                <span className="min-w-0 truncate text-sm text-zinc-100">
                  {template}
                </span>
                <button
                  className="inline-flex size-9 cursor-pointer items-center justify-center justify-self-end rounded-md text-zinc-500 hover:bg-white/10 hover:text-red-300"
                  title="Delete comment template"
                  type="button"
                  onClick={() => void deleteSetCommentTemplate(template)}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input
              className="h-11 rounded-md border-white/10 bg-[var(--app-surface)] text-zinc-100 placeholder:text-zinc-600 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
              placeholder="New template"
              value={newSetCommentTemplate}
              onChange={(event) =>
                setNewSetCommentTemplate(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void addSetCommentTemplate()
                }
              }}
            />
            <ActionButton
              className="w-24 flex-none"
              tone="secondary"
              onClick={addSetCommentTemplate}
            >
              Add
            </ActionButton>
          </div>
        </div>
      </details>

      <section className="app-surface rounded-md p-3.5">
        <div className="flex min-h-10 items-center justify-between gap-3">
          <span className="text-sm text-zinc-200">Version</span>
          <span className="font-mono text-xs tabular-nums text-zinc-500">
            {appVersion}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs">
          <a
            className="text-cyan-200 underline decoration-cyan-200/35 underline-offset-4 hover:text-cyan-100"
            href={privacyPolicyPath}
          >
            Privacy Policy
          </a>
          <a
            className="text-cyan-200 underline decoration-cyan-200/35 underline-offset-4 hover:text-cyan-100"
            href={termsOfServicePath}
          >
            Terms of Service
          </a>
        </div>
      </section>

      {pendingRestore && (
        <AlertDialog
          open={Boolean(pendingRestore)}
          onOpenChange={(open) => {
            if (!open) {
              clearPendingRestore()
            }
          }}
        >
          <AlertDialogContent className="rounded-md border-white/10 bg-[var(--app-surface-raised)] text-zinc-100">
            <AlertDialogHeader>
              <AlertDialogTitle>Restore backup?</AlertDialogTitle>
              <AlertDialogDescription
                asChild
                className="space-y-3 text-left text-zinc-400"
              >
                <div>
                  <p>
                    Restoring {restoreSourceLabel(pendingRestore.source)} from{" "}
                    <span className="font-medium text-zinc-200">
                      {pendingRestore.fileName}
                    </span>{" "}
                    will replace local exercises, profiles, workouts, sets, and
                    settings.
                  </p>
                  <div className="rounded-md border border-white/10 bg-[var(--app-surface)] p-3 text-xs">
                    <div>
                      Current:{" "}
                      {formatRestoreDataSummary(pendingRestore.currentSummary)}
                    </div>
                    <div className="mt-1">
                      Incoming:{" "}
                      {formatRestoreDataSummary(pendingRestore.importedSummary)}
                    </div>
                  </div>
                  <p>Cancel leaves the local training log unchanged.</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="border-white/10 bg-[var(--app-surface)]">
              <AlertDialogCancel
                className="rounded-md border-white/10 bg-white/10 text-zinc-100 hover:bg-white/15"
                disabled={restoreBusy}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="rounded-md bg-red-500/20 text-red-100 ring-1 ring-red-400/25 hover:bg-red-500/30"
                disabled={restoreBusy}
                onClick={(event) => {
                  event.preventDefault()
                  void confirmPendingRestore()
                }}
              >
                {restoreBusy ? "Restoring..." : "Restore"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </ScreenContainer>
  )
}
