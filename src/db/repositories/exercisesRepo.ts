import { db } from "@/db/db"
import type {
  Exercise,
  ExerciseInput,
  ExerciseSetDefaults,
  ExerciseUsageStats,
} from "@/db/schema"
import {
  defaultProfileName,
  normalizeProfileName,
} from "@/shared/model/profiles"
import { normalizeExerciseCategory } from "@/shared/model/exercises"

function normalizeExerciseId(exerciseId: string) {
  return exerciseId.trim()
}

export async function getAllExercises() {
  const exercises = await db.exercises.toArray()
  return exercises.sort((a, b) => a.id.localeCompare(b.id))
}

export async function getExerciseCategories() {
  const categories = await db.exerciseCategories.toArray()
  return categories
    .map((category) => category.id)
    .sort((a, b) => a.localeCompare(b))
}

export async function getExercise(exerciseId: string) {
  return db.exercises.get(exerciseId)
}

export async function createExercise(input: ExerciseInput) {
  const exerciseId = normalizeExerciseId(input.id)
  const duplicate = await db.exercises.get(exerciseId)

  if (duplicate) {
    throw new Error("Exercise already exists.")
  }

  const exercise: Exercise = {
    id: exerciseId,
    category: normalizeExerciseCategory(input.category),
    exerciseType: input.exerciseType,
    isFavorite: input.isFavorite ?? false,
    setIncrements: input.setIncrements,
  }

  await db.transaction("rw", db.exerciseCategories, db.exercises, async () => {
    await db.exerciseCategories.put({ id: exercise.category })
    await db.exercises.add(exercise)
  })
  return exercise
}

export async function updateExercise(
  exerciseId: string,
  input: Partial<ExerciseInput>,
) {
  const currentExercise = await db.exercises.get(exerciseId)

  if (!currentExercise) {
    return undefined
  }

  const nextExerciseId = input.id
    ? normalizeExerciseId(input.id)
    : currentExercise.id
  const nextExercise: Exercise = {
    id: nextExerciseId,
    category: input.category
      ? normalizeExerciseCategory(input.category)
      : currentExercise.category,
    exerciseType: input.exerciseType ?? currentExercise.exerciseType,
    isFavorite: input.isFavorite ?? currentExercise.isFavorite,
    lastSetInput: currentExercise.lastSetInput,
    setIncrements: input.setIncrements ?? currentExercise.setIncrements,
  }

  if (nextExerciseId === exerciseId) {
    await db.transaction("rw", db.exerciseCategories, db.exercises, async () => {
      await db.exerciseCategories.put({ id: nextExercise.category })
      await db.exercises.put(nextExercise)
    })
    return nextExercise
  }

  const duplicate = await db.exercises.get(nextExerciseId)

  if (duplicate) {
    throw new Error("Exercise already exists.")
  }

  await db.transaction(
    "rw",
    db.exerciseCategories,
    db.exercises,
    db.workoutExercises,
    async () => {
      await db.exerciseCategories.put({ id: nextExercise.category })
      await db.exercises.delete(exerciseId)
      await db.exercises.add(nextExercise)
      await db.workoutExercises
        .where("exerciseId")
        .equals(exerciseId)
        .modify({ exerciseId: nextExerciseId })
    },
  )

  return nextExercise
}

export async function toggleExerciseFavorite(exercise: Exercise) {
  await db.exercises.update(exercise.id, {
    isFavorite: !exercise.isFavorite,
  })
}

export async function updateExerciseSetDefaults(
  exerciseId: string,
  lastSetInput: ExerciseSetDefaults,
) {
  await db.exercises.update(exerciseId, {
    lastSetInput,
  })
}

export async function deleteExercise(exerciseId: string) {
  const usageCount = await db.workoutExercises
    .where("exerciseId")
    .equals(exerciseId)
    .count()

  if (usageCount > 0) {
    throw new Error("Exercise has workout history and cannot be deleted.")
  }

  await db.exercises.delete(exerciseId)
}

export async function getExerciseUsageStats(profileName = defaultProfileName) {
  const [workoutExercises, workouts] = await Promise.all([
    db.workoutExercises.toArray(),
    db.workouts
      .where("profileName")
      .equals(normalizeProfileName(profileName) || defaultProfileName)
      .toArray(),
  ])

  const workoutDateById = new Map(
    workouts.map((workout) => [workout.id, workout.localDate]),
  )
  const stats: Record<string, ExerciseUsageStats> = {}

  for (const workoutExercise of workoutExercises) {
    const localDate = workoutDateById.get(workoutExercise.workoutId)
    const current = stats[workoutExercise.exerciseId] ?? {
      workoutCount: 0,
      lastUsedDate: undefined,
    }

    stats[workoutExercise.exerciseId] = {
      workoutCount: current.workoutCount + 1,
      lastUsedDate:
        current.lastUsedDate && localDate
          ? current.lastUsedDate > localDate
            ? current.lastUsedDate
            : localDate
          : localDate ?? current.lastUsedDate,
    }
  }

  return stats
}
