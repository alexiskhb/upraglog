import { useEffect, useState } from "react"
import type { Workout } from "@/db/schema"
import { formatDuration } from "@/shared/model/dates"
import { cn } from "@/lib/utils"

type WorkoutActiveTimerProps = {
  workout?: Workout
  className?: string
}

export function WorkoutActiveTimer({
  workout,
  className,
}: WorkoutActiveTimerProps) {
  const [nowMs, setNowMs] = useState(() => Date.now())
  const active = Boolean(workout?.startedAt && !workout.endedAt)

  useEffect(() => {
    if (!active) {
      return
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [active, workout?.startedAt])

  if (!active) {
    return null
  }

  const startedMs = new Date(workout?.startedAt ?? "").getTime()
  const elapsedSeconds = Number.isFinite(startedMs)
    ? Math.max(0, Math.round((nowMs - startedMs) / 1000))
    : 0

  return (
    <span
      className={cn(
        "shrink-0 font-mono text-xs font-semibold tabular-nums text-cyan-300",
        className,
      )}
    >
      {formatDuration(elapsedSeconds)}
    </span>
  )
}
