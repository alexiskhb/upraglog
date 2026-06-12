import type { SetEntry, Workout } from "@/db/schema"
import { getSetFinishedTimestampMs } from "./workoutProgress"

function timestampMs(iso?: string) {
  if (!iso) {
    return undefined
  }

  const value = new Date(iso).getTime()
  return Number.isFinite(value) ? value : undefined
}

export function getLatestSetFinishedAt(sets: SetEntry[] = []) {
  let latest: string | undefined
  let latestMs = Number.NEGATIVE_INFINITY

  for (const set of sets) {
    const finishedMs = getSetFinishedTimestampMs(set)

    if (finishedMs !== undefined && finishedMs > latestMs) {
      latest = set.finishedAt
      latestMs = finishedMs
    }
  }

  return latest
}

export function getLatestSetFinishedAtAfterWorkoutStart({
  workout,
  sets,
}: {
  workout?: Workout
  sets: SetEntry[]
}) {
  if (!workout?.startedAt) {
    return undefined
  }

  const startedMs = timestampMs(workout.startedAt)

  if (startedMs === undefined) {
    return undefined
  }

  const latestSetFinishedAt = getLatestSetFinishedAt(sets)
  const latestSetFinishedMs = timestampMs(latestSetFinishedAt)

  if (
    latestSetFinishedAt === undefined ||
    latestSetFinishedMs === undefined ||
    latestSetFinishedMs < startedMs
  ) {
    return undefined
  }

  return latestSetFinishedAt
}

export function isWorkoutTimerActive({
  workout,
}: {
  workout?: Workout
}) {
  return Boolean(workout?.startedAt && !workout.endedAt)
}

export function getAutoFinishedWorkoutEndedAt({
  workout,
  sets,
}: {
  workout?: Workout
  sets: SetEntry[]
}) {
  if (!workout?.startedAt || workout.endedAt || sets.length === 0) {
    return undefined
  }

  if (sets.some((set) => !set.finishedAt)) {
    return undefined
  }

  return getLatestSetFinishedAtAfterWorkoutStart({ workout, sets })
}
