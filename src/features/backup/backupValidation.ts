import { z } from "zod"
import {
  defaultProfileName,
  resolveSelectedProfile,
} from "@/shared/model/profiles"

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

const exerciseSetDefaultsSchema = z.object({
  weight: z.number().nullable().optional(),
  reps: z.number().nullable().optional(),
  distance: z.number().nullable().optional(),
  durationSeconds: z.number().nullable().optional(),
})

const exerciseSetIncrementsSchema = z.object({
  weight: z.number().optional(),
  reps: z.number().optional(),
  distance: z.number().optional(),
  durationSeconds: z.number().optional(),
})

const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: exerciseCategorySchema,
  exerciseType: exerciseTypeSchema,
  isFavorite: z.boolean(),
  lastSetInput: exerciseSetDefaultsSchema.optional(),
  setIncrements: exerciseSetIncrementsSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const workoutSchema = z.object({
  id: z.string(),
  localDate: z.string(),
  profileName: z.string().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).transform((workout) => ({
  ...workout,
  profileName: workout.profileName?.trim() || defaultProfileName,
}))

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
  weight: z.number().nullable().optional(),
  reps: z.number().nullable().optional(),
  distance: z.number().nullable().optional(),
  durationSeconds: z.number().nullable().optional(),
  comment: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const settingsSchema = z.object({
  unitSystem: z.enum(["metric", "imperial"]).optional(),
  keepScreenOn: z.boolean().optional(),
  keepScreenOnDuringTraining: z.boolean().optional(),
  skipEmptyDaysOnDayNavigation: z.boolean().optional(),
  skipEmptyDaysOnSwipe: z.boolean().optional(),
  profiles: z.array(z.string()).optional(),
  selectedProfile: z.string().optional(),
  exportAllProfiles: z.boolean().optional(),
}).transform((settings) => ({
  ...resolveSelectedProfile(settings.profiles, settings.selectedProfile),
  keepScreenOn:
    settings.keepScreenOn ?? settings.keepScreenOnDuringTraining ?? true,
  skipEmptyDaysOnDayNavigation:
    settings.skipEmptyDaysOnDayNavigation ??
    settings.skipEmptyDaysOnSwipe ??
    false,
  exportAllProfiles: settings.exportAllProfiles ?? false,
}))

export const backupFileSchema = z.object({
  app: z.literal("upraglog"),
  version: z.number(),
  exportedAt: z.string(),
  data: z.object({
    exercises: z.array(exerciseSchema),
    workouts: z.array(workoutSchema),
    workoutExercises: z.array(workoutExerciseSchema),
    sets: z.array(setEntrySchema),
    settings: settingsSchema,
  }),
})
