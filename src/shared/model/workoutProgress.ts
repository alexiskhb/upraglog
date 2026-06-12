import type {
  SetEntry,
  WorkoutDayDetail,
  WorkoutExerciseDetail,
} from "@/db/schema"

export type SetProgress = {
  finishedSets: number
  totalSets: number
  percentComplete: number
}

export type ExerciseProgress = SetProgress

export type WorkoutProgress = SetProgress

export type FirstFinishedSetOrderKey = {
  firstFinishedSetMs?: number
  order: number
}

type SetFinishedState = Pick<SetEntry, "finishedAt">

function isSetFinishedStateArray(
  input: unknown,
): input is readonly SetFinishedState[] {
  return Array.isArray(input)
}

function timestampMs(iso?: string) {
  if (!iso) {
    return undefined
  }

  const value = new Date(iso).getTime()
  return Number.isFinite(value) ? value : undefined
}

export function getSetFinishedTimestampMs(set: SetFinishedState) {
  return timestampMs(set.finishedAt)
}

export function countFinishedSets(sets: readonly SetFinishedState[] = []) {
  return sets.filter((set) => Boolean(set.finishedAt)).length
}

export function countTotalSets(sets: readonly unknown[] = []) {
  return sets.length
}

export function getSetProgress(
  sets: readonly SetFinishedState[] = [],
): SetProgress {
  const totalSets = countTotalSets(sets)
  const finishedSets = countFinishedSets(sets)

  return {
    finishedSets,
    totalSets,
    percentComplete:
      totalSets === 0 ? 0 : Math.round((finishedSets / totalSets) * 100),
  }
}

export function getExerciseProgress(
  input?: WorkoutExerciseDetail | readonly SetFinishedState[],
): ExerciseProgress {
  if (isSetFinishedStateArray(input)) {
    return getSetProgress(input)
  }

  return getSetProgress(input?.sets)
}

export function getWorkoutProgress(
  input?: WorkoutDayDetail | readonly SetFinishedState[],
): WorkoutProgress {
  if (isSetFinishedStateArray(input)) {
    return getSetProgress(input)
  }

  return getSetProgress(input?.exercises.flatMap((entry) => entry.sets))
}

export function getFirstFinishedSetTimestampMs(
  sets: readonly SetFinishedState[] = [],
) {
  let firstMs = Number.POSITIVE_INFINITY

  for (const set of sets) {
    const finishedMs = getSetFinishedTimestampMs(set)

    if (finishedMs !== undefined && finishedMs < firstMs) {
      firstMs = finishedMs
    }
  }

  return firstMs === Number.POSITIVE_INFINITY ? undefined : firstMs
}

export function getFirstFinishedSetOrderKey(
  sets: readonly SetFinishedState[] = [],
  order = 0,
): FirstFinishedSetOrderKey {
  return {
    firstFinishedSetMs: getFirstFinishedSetTimestampMs(sets),
    order,
  }
}

export function compareFirstFinishedSetOrderKeys(
  a: FirstFinishedSetOrderKey,
  b: FirstFinishedSetOrderKey,
) {
  if (
    a.firstFinishedSetMs !== undefined &&
    b.firstFinishedSetMs !== undefined &&
    a.firstFinishedSetMs !== b.firstFinishedSetMs
  ) {
    return a.firstFinishedSetMs - b.firstFinishedSetMs
  }

  if (
    a.firstFinishedSetMs !== undefined &&
    b.firstFinishedSetMs === undefined
  ) {
    return -1
  }

  if (
    a.firstFinishedSetMs === undefined &&
    b.firstFinishedSetMs !== undefined
  ) {
    return 1
  }

  return a.order - b.order
}
