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
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19)
}

function fromDateTimeInputValue(value: string) {
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export function WorkoutTimerDialog() {
  const selectedDate = useAppStore((state) => state.selectedDate)
  const selectedProfile = useAppStore((state) => state.selectedProfile)
  const activeDialog = useAppStore((state) => state.activeDialog)
  const closeDialog = useAppStore((state) => state.closeDialog)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const open = activeDialog === "timer"
  const [startedAt, setStartedAt] = useState("")
  const [endedAt, setEndedAt] = useState("")
  const [startedAtIso, setStartedAtIso] = useState<string | undefined>()
  const [endedAtIso, setEndedAtIso] = useState<string | undefined>()
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [message, setMessage] = useState<string | undefined>()

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false

    getWorkoutByDate(selectedDate, selectedProfile).then((workout) => {
      if (!cancelled) {
        setStartedAt(toDateTimeInputValue(workout?.startedAt))
        setEndedAt(toDateTimeInputValue(workout?.endedAt))
        setStartedAtIso(workout?.startedAt)
        setEndedAtIso(workout?.endedAt)
        setNowMs(Date.now())
        setMessage(undefined)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, selectedDate, selectedProfile])

  useEffect(() => {
    if (!open || !startedAtIso || endedAtIso) {
      return
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [endedAtIso, open, startedAtIso])

  const active = Boolean(startedAtIso && !endedAtIso)
  const durationSeconds =
    active && startedAtIso
      ? Math.max(
          0,
          Math.floor((nowMs - new Date(startedAtIso).getTime()) / 1000),
        )
      : getWorkoutDurationSeconds(startedAtIso, endedAtIso)

  const saveTimerIso = async (
    nextStartedAt: string | undefined,
    nextEndedAt: string | undefined,
    nextMessage = "Timer saved.",
  ) => {
    await updateWorkoutTimer(selectedDate, selectedProfile, {
      startedAt: nextStartedAt,
      endedAt: nextEndedAt,
    })
    setStartedAtIso(nextStartedAt)
    setEndedAtIso(nextEndedAt)
    bumpRefresh()
    setMessage(nextMessage)
  }

  const saveTimer = async (nextStartedAt = startedAt, nextEndedAt = endedAt) => {
    await saveTimerIso(
      fromDateTimeInputValue(nextStartedAt),
      fromDateTimeInputValue(nextEndedAt),
    )
  }

  const startTimer = async () => {
    const now = new Date()
    const nowIso = now.toISOString()
    setNowMs(now.getTime())
    setStartedAt(toDateTimeInputValue(nowIso))
    setEndedAt("")
    await saveTimerIso(nowIso, undefined, "Workout started.")
  }

  const stopTimer = async () => {
    const now = new Date()
    const nowIso = now.toISOString()
    const nextStartedAt = startedAtIso ?? nowIso
    setNowMs(now.getTime())
    setStartedAt(toDateTimeInputValue(nextStartedAt))
    setEndedAt(toDateTimeInputValue(nowIso))
    await saveTimerIso(nextStartedAt, nowIso, "Workout stopped.")
  }

  const clearTimer = async () => {
    setNowMs(Date.now())
    setStartedAt("")
    setEndedAt("")
    await saveTimerIso(undefined, undefined, "Timer cleared.")
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
            step={1}
            value={startedAt}
            onChange={(event) => {
              const nextValue = event.target.value
              setStartedAt(nextValue)
              setStartedAtIso(fromDateTimeInputValue(nextValue))
            }}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Manual End Time
          </Label>
          <Input
            className="h-11 rounded-md border-white/10 bg-[var(--app-surface-muted)] text-base text-zinc-100 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
            type="datetime-local"
            step={1}
            value={endedAt}
            onChange={(event) => {
              const nextValue = event.target.value
              setEndedAt(nextValue)
              setEndedAtIso(fromDateTimeInputValue(nextValue))
            }}
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
