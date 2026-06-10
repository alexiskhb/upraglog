import { z } from "zod"
import {
  defaultProfileName,
  resolveSelectedProfile,
} from "@/shared/model/profiles"
import { normalizeExerciseCategory } from "@/shared/model/exercises"
import { normalizeSetCommentTemplates } from "@/shared/model/setCommentTemplates"

const exerciseCategorySchema = z.string().trim().min(1)

const exerciseCategoryEntrySchema = z.object({
  id: exerciseCategorySchema,
}).transform((category) => ({
  id: normalizeExerciseCategory(category.id),
}))

const exerciseTypeSchema = z.enum([
  "strength",
  "weight_over_time",
  "reps_over_time",
  "reps_only",
  "time_only",
  "distance_over_time",
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
  id: z.string().trim().min(1),
  category: exerciseCategorySchema,
  exerciseType: exerciseTypeSchema,
  isFavorite: z.boolean(),
  lastSetInput: exerciseSetDefaultsSchema.optional(),
  setIncrements: exerciseSetIncrementsSchema.optional(),
}).transform((exercise) => ({
  ...exercise,
  category: normalizeExerciseCategory(exercise.category),
}))

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
  spreadsheetExportMonthLimit: z.number().nullable().optional(),
  spreadsheetShareMessage: z.string().optional(),
  spreadsheetShareIncludeMessage: z.boolean().optional(),
  spreadsheetShareIncludeAiInstructions: z.boolean().optional(),
  setCommentTemplates: z.array(z.string()).optional(),
}).transform((settings) => ({
  ...resolveSelectedProfile(settings.profiles, settings.selectedProfile),
  keepScreenOn:
    settings.keepScreenOn ?? settings.keepScreenOnDuringTraining ?? true,
  skipEmptyDaysOnDayNavigation:
    settings.skipEmptyDaysOnDayNavigation ??
    settings.skipEmptyDaysOnSwipe ??
    false,
  exportAllProfiles: settings.exportAllProfiles ?? false,
  spreadsheetExportMonthLimit:
    settings.spreadsheetExportMonthLimit &&
    settings.spreadsheetExportMonthLimit > 0
      ? Math.floor(settings.spreadsheetExportMonthLimit)
      : null,
  spreadsheetShareMessage: settings.spreadsheetShareMessage ?? "",
  spreadsheetShareIncludeMessage: settings.spreadsheetShareIncludeMessage ?? true,
  spreadsheetShareIncludeAiInstructions:
    settings.spreadsheetShareIncludeAiInstructions ?? true,
  setCommentTemplates: normalizeSetCommentTemplates(
    settings.setCommentTemplates,
  ),
}))

export const backupFileSchema = z.object({
  app: z.literal("upraglog"),
  version: z.number(),
  exportedAt: z.string(),
  data: z.object({
    exerciseCategories: z.array(exerciseCategoryEntrySchema),
    exercises: z.array(exerciseSchema),
    workouts: z.array(workoutSchema),
    workoutExercises: z.array(workoutExerciseSchema),
    sets: z.array(setEntrySchema),
    settings: settingsSchema,
  }).transform((data) => {
    const exerciseCategories = new Map(
      data.exerciseCategories.map((category) => [category.id, category]),
    )

    for (const exercise of data.exercises) {
      exerciseCategories.set(exercise.category, { id: exercise.category })
    }

    return {
      ...data,
      exerciseCategories: [...exerciseCategories.values()],
    }
  }),
})
