import { useEffect, useRef, useState } from "react"
import type { AppSettings } from "@/db/schema"
import { getSettings, updateSettings } from "@/db/repositories/settingsRepo"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { ActionButton } from "@/shared/ui/ActionButton"
import { useAppStore } from "@/shared/store/appStore"
import {
  downloadTextFile,
  exportBackupJson,
} from "@/features/backup/exportJson"
import { exportTrainingLogCsv } from "@/features/backup/exportTrainingLogCsv"
import { parseBackupJson, restoreBackup } from "@/features/backup/importJson"
import {
  backupToGoogleDrive,
  restoreFromGoogleDrive,
} from "@/features/backup/googleDriveBackup"

export function SettingsScreen() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const [settings, setSettings] = useState<AppSettings>({
    unitSystem: "metric",
    keepScreenOnDuringTraining: true,
  })
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
    setSettings({
      unitSystem: updated.unitSystem,
      keepScreenOnDuringTraining: updated.keepScreenOnDuringTraining,
    })
    bumpRefresh()
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

  const showGoogleDriveStatus = async (mode: "backup" | "restore") => {
    const status =
      mode === "backup" ? await backupToGoogleDrive() : await restoreFromGoogleDrive()
    setMessage(status)
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
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-zinc-400">
            Default Unit System
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`h-11 cursor-pointer rounded-md border text-sm transition ${
                settings.unitSystem === "metric"
                  ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
              type="button"
              onClick={() => void saveSettings({ unitSystem: "metric" })}
            >
              Metric / kg
            </button>
            <button
              className={`h-11 cursor-pointer rounded-md border text-sm transition ${
                settings.unitSystem === "imperial"
                  ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
              }`}
              type="button"
              onClick={() => void saveSettings({ unitSystem: "imperial" })}
            >
              Imperial / lbs
            </button>
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span>
            <Label className="text-sm text-zinc-200">
              Keep Screen On
            </Label>
            <span className="mt-1 block text-xs text-zinc-500">
              Applies throughout Upraglog.
            </span>
          </span>
          <Switch
            checked={settings.keepScreenOnDuringTraining}
            className="data-checked:bg-cyan-500"
            onCheckedChange={(keepScreenOnDuringTraining) =>
              void saveSettings({ keepScreenOnDuringTraining })
            }
          />
        </label>
      </section>

      <section className="app-surface space-y-3 rounded-md p-3.5">
        <div className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
          Backup
        </div>
        <ActionButton tone="secondary" onClick={exportSpreadsheet}>
          Spreadsheet Export
        </ActionButton>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton tone="secondary" onClick={exportJson}>
            Export to Local Storage
          </ActionButton>
          <ActionButton
            tone="secondary"
            onClick={() => void showGoogleDriveStatus("backup")}
          >
            Export to Drive
          </ActionButton>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            tone="neutral"
            onClick={() => fileInputRef.current?.click()}
          >
            Import From Local Storage
          </ActionButton>
          <ActionButton
            tone="neutral"
            onClick={() => void showGoogleDriveStatus("restore")}
          >
            Import From Drive
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
