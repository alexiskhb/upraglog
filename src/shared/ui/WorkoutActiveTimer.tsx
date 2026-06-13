import { useEffect, useState } from "react"
import type { Workout } from "@/db/schema"
import { formatDuration } from "@/shared/model/dates"
import { useAppStore } from "@/shared/store/appStore"
import { cn } from "@/lib/utils"

type WorkoutActiveTimerProps = {
  workout?: Workout
  size?: "compact" | "large"
  className?: string
}

export function WorkoutActiveTimer({
  workout,
  size = "compact",
  className,
}: WorkoutActiveTimerProps) {
  const openDialog = useAppStore((state) => state.openDialog)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const active = Boolean(workout?.startedAt && !workout.endedAt)
  const hasTimer = Boolean(workout?.startedAt)

  useEffect(() => {
    if (!active) {
      return
    }

    const interval = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [active, workout?.startedAt])

  if (!hasTimer) {
    return null
  }

  const startedMs = new Date(workout?.startedAt ?? "").getTime()
  const endedMs = new Date(workout?.endedAt ?? "").getTime()
  const displayEndMs = active || !Number.isFinite(endedMs) ? nowMs : endedMs
  const elapsedSeconds = Number.isFinite(startedMs)
    ? Math.max(0, Math.floor((displayEndMs - startedMs) / 1000))
    : 0

  return (
    <button
      className={cn(
        "shrink-0 cursor-pointer rounded-sm font-mono font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-2",
        active || size !== "large"
          ? "text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-100 focus-visible:ring-cyan-400"
          : "text-teal-400 hover:bg-teal-400/10 hover:text-teal-200 focus-visible:ring-teal-400",
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
