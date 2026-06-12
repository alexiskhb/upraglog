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
import {
  defaultProfileName,
  normalizeProfileName,
} from "@/shared/model/profiles"
import {
  filterSetInputForExerciseType,
  normalizeSetEntryForExerciseType,
} from "@/shared/model/setFields"
import { getAutoFinishedWorkoutEndedAt } from "@/shared/model/workoutTimer"
import { sortWorkoutExercisesByFirstFinishedSet } from "@/shared/model/workoutOrder"

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

function workoutProfileName(profileName?: string) {
  return normalizeProfileName(profileName) || defaultProfileName
}

function groupSetsByWorkoutExerciseId(sets: SetEntry[]) {
  const setsByWorkoutExerciseId = new Map<string, SetEntry[]>()

  for (const set of sets) {
    const current = setsByWorkoutExerciseId.get(set.workoutExerciseId) ?? []
    current.push(set)
    setsByWorkoutExerciseId.set(set.workoutExerciseId, current)
  }

  return setsByWorkoutExerciseId
}

async function getWorkoutSets(workoutExerciseRows: WorkoutExercise[]) {
  if (workoutExerciseRows.length === 0) {
    return []
  }

  return db.sets
    .where("workoutExerciseId")
    .anyOf(workoutExerciseRows.map((entry) => entry.id))
    .toArray()
}

async function applyWorkoutExerciseAutoSort(workoutId: string, now: string) {
  const workoutExercises = await db.workoutExercises
    .where("workoutId")
    .equals(workoutId)
    .sortBy("order")

  if (workoutExercises.length <= 1) {
    return false
  }

  const setsByWorkoutExerciseId = groupSetsByWorkoutExerciseId(
    await getWorkoutSets(workoutExercises),
  )
  const sortedWorkoutExercises = sortWorkoutExercisesByFirstFinishedSet(
    workoutExercises,
    setsByWorkoutExerciseId,
  )
  const orderChanged = sortedWorkoutExercises.some(
    (row, index) => row.id !== workoutExercises[index].id || row.order !== index,
  )

  if (!orderChanged) {
    return false
  }

  await Promise.all(
    sortedWorkoutExercises.map((row, index) =>
      db.workoutExercises.update(row.id, {
        order: index,
        updatedAt: now,
      }),
    ),
  )

  return true
}

export async function autoSortWorkoutExercisesByFirstFinishedSetForAllWorkouts() {
  const workouts = await db.workouts.toArray()
  const now = new Date().toISOString()

  await db.transaction(
    "rw",
    db.workouts,
    db.workoutExercises,
    db.sets,
    async () => {
      for (const workout of workouts) {
        const orderChanged = await applyWorkoutExerciseAutoSort(workout.id, now)

        if (orderChanged) {
          await db.workouts.update(workout.id, { updatedAt: now })
        }
      }
    },
  )
}

export async function getWorkoutByDate(localDate: string, profileName?: string) {
  return db.workouts
    .where("[localDate+profileName]")
    .equals([localDate, workoutProfileName(profileName)])
    .first()
}

export async function getOrCreateWorkout(
  localDate: string,
  profileName?: string,
) {
  const resolvedProfileName = workoutProfileName(profileName)
  const existing = await getWorkoutByDate(localDate, resolvedProfileName)

  if (existing) {
    return existing
  }

  const now = new Date().toISOString()
  const workout: Workout = {
    id: createId("workout"),
    localDate,
    profileName: resolvedProfileName,
    createdAt: now,
    updatedAt: now,
  }

  await db.workouts.add(workout)
  return workout
}

export async function getWorkoutDetailByDate(
  localDate: string,
  profileName?: string,
): Promise<WorkoutDayDetail> {
  const workout = await getWorkoutByDate(localDate, profileName)

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
  const setsByWorkoutExerciseId = groupSetsByWorkoutExerciseId(sets)

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

  const workoutExercises = await db.workoutExercises
    .where("workoutId")
    .equals(workout.id)
    .toArray()
  const orderedWorkoutExercises = workoutExercises.sort(byOrder)
  const workoutSets =
    orderedWorkoutExercises.length === 0
      ? []
      : await db.sets
          .where("workoutExerciseId")
          .anyOf(orderedWorkoutExercises.map((entry) => entry.id))
          .toArray()

  return {
    workout,
    workoutExercise,
    exercise,
    sets: sets.sort(byOrder),
    workoutSets,
    workoutExerciseIds: orderedWorkoutExercises.map((entry) => entry.id),
  }
}

