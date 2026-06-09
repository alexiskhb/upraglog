import { db } from "@/db/db"
import type {
  SetEntry,
  SetEntryInput,
  Workout,
  WorkoutDayDetail,
  WorkoutExercise,
  WorkoutExerciseDetail,
} from "@/db/schema"
import { createId } from "@/shared/model/ids"

function byOrder<T extends { order: number }>(a: T, b: T) {
  return a.order - b.order
}

async function reindexWorkoutExercises(workoutId: string) {
  const rows = await db.workoutExercises
    .where("workoutId")
    .equals(workoutId)
    .sortBy("order")

  await Promise.all(
    rows.map((row, index) =>
      db.workoutExercises.update(row.id, {
        order: index,
        updatedAt: new Date().toISOString(),
      }),
    ),
  )
}

async function reindexSets(workoutExerciseId: string) {
  const rows = await db.sets
    .where("workoutExerciseId")
    .equals(workoutExerciseId)
    .sortBy("order")

  await Promise.all(
    rows.map((row, index) =>
      db.sets.update(row.id, {
        order: index,
        updatedAt: new Date().toISOString(),
      }),
    ),
  )
}

export async function getWorkoutByDate(localDate: string) {
  return db.workouts.where("localDate").equals(localDate).first()
}

export async function getOrCreateWorkout(localDate: string) {
  const existing = await getWorkoutByDate(localDate)

  if (existing) {
    return existing
  }

  const now = new Date().toISOString()
  const workout: Workout = {
    id: createId("workout"),
    localDate,
    createdAt: now,
    updatedAt: now,
  }

  await db.workouts.add(workout)
  return workout
}

export async function getWorkoutDetailByDate(
  localDate: string,
): Promise<WorkoutDayDetail> {
  const workout = await getWorkoutByDate(localDate)

  if (!workout) {
    return { workout: undefined, exercises: [] }
  }

  const workoutExercises = (
    await db.workoutExercises.where("workoutId").equals(workout.id).toArray()
  ).sort(byOrder)

  if (workoutExercises.length === 0) {
    return { workout, exercises: [] }
  }

  const exerciseIds = workoutExercises.map((entry) => entry.exerciseId)
  const exercises = await db.exercises.bulkGet(exerciseIds)
  const sets = await db.sets
    .where("workoutExerciseId")
    .anyOf(workoutExercises.map((entry) => entry.id))
    .toArray()
  const setsByWorkoutExerciseId = new Map<string, SetEntry[]>()

  for (const set of sets) {
    const current = setsByWorkoutExerciseId.get(set.workoutExerciseId) ?? []
    current.push(set)
    setsByWorkoutExerciseId.set(set.workoutExerciseId, current)
  }

  const details: WorkoutExerciseDetail[] = []

  workoutExercises.forEach((workoutExercise, index) => {
    const exercise = exercises[index]

    if (!exercise) {
      return
    }

    details.push({
      workoutExercise,
      exercise,
      sets: (setsByWorkoutExerciseId.get(workoutExercise.id) ?? []).sort(
        byOrder,
      ),
    })
  })

  return { workout, exercises: details }
}

export async function getWorkoutExerciseDetail(workoutExerciseId: string) {
  const workoutExercise = await db.workoutExercises.get(workoutExerciseId)

  if (!workoutExercise) {
    return undefined
  }

  const [exercise, workout, sets] = await Promise.all([
    db.exercises.get(workoutExercise.exerciseId),
    db.workouts.get(workoutExercise.workoutId),
    db.sets.where("workoutExerciseId").equals(workoutExerciseId).toArray(),
  ])

  if (!exercise || !workout) {
    return undefined
  }

  return {
    workout,
    workoutExercise,
    exercise,
    sets: sets.sort(byOrder),
  }
}

export async function addExerciseToDate(localDate: string, exerciseId: string) {
  const workout = await getOrCreateWorkout(localDate)
  const existing = await db.workoutExercises
    .where("workoutId")
    .equals(workout.id)
    .and((row) => row.exerciseId === exerciseId)
    .first()

  if (existing) {
    await db.workouts.update(workout.id, {
      updatedAt: new Date().toISOString(),
    })
    return existing
  }

  const workoutExercises = await db.workoutExercises
    .where("workoutId")
    .equals(workout.id)
    .toArray()
  const now = new Date().toISOString()
  const workoutExercise: WorkoutExercise = {
    id: createId("workout_exercise"),
    workoutId: workout.id,
    exerciseId,
    order: workoutExercises.length,
    createdAt: now,
    updatedAt: now,
  }

  await db.transaction("rw", db.workouts, db.workoutExercises, async () => {
    await db.workoutExercises.add(workoutExercise)
    await db.workouts.update(workout.id, { updatedAt: now })
  })

  return workoutExercise
}

