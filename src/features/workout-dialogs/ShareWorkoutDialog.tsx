import { useEffect, useState } from "react"
import {
  generateWorkoutSummary,
  getWorkoutDetailByDate,
} from "@/db/repositories/workoutsRepo"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAppStore } from "@/shared/store/appStore"
import { ActionButton } from "@/shared/ui/ActionButton"
import { downloadTextFile } from "@/features/backup/exportJson"

type ShareNavigator = Navigator & {
  share?: (data: { title: string; text: string }) => Promise<void>
}

export function ShareWorkoutDialog() {
  const selectedDate = useAppStore((state) => state.selectedDate)
  const activeDialog = useAppStore((state) => state.activeDialog)
  const closeDialog = useAppStore((state) => state.closeDialog)
  const refreshVersion = useAppStore((state) => state.refreshVersion)
  const [summary, setSummary] = useState("")
  const [message, setMessage] = useState<string | undefined>()
  const open = activeDialog === "share"

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false

    generateWorkoutSummary(selectedDate).then((text) => {
      if (!cancelled) {
        setSummary(text)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, refreshVersion, selectedDate])

  const copySummary = async () => {
    await navigator.clipboard.writeText(summary)
    setMessage("Workout copied.")
  }

  const shareSummary = async () => {
    const shareNavigator = navigator as ShareNavigator

    if (!shareNavigator.share) {
      setMessage("Web Share is not available in this browser.")
      return
    }

    await shareNavigator.share({
      title: `Workout ${selectedDate}`,
      text: summary,
    })
  }

  const exportWorkoutJson = async () => {
    const workout = await getWorkoutDetailByDate(selectedDate)
    downloadTextFile(
      `upraglog-workout-${selectedDate}.json`,
      JSON.stringify(workout, null, 2),
    )
    setMessage("Workout JSON exported.")
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
      <DialogContent className="rounded-md border-white/10 bg-[var(--app-surface-raised)] text-zinc-100 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Share Workout</DialogTitle>
        </DialogHeader>
        {message && (
          <div className="rounded-md border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
            {message}
          </div>
        )}
        <Textarea
          className="min-h-56 rounded-md border-white/10 bg-[var(--app-surface-muted)] font-mono text-sm text-zinc-100 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
          readOnly
          value={summary}
        />
        <div className="grid grid-cols-3 gap-2">
          <ActionButton tone="secondary" onClick={copySummary}>
            Copy
          </ActionButton>
          <ActionButton tone="secondary" onClick={shareSummary}>
            Share
          </ActionButton>
          <ActionButton tone="neutral" onClick={exportWorkoutJson}>
            JSON
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
