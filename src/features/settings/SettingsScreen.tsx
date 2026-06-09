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
        <div className="mt-2 h-px bg-cyan-500/70" />
      </div>

      {message && (
        <div className="rounded-sm border border-cyan-500/25 bg-cyan-950/20 px-3 py-2 text-sm text-cyan-100">
          {message}
        </div>
      )}

      <section className="space-y-4 rounded-sm bg-[#15191e] p-3">
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-zinc-400">
            Unit System
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`h-11 rounded-sm border text-sm ${
                settings.unitSystem === "metric"
                  ? "border-cyan-500 bg-cyan-500/15 text-cyan-100"
                  : "border-zinc-700 text-zinc-300"
              }`}
              type="button"
              onClick={() => void saveSettings({ unitSystem: "metric" })}
            >
              Metric / kg
            </button>
            <button
              className={`h-11 rounded-sm border text-sm ${
                settings.unitSystem === "imperial"
                  ? "border-cyan-500 bg-cyan-500/15 text-cyan-100"
                  : "border-zinc-700 text-zinc-300"
              }`}
              type="button"
              onClick={() => void saveSettings({ unitSystem: "imperial" })}
            >
              Imperial / lbs
            </button>
          </div>
        </div>

        <label className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
          <span>
            <Label className="text-sm text-zinc-200">
              Keep Screen On
            </Label>
            <span className="mt-1 block text-xs text-zinc-500">
              Applies while Training Screen is open.
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

      <section className="space-y-3 rounded-sm bg-[#15191e] p-3">
        <div className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
          Backup
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton tone="secondary" onClick={exportJson}>
            Export Backup
          </ActionButton>
          <ActionButton
            tone="secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Import Backup
          </ActionButton>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <ActionButton
            tone="neutral"
            onClick={() => void showGoogleDriveStatus("backup")}
          >
            Drive Backup
          </ActionButton>
          <ActionButton
            tone="neutral"
            onClick={() => void showGoogleDriveStatus("restore")}
          >
            Drive Restore
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
