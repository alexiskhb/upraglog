import { useEffect, useRef, useState } from "react"
import { Trash2 } from "lucide-react"
import type { AppSettings } from "@/db/schema"
import { getSettings, updateSettings } from "@/db/repositories/settingsRepo"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { ActionButton } from "@/shared/ui/ActionButton"
import { useAppStore } from "@/shared/store/appStore"
import {
  defaultProfileName,
  defaultProfileNames,
  normalizeProfileName,
} from "@/shared/model/profiles"
import {
  downloadTextFile,
  exportBackupJson,
} from "@/features/backup/exportJson"
import { exportTrainingLogCsv } from "@/features/backup/exportTrainingLogCsv"
import { parseBackupJson, restoreBackup } from "@/features/backup/importJson"

export function SettingsScreen() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const setProfileState = useAppStore((state) => state.setProfileState)
  const [settings, setSettings] = useState<AppSettings>({
    keepScreenOn: true,
    skipEmptyDaysOnDayNavigation: false,
    profiles: [...defaultProfileNames],
    selectedProfile: defaultProfileName,
    exportAllProfiles: false,
  })
  const [newProfileName, setNewProfileName] = useState("")
  const [message, setMessage] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false

    getSettings().then((appSettings) => {
      if (!cancelled) {
        setSettings(appSettings)
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

  const exportJson = async () => {
    const text = await exportBackupJson()
    downloadTextFile(`upraglog-backup-${new Date().toISOString()}.json`, text)
    setMessage("Backup exported.")
  }

  const exportSpreadsheet = async () => {
    const { filename, text } = await exportTrainingLogCsv()

    downloadTextFile(filename, text, "text/csv;charset=utf-8")
    setMessage("Spreadsheet CSV exported.")
  }

  const importJson = async (file: File) => {
    try {
      const text = await file.text()
      const backup = parseBackupJson(text)
      await restoreBackup(backup)
      const appSettings = await getSettings()
      setSettings(appSettings)
      setProfileState(appSettings.profiles, appSettings.selectedProfile)
      bumpRefresh()
      setMessage("Backup imported.")
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Backup import failed.",
      )
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <ScreenContainer className="gap-4">
      <div className="pt-3">
        <h1 className="text-[17px] font-semibold text-zinc-50">Settings</h1>
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
        <ActionButton tone="secondary" onClick={exportSpreadsheet}>
          Spreadsheet Export
        </ActionButton>
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
            Export to Local Storage
          </ActionButton>
          <ActionButton
            tone="neutral"
            onClick={() => fileInputRef.current?.click()}
          >
            Import From Local Storage
          </ActionButton>
        </div>
        <input
          accept="application/json"
          className="hidden"
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
    </ScreenContainer>
  )
}