export async function replaceWorkoutExercise(
  workoutExerciseId: string,
  exerciseId: string,
) {
  await db.workoutExercises.update(workoutExerciseId, {
    exerciseId,
    updatedAt: new Date().toISOString(),
  })
}

export async function addSetToWorkoutExercise(
  workoutExerciseId: string,
  input: SetEntryInput,
) {
  const currentSets = await db.sets
    .where("workoutExerciseId")
    .equals(workoutExerciseId)
    .toArray()
  const now = new Date().toISOString()
  const set: SetEntry = {
    id: createId("set"),
    workoutExerciseId,
    order: currentSets.length,
    ...input,
    createdAt: now,
    updatedAt: now,
  }

  await db.sets.add(set)
  await touchWorkoutFromWorkoutExercise(workoutExerciseId)
  return set
}

export async function updateSet(setId: string, input: SetEntryInput) {
  const set = await db.sets.get(setId)

  if (!set) {
    return
  }

  await db.sets.update(setId, {
    ...input,
    updatedAt: new Date().toISOString(),
  })
  await touchWorkoutFromWorkoutExercise(set.workoutExerciseId)
}

export async function updateSetComment(setId: string, comment: string) {
  const set = await db.sets.get(setId)

  if (!set) {
    return
  }

  await db.sets.update(setId, {
    comment: comment.trim() || undefined,
    updatedAt: new Date().toISOString(),
  })
  await touchWorkoutFromWorkoutExercise(set.workoutExerciseId)
}

export async function deleteSet(setId: string) {
  const set = await db.sets.get(setId)

  if (!set) {
    return
  }

  await db.transaction("rw", db.sets, async () => {
    await db.sets.delete(setId)
    await reindexSets(set.workoutExerciseId)
  })
  await touchWorkoutFromWorkoutExercise(set.workoutExerciseId)
}

export async function reorderSets(
  workoutExerciseId: string,
  orderedSetIds: string[],
) {
  const now = new Date().toISOString()

  await db.transaction("rw", db.sets, async () => {
    await Promise.all(
      orderedSetIds.map((setId, index) =>
        db.sets.update(setId, { order: index, updatedAt: now }),
      ),
    )
  })
  await touchWorkoutFromWorkoutExercise(workoutExerciseId)
}

export async function reorderWorkoutExercises(
  workoutId: string,
  orderedWorkoutExerciseIds: string[],
) {
  const now = new Date().toISOString()

  await db.transaction("rw", db.workoutExercises, db.workouts, async () => {
    await Promise.all(
      orderedWorkoutExerciseIds.map((workoutExerciseId, index) =>
        db.workoutExercises.update(workoutExerciseId, {
          order: index,
          updatedAt: now,
        }),
      ),
    )
    await db.workouts.update(workoutId, { updatedAt: now })
  })
}

export async function deleteWorkoutExercise(workoutExerciseId: string) {
  const workoutExercise = await db.workoutExercises.get(workoutExerciseId)

  if (!workoutExercise) {
    return
  }

  await db.transaction(
    "rw",
    db.workoutExercises,
    db.sets,
    db.workouts,
    async () => {
      await db.sets
        .where("workoutExerciseId")
        .equals(workoutExerciseId)
        .delete()
      await db.workoutExercises.delete(workoutExerciseId)
      await reindexWorkoutExercises(workoutExercise.workoutId)
      await db.workouts.update(workoutExercise.workoutId, {
        updatedAt: new Date().toISOString(),
      })
    },
  )
}

export async function getWorkoutDates() {
  const workouts = await db.workouts.toArray()
  const datesWithExerciseData: string[] = []

  for (const workout of workouts) {
    const exerciseCount = await db.workoutExercises
      .where("workoutId")
      .equals(workout.id)
      .count()

    if (exerciseCount > 0 || workout.startedAt || workout.endedAt) {
      datesWithExerciseData.push(workout.localDate)
    }
  }

  return datesWithExerciseData.sort()
}

