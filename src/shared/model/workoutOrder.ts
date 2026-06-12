import type { SetEntry, WorkoutExercise } from "@/db/schema"

function timestampMs(iso?: string) {
  if (!iso) {
    return undefined
  }

  const value = new Date(iso).getTime()
  return Number.isFinite(value) ? value : undefined
}

function getFirstFinishedSetMs(sets: SetEntry[] = []) {
  let firstMs = Number.POSITIVE_INFINITY

  for (const set of sets) {
    const finishedMs = timestampMs(set.finishedAt)

    if (finishedMs !== undefined && finishedMs < firstMs) {
      firstMs = finishedMs
    }
  }

  return firstMs === Number.POSITIVE_INFINITY ? undefined : firstMs
}

export function sortWorkoutExercisesByFirstFinishedSet<T extends WorkoutExercise>(
  workoutExercises: T[],
  setsByWorkoutExerciseId: Map<string, SetEntry[]>,
) {
  return [...workoutExercises].sort((a, b) => {
    const aFirstFinishedMs = getFirstFinishedSetMs(
      setsByWorkoutExerciseId.get(a.id),
    )
    const bFirstFinishedMs = getFirstFinishedSetMs(
      setsByWorkoutExerciseId.get(b.id),
    )

    if (
      aFirstFinishedMs !== undefined &&
      bFirstFinishedMs !== undefined &&
      aFirstFinishedMs !== bFirstFinishedMs
    ) {
      return aFirstFinishedMs - bFirstFinishedMs
    }

    if (aFirstFinishedMs !== undefined && bFirstFinishedMs === undefined) {
      return -1
    }

    if (aFirstFinishedMs === undefined && bFirstFinishedMs !== undefined) {
      return 1
    }

    return a.order - b.order
  })
}
