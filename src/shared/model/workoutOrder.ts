import type { SetEntry, WorkoutExercise } from "@/db/schema"
import {
  compareFirstFinishedSetOrderKeys,
  getFirstFinishedSetOrderKey,
} from "./workoutProgress"

export function sortWorkoutExercisesByFirstFinishedSet<T extends WorkoutExercise>(
  workoutExercises: T[],
  setsByWorkoutExerciseId: Map<string, SetEntry[]>,
) {
  return [...workoutExercises].sort((a, b) => {
    return compareFirstFinishedSetOrderKeys(
      getFirstFinishedSetOrderKey(setsByWorkoutExerciseId.get(a.id), a.order),
      getFirstFinishedSetOrderKey(setsByWorkoutExerciseId.get(b.id), b.order),
    )
  })
}
