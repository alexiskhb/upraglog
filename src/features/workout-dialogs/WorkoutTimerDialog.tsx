import { useEffect, useState } from "react"
import {
  getWorkoutByDate,
  updateWorkoutTimer,
} from "@/db/repositories/workoutsRepo"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/shared/store/appStore"
import { ActionButton } from "@/shared/ui/ActionButton"
import { formatDuration, getWorkoutDurationSeconds } from "@/shared/model/dates"

function toDateTimeInputValue(iso?: string) {
  if (!iso) {
    return ""
  }

  const date = new Date(iso)
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function fromDateTimeInputValue(value: string) {
  return value ? new Date(value).toISOString() : undefined
}

export function WorkoutTimerDialog() {
  const selectedDate = useAppStore((state) => state.selectedDate)
  const activeDialog = useAppStore((state) => state.activeDialog)
  const closeDialog = useAppStore((state) => state.closeDialog)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const open = activeDialog === "timer"
  const [startedAt, setStartedAt] = useState("")
  const [endedAt, setEndedAt] = useState("")
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [message, setMessage] = useState<string | undefined>()

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false

    getWorkoutByDate(selectedDate).then((workout) => {
      if (!cancelled) {
        setStartedAt(toDateTimeInputValue(workout?.startedAt))
        setEndedAt(toDateTimeInputValue(workout?.endedAt))
        setMessage(undefined)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, selectedDate])

  useEffect(() => {
    if (!open || !startedAt || endedAt) {
      return
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [endedAt, open, startedAt])

  const startedIso = fromDateTimeInputValue(startedAt)
  const endedIso = fromDateTimeInputValue(endedAt)
  const active = Boolean(startedIso && !endedIso)
  const durationSeconds =
    active && startedIso
      ? Math.max(0, Math.round((nowMs - new Date(startedIso).getTime()) / 1000))
      : getWorkoutDurationSeconds(startedIso, endedIso)

  const saveTimer = async (nextStartedAt = startedAt, nextEndedAt = endedAt) => {
    await updateWorkoutTimer(selectedDate, {
      startedAt: fromDateTimeInputValue(nextStartedAt),
      endedAt: fromDateTimeInputValue(nextEndedAt),
    })
    bumpRefresh()
    setMessage("Timer saved.")
  }

  const startTimer = async () => {
    const now = toDateTimeInputValue(new Date().toISOString())
    setNowMs(Date.now())
    setStartedAt(now)
    setEndedAt("")
    await saveTimer(now, "")
  }

  const stopTimer = async () => {
    const now = toDateTimeInputValue(new Date().toISOString())
    const nextStartedAt = startedAt || now
    setNowMs(Date.now())
    setStartedAt(nextStartedAt)
    setEndedAt(now)
    await saveTimer(nextStartedAt, now)
  }

  const clearTimer = async () => {
    setNowMs(Date.now())
    setStartedAt("")
    setEndedAt("")
    await updateWorkoutTimer(selectedDate, {
      startedAt: undefined,
      endedAt: undefined,
    })
    bumpRefresh()
    setMessage("Timer cleared.")
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
          <DialogTitle>Workout Timer</DialogTitle>
        </DialogHeader>
        {message && (
          <div className="rounded-md border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
            {message}
          </div>
        )}

        <div className="rounded-md border border-cyan-300/20 bg-[var(--app-surface-muted)] py-6 text-center">
          <div className="text-xs uppercase tracking-normal text-zinc-500">
            Duration
          </div>
          <div className="mt-1 text-4xl font-medium tabular-nums text-cyan-100">
            {formatDuration(durationSeconds)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ActionButton tone="save" onClick={startTimer}>
            {active ? "Restart Workout" : "Start Workout"}
          </ActionButton>
          <ActionButton tone="delete" onClick={stopTimer}>
            Stop Workout
          </ActionButton>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Manual Start Time
          </Label>
          <Input
            className="h-11 rounded-md border-white/10 bg-[var(--app-surface-muted)] text-base text-zinc-100 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
            type="datetime-local"
            value={startedAt}
            onChange={(event) => setStartedAt(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Manual End Time
          </Label>
          <Input
            className="h-11 rounded-md border-white/10 bg-[var(--app-surface-muted)] text-base text-zinc-100 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
            type="datetime-local"
            value={endedAt}
            onChange={(event) => setEndedAt(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <ActionButton tone="secondary" onClick={() => saveTimer()}>
            Update Timer
          </ActionButton>
          <ActionButton tone="neutral" onClick={clearTimer}>
            Clear Timer
          </ActionButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