export async function addExerciseToDate(
  localDate: string,
  profileName: string | undefined,
  exerciseId: string,
) {
  const workout = await getOrCreateWorkout(localDate, profileName)
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
  const [workoutExercise, exercise, sets] = await Promise.all([
    db.workoutExercises.get(workoutExerciseId),
    db.exercises.get(exerciseId),
    db.sets.where("workoutExerciseId").equals(workoutExerciseId).toArray(),
  ])

  if (!workoutExercise || !exercise) {
    return
  }

  const now = new Date().toISOString()
  const normalizedSets = sets.map((set) =>
    normalizeSetEntryForExerciseType(exercise.exerciseType, {
      ...set,
      updatedAt: now,
    }),
  )

  await db.transaction(
    "rw",
    db.workoutExercises,
    db.sets,
    db.workouts,
    async () => {
      await db.workoutExercises.update(workoutExerciseId, {
        exerciseId,
        updatedAt: now,
      })
      // Keep set rows, comments, and finish state, but drop values that the
      // replacement exercise type cannot use so old data cannot leak into UI/export.
      await Promise.all(normalizedSets.map((set) => db.sets.put(set)))
      await db.workouts.update(workoutExercise.workoutId, { updatedAt: now })
    },
  )
}

export async function addSetToWorkoutExercise(
  workoutExerciseId: string,
  input: SetEntryInput,
) {
  const workoutExercise = await db.workoutExercises.get(workoutExerciseId)

  if (!workoutExercise) {
    return undefined
  }

  const [exercise, currentSets] = await Promise.all([
    db.exercises.get(workoutExercise.exerciseId),
    db.sets.where("workoutExerciseId").equals(workoutExerciseId).toArray(),
  ])

  if (!exercise) {
    return undefined
  }

  const now = new Date().toISOString()
  const setInput = filterSetInputForExerciseType(exercise.exerciseType, input)
  const set: SetEntry = {
    id: createId("set"),
    workoutExerciseId,
    order: currentSets.length,
    ...setInput,
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

  const workoutExercise = await db.workoutExercises.get(set.workoutExerciseId)

  if (!workoutExercise) {
    return
  }

  const exercise = await db.exercises.get(workoutExercise.exerciseId)

  if (!exercise) {
    return
  }

  const now = new Date().toISOString()
  const setInput = filterSetInputForExerciseType(exercise.exerciseType, input)
  const nextSet = normalizeSetEntryForExerciseType(exercise.exerciseType, {
    ...set,
    ...setInput,
    updatedAt: now,
  })

  await db.sets.put(nextSet)
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

export async function updateSetFinished(
  setId: string,
  finished: boolean,
  options: {
    autoSortWorkoutExercises?: boolean
    autoFinishWorkoutTimer?: boolean
  } = {},
) {
  const set = await db.sets.get(setId)

  if (!set) {
    return
  }

  const workoutExercise = await db.workoutExercises.get(set.workoutExerciseId)

  if (!workoutExercise) {
    return
  }

  const now = new Date().toISOString()

  await db.transaction(
    "rw",
    db.sets,
    db.workoutExercises,
    db.workouts,
    async () => {
      await db.sets.update(setId, {
        finishedAt: finished ? now : undefined,
        updatedAt: now,
      })

      const workout = await db.workouts.get(workoutExercise.workoutId)
      const workoutPatch: Partial<Workout> = { updatedAt: now }

      if (finished && options.autoFinishWorkoutTimer && workout) {
        const workoutExercises = await db.workoutExercises
          .where("workoutId")
          .equals(workout.id)
          .toArray()
        const workoutSets = await getWorkoutSets(workoutExercises)
        const endedAt = getAutoFinishedWorkoutEndedAt({
          workout,
          sets: workoutSets,
        })

        if (endedAt) {
          workoutPatch.endedAt = endedAt
        }
      }

      if (options.autoSortWorkoutExercises) {
        await applyWorkoutExerciseAutoSort(workoutExercise.workoutId, now)
      }

      await db.workouts.update(workoutExercise.workoutId, workoutPatch)
    },
  )
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

export async function getWorkoutDates(profileName?: string) {
  const workouts = await db.workouts
    .where("profileName")
    .equals(workoutProfileName(profileName))
    .toArray()
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

export async function updateWorkoutTimer(
  localDate: string,
  profileName: string | undefined,
  input: { startedAt?: string; endedAt?: string },
) {
  const workout = await getOrCreateWorkout(localDate, profileName)
  const now = new Date().toISOString()

  await db.workouts.put({
    ...workout,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    updatedAt: now,
  })
}

export async function startWorkoutTimer(
  localDate: string,
  profileName?: string,
) {
  const workout = await getOrCreateWorkout(localDate, profileName)

  if (workout.startedAt && !workout.endedAt) {
    return workout
  }

  const now = new Date().toISOString()

  await db.workouts.put({
    ...workout,
    startedAt: now,
    endedAt: undefined,
    updatedAt: now,
  })

  return {
    ...workout,
    startedAt: now,
    endedAt: undefined,
    updatedAt: now,
  }
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
