import { useEffect, useState } from "react"
import type { Workout } from "@/db/schema"
import { formatDuration } from "@/shared/model/dates"
import { useAppStore } from "@/shared/store/appStore"
import {
  type WorkoutTimerSize,
  workoutTimerClassName,
} from "./workoutTimerStyles"

type WorkoutActiveTimerProps = {
  workout?: Workout
  size?: WorkoutTimerSize
  className?: string
  nowMs?: number
}

export function WorkoutActiveTimer({
  workout,
  size = "compact",
  className,
  nowMs,
}: WorkoutActiveTimerProps) {
  const openDialog = useAppStore((state) => state.openDialog)
  const [internalNowMs, setInternalNowMs] = useState(() => Date.now())
  const active = Boolean(workout?.startedAt && !workout.endedAt)
  const hasTimer = Boolean(workout?.startedAt)
  const displayNowMs = nowMs ?? internalNowMs

  useEffect(() => {
    if (!active || nowMs !== undefined) {
      return
    }

    const interval = window.setInterval(() => {
      setInternalNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [active, nowMs, workout?.startedAt])

  if (!hasTimer) {
    return null
  }

  const startedMs = new Date(workout?.startedAt ?? "").getTime()
  const endedMs = new Date(workout?.endedAt ?? "").getTime()
  const displayEndMs =
    active || !Number.isFinite(endedMs) ? displayNowMs : endedMs
  const elapsedSeconds = Number.isFinite(startedMs)
    ? Math.max(0, Math.floor((displayEndMs - startedMs) / 1000))
    : 0

  return (
    <button
      className={workoutTimerClassName({
        active,
        className,
        size,
      })}
      title="Workout timer"
      type="button"
      onClick={() => openDialog("timer")}
    >
      {formatDuration(elapsedSeconds)}
    </button>
  )
}
