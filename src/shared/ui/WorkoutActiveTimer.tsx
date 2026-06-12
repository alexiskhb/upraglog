import { useEffect, useState } from "react"
import type { SetEntry, Workout } from "@/db/schema"
import { formatDuration } from "@/shared/model/dates"
import { defaultAppSettings } from "@/shared/model/settings"
import { getEffectiveWorkoutEndedAt } from "@/shared/model/workoutTimer"
import { useAppStore } from "@/shared/store/appStore"
import { cn } from "@/lib/utils"

type WorkoutActiveTimerProps = {
  workout?: Workout
  sets?: SetEntry[]
  treatLongTimerAsLatestSetFinish?: boolean
  size?: "compact" | "large"
  className?: string
}

export function WorkoutActiveTimer({
  workout,
  sets = [],
  treatLongTimerAsLatestSetFinish =
    defaultAppSettings.treatLongWorkoutTimerAsLatestSetFinish,
  size = "compact",
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
        "shrink-0 cursor-pointer rounded-sm font-mono font-semibold tabular-nums text-cyan-300 transition hover:bg-cyan-400/10 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
        size === "large"
          ? "px-1.5 py-0.5 text-3xl leading-9"
          : "px-1 py-0.5 text-xs leading-none",
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
