import { db } from "@/db/db"
import type {
  Exercise,
  ExerciseInput,
  ExerciseSetDefaults,
  ExerciseUsageStats,
} from "@/db/schema"
import { createId } from "@/shared/model/ids"
import {
  defaultProfileName,
  normalizeProfileName,
} from "@/shared/model/profiles"

export async function getAllExercises() {
  const exercises = await db.exercises.toArray()
  return exercises.sort((a, b) => a.name.localeCompare(b.name))
}

export async function getExercise(exerciseId: string) {
  return db.exercises.get(exerciseId)
}

export async function createExercise(input: ExerciseInput) {
  const now = new Date().toISOString()
  const exercise: Exercise = {
    id: createId("exercise"),
    name: input.name.trim(),
    category: input.category,
    exerciseType: input.exerciseType,
    isFavorite: input.isFavorite ?? false,
    setIncrements: input.setIncrements,
    createdAt: now,
    updatedAt: now,
  }

  await db.exercises.add(exercise)
  return exercise
}

export async function updateExercise(
  exerciseId: string,
  input: Partial<ExerciseInput>,
) {
  await db.exercises.update(exerciseId, {
    ...input,
    name: input.name?.trim(),
    updatedAt: new Date().toISOString(),
  })

  return db.exercises.get(exerciseId)
}

export async function toggleExerciseFavorite(exercise: Exercise) {
  await db.exercises.update(exercise.id, {
    isFavorite: !exercise.isFavorite,
    updatedAt: new Date().toISOString(),
  })
}

export async function updateExerciseSetDefaults(
  exerciseId: string,
  lastSetInput: ExerciseSetDefaults,
) {
  await db.exercises.update(exerciseId, {
    lastSetInput,
    updatedAt: new Date().toISOString(),
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
