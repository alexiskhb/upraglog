import { useState } from "react"
import { copyOrMoveWorkout } from "@/db/repositories/workoutsRepo"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useAppStore } from "@/shared/store/appStore"
import { ActionButton } from "@/shared/ui/ActionButton"
import { todayString } from "@/shared/model/dates"

export function CopyMoveWorkoutDialog() {
  const selectedDate = useAppStore((state) => state.selectedDate)
  const activeDialog = useAppStore((state) => state.activeDialog)
  const closeDialog = useAppStore((state) => state.closeDialog)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const open = activeDialog === "copyMove"
  const [sourceDate, setSourceDate] = useState(selectedDate)
  const [targetDate, setTargetDate] = useState(todayString())
  const [mode, setMode] = useState<"copy" | "move">("copy")
  const [overwriteTarget, setOverwriteTarget] = useState(false)
  const [message, setMessage] = useState<string | undefined>()

  const runCopyMove = async () => {
    if (sourceDate === targetDate) {
      setMessage("Choose two different dates.")
      return
    }

    try {
      await copyOrMoveWorkout(sourceDate, targetDate, mode, overwriteTarget)
      bumpRefresh()
      setMessage(mode === "copy" ? "Workout copied." : "Workout moved.")
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Copy/move failed.",
      )
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeDialog()
        }
      }}
    >
      <DialogContent className="rounded-sm border-zinc-800 bg-[#15191e] text-zinc-100">
        <DialogHeader>
          <DialogTitle>Copy/Move Workout</DialogTitle>
        </DialogHeader>
        {message && (
          <div className="rounded-sm border border-cyan-500/25 bg-cyan-950/20 px-3 py-2 text-sm text-cyan-100">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            className={`h-10 rounded-sm border text-sm uppercase ${
              mode === "copy"
                ? "border-cyan-500 bg-cyan-500/15 text-cyan-100"
                : "border-zinc-700 text-zinc-300"
            }`}
            type="button"
            onClick={() => setMode("copy")}
          >
            Copy
          </button>
          <button
            className={`h-10 rounded-sm border text-sm uppercase ${
              mode === "move"
                ? "border-cyan-500 bg-cyan-500/15 text-cyan-100"
                : "border-zinc-700 text-zinc-300"
            }`}
            type="button"
            onClick={() => setMode("move")}
          >
            Move
          </button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Source Date
          </Label>
          <Input
            className="h-11 rounded-sm border-cyan-500/35 bg-[#090b0d] text-base text-zinc-100 focus-visible:ring-cyan-500"
            type="date"
            value={sourceDate}
            onChange={(event) => setSourceDate(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Target Date
          </Label>
          <Input
            className="h-11 rounded-sm border-cyan-500/35 bg-[#090b0d] text-base text-zinc-100 focus-visible:ring-cyan-500"
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
          />
        </div>

        <label className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
          <span className="text-sm text-zinc-200">Overwrite target date</span>
          <Switch
            checked={overwriteTarget}
            className="data-checked:bg-cyan-500"
            onCheckedChange={setOverwriteTarget}
          />
        </label>

        <div className="flex gap-2">
          <ActionButton tone="save" onClick={runCopyMove}>
            {mode === "copy" ? "Copy" : "Move"}
          </ActionButton>
          <ActionButton tone="secondary" onClick={closeDialog}>
            Clear
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