export async function copyOrMoveWorkout(
  sourceLocalDate: string,
  targetLocalDate: string,
  mode: "copy" | "move",
  overwriteTarget: boolean,
) {
  if (sourceLocalDate === targetLocalDate) {
    throw new Error("Source and target dates must be different.")
  }

  const source = await getWorkoutDetailByDate(sourceLocalDate)

  if (!source.workout || source.exercises.length === 0) {
    throw new Error("Source date has no workout to copy.")
  }

  const sourceWorkout = source.workout
  const target = await getWorkoutByDate(targetLocalDate)

  if (target && !overwriteTarget) {
    throw new Error("Target date already has a workout.")
  }

  const now = new Date().toISOString()

  await db.transaction(
    "rw",
    db.workouts,
    db.workoutExercises,
    db.sets,
    async () => {
      if (target && overwriteTarget) {
        const targetWorkoutExercises = await db.workoutExercises
          .where("workoutId")
          .equals(target.id)
          .toArray()

        if (targetWorkoutExercises.length > 0) {
          await db.sets
            .where("workoutExerciseId")
            .anyOf(targetWorkoutExercises.map((entry) => entry.id))
            .delete()
        }
        await db.workoutExercises.where("workoutId").equals(target.id).delete()
        await db.workouts.delete(target.id)
      }

      const targetWorkout: Workout = {
        id: createId("workout"),
        localDate: targetLocalDate,
        startedAt: sourceWorkout.startedAt,
        endedAt: sourceWorkout.endedAt,
        createdAt: now,
        updatedAt: now,
      }

      await db.workouts.add(targetWorkout)

      for (const [exerciseIndex, detail] of source.exercises.entries()) {
        const workoutExercise: WorkoutExercise = {
          id: createId("workout_exercise"),
          workoutId: targetWorkout.id,
          exerciseId: detail.exercise.id,
          order: exerciseIndex,
          createdAt: now,
          updatedAt: now,
        }

        await db.workoutExercises.add(workoutExercise)
        await db.sets.bulkAdd(
          detail.sets.map((set, setIndex) => ({
            ...set,
            id: createId("set"),
            workoutExerciseId: workoutExercise.id,
            order: setIndex,
            createdAt: now,
            updatedAt: now,
          })),
        )
      }

      if (mode === "move") {
        const sourceWorkoutExercises = await db.workoutExercises
          .where("workoutId")
          .equals(sourceWorkout.id)
          .toArray()

        if (sourceWorkoutExercises.length > 0) {
          await db.sets
            .where("workoutExerciseId")
            .anyOf(sourceWorkoutExercises.map((entry) => entry.id))
            .delete()
        }
        await db.workoutExercises
          .where("workoutId")
          .equals(sourceWorkout.id)
          .delete()
        await db.workouts.delete(sourceWorkout.id)
      }
    },
  )
}

export async function updateWorkoutTimer(
  localDate: string,
  input: { startedAt?: string; endedAt?: string },
) {
  const workout = await getOrCreateWorkout(localDate)

  await db.workouts.update(workout.id, {
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    updatedAt: new Date().toISOString(),
  })
}

export async function generateWorkoutSummary(localDate: string) {
  const detail = await getWorkoutDetailByDate(localDate)

  if (!detail.workout || detail.exercises.length === 0) {
    return `Workout ${localDate}\nNo exercises logged.`
  }

  const lines = [`Workout ${localDate}`]

  for (const exerciseDetail of detail.exercises) {
    lines.push("")
    lines.push(exerciseDetail.exercise.name)

    if (exerciseDetail.sets.length === 0) {
      lines.push("  No sets")
      continue
    }

    exerciseDetail.sets.forEach((set, index) => {
      const values = [
        set.weight !== undefined ? `${set.weight} kg` : undefined,
        set.distance !== undefined ? `${set.distance} km` : undefined,
        set.reps !== undefined ? `${set.reps} reps` : undefined,
        set.durationSeconds !== undefined ? `${set.durationSeconds}s` : undefined,
      ]
        .filter(Boolean)
        .join(", ")

      lines.push(`  ${index + 1}. ${values || "Logged set"}`)
    })
  }

  return lines.join("\n")
}

async function touchWorkoutFromWorkoutExercise(workoutExerciseId: string) {
  const workoutExercise = await db.workoutExercises.get(workoutExerciseId)

  if (!workoutExercise) {
    return
  }

  await db.workouts.update(workoutExercise.workoutId, {
    updatedAt: new Date().toISOString(),
  })
}
