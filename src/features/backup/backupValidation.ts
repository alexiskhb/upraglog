import { z } from "zod"

const exerciseCategorySchema = z.enum([
  "chest",
  "back",
  "legs",
  "shoulders",
  "biceps",
  "triceps",
  "abs",
  "cardio",
  "custom",
])

const exerciseTypeSchema = z.enum([
  "strength",
  "cardio",
  "weight_time",
  "reps_time",
  "reps_only",
  "time_only",
  "distance_time",
])

const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: exerciseCategorySchema,
  exerciseType: exerciseTypeSchema,
  isFavorite: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const workoutSchema = z.object({
  id: z.string(),
  localDate: z.string(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const workoutExerciseSchema = z.object({
  id: z.string(),
  workoutId: z.string(),
  exerciseId: z.string(),
  order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const setEntrySchema = z.object({
  id: z.string(),
  workoutExerciseId: z.string(),
  order: z.number(),
  weight: z.number().optional(),
  reps: z.number().optional(),
  distance: z.number().optional(),
  durationSeconds: z.number().optional(),
  comment: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const bodyMeasurementSchema = z.object({
  id: z.string(),
  localDate: z.string(),
  measurementType: z.string(),
  value: z.number(),
  unit: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const settingsSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]),
  keepScreenOnDuringTraining: z.boolean(),
})

export const backupFileSchema = z.object({
  app: z.literal("upraglog"),
  version: z.number(),
  exportedAt: z.string(),
  data: z.object({
    exercises: z.array(exerciseSchema),
    workouts: z.array(workoutSchema),
    workoutExercises: z.array(workoutExerciseSchema),
    sets: z.array(setEntrySchema),
    bodyMeasurements: z.array(bodyMeasurementSchema),
    settings: settingsSchema,
  }),
})
