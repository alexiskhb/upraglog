import { useEffect, useState } from "react"
import type { SetEntry, Workout } from "@/db/schema"
import { formatDuration } from "@/shared/model/dates"
import { getEffectiveWorkoutEndedAt } from "@/shared/model/workoutTimer"
import { useAppStore } from "@/shared/store/appStore"
import { cn } from "@/lib/utils"

type WorkoutActiveTimerProps = {
  workout?: Workout
  sets?: SetEntry[]
  treatLongTimerAsLatestSetFinish?: boolean
  className?: string
}

export function WorkoutActiveTimer({
  workout,
  sets = [],
  treatLongTimerAsLatestSetFinish = false,
  className,
}: WorkoutActiveTimerProps) {
  const openDialog = useAppStore((state) => state.openDialog)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const effectiveEndedAt = getEffectiveWorkoutEndedAt({
    workout,
    sets,
    treatLongTimerAsLatestSetFinish,
    nowMs,
  })
  const active = Boolean(workout?.startedAt && !effectiveEndedAt)

  useEffect(() => {
    if (!active) {
      return
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [active, workout?.startedAt, treatLongTimerAsLatestSetFinish])

  if (!active) {
    return null
  }

  const startedMs = new Date(workout?.startedAt ?? "").getTime()
  const elapsedSeconds = Number.isFinite(startedMs)
    ? Math.max(0, Math.floor((nowMs - startedMs) / 1000))
    : 0

  return (
    <button
      className={cn(
        "shrink-0 cursor-pointer rounded-sm px-1 py-0.5 font-mono text-xs font-semibold tabular-nums text-cyan-300 transition hover:bg-cyan-400/10 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
        className,
      )}
      title="Workout timer"
      type="button"
      onClick={() => openDialog("timer")}
    >
      {formatDuration(elapsedSeconds)}
    </button>
  )
}
