import type { SetEntry, Workout } from "@/db/schema"

export const longWorkoutTimerThresholdSeconds = 3 * 60 * 60

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
    const finishedMs = timestampMs(set.finishedAt)

    if (finishedMs !== undefined && finishedMs > latestMs) {
      latest = set.finishedAt
      latestMs = finishedMs
    }
  }

  return latest
}

export function getEffectiveWorkoutEndedAt({
  workout,
  sets = [],
  treatLongTimerAsLatestSetFinish,
  nowMs = Date.now(),
}: {
  workout?: Workout
  sets?: SetEntry[]
  treatLongTimerAsLatestSetFinish: boolean
  nowMs?: number
}) {
  if (!workout?.startedAt) {
    return undefined
  }

  if (workout.endedAt) {
    return workout.endedAt
  }

  if (!treatLongTimerAsLatestSetFinish) {
    return undefined
  }

  const startedMs = timestampMs(workout.startedAt)

  if (startedMs === undefined) {
    return undefined
  }

  const elapsedSeconds = Math.floor((nowMs - startedMs) / 1000)

  if (elapsedSeconds <= longWorkoutTimerThresholdSeconds) {
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
  sets = [],
  treatLongTimerAsLatestSetFinish,
  nowMs = Date.now(),
}: {
  workout?: Workout
  sets?: SetEntry[]
  treatLongTimerAsLatestSetFinish: boolean
  nowMs?: number
}) {
  return Boolean(
    workout?.startedAt &&
      !getEffectiveWorkoutEndedAt({
        workout,
        sets,
        treatLongTimerAsLatestSetFinish,
        nowMs,
      }),
  )
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

  return getLatestSetFinishedAt(sets)
}
