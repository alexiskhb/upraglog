import Dexie, { type Table } from "dexie"
import type {
  Exercise,
  ExerciseCategory,
  ExerciseCategoryEntry,
  ExerciseType,
  SetEntry,
  StoredAppSettings,
  Workout,
  WorkoutExercise,
} from "./schema"
import {
  defaultProfileName,
  defaultProfileNames,
} from "@/shared/model/profiles"
import {
  defaultExerciseCategories,
  normalizeExerciseCategory,
} from "@/shared/model/exercises"

class UpraglogDatabase extends Dexie {
  exerciseCategories!: Table<ExerciseCategoryEntry, string>
  exercises!: Table<Exercise, string>
  workouts!: Table<Workout, string>
  workoutExercises!: Table<WorkoutExercise, string>
  sets!: Table<SetEntry, string>
  settings!: Table<StoredAppSettings, string>

  constructor() {
    super("upraglog")

    this.version(6).stores({
      exerciseCategories: "&id",
      exercises: "&id, category, isFavorite",
      workouts: "&id, localDate, profileName, [localDate+profileName], updatedAt",
      workoutExercises: "&id, workoutId, exerciseId, [workoutId+order]",
      sets: "&id, workoutExerciseId, [workoutExerciseId+order]",
      settings: "&id",
    })
  }
}

export const db = new UpraglogDatabase()

let databaseInitialization: Promise<void> | undefined

function exerciseSeed(
  id: string,
  category: ExerciseCategory,
  exerciseType: ExerciseType,
  isFavorite = false,
): Exercise {
  return {
    id,
    category,
    exerciseType,
    isFavorite,
  }
}

const exerciseSeeds: Exercise[] = [
  exerciseSeed("Flat Barbell Bench Press", "Chest", "strength", true),
  exerciseSeed("Incline Barbell Bench Press", "Chest", "strength"),
  exerciseSeed("Incline Dumbbell Press", "Chest", "strength"),
  exerciseSeed("Cable Fly", "Chest", "strength"),
  exerciseSeed("Pull Up", "Back", "reps_only", true),
  exerciseSeed("Lat Pulldown", "Back", "strength"),
  exerciseSeed("Barbell Row", "Back", "strength"),
  exerciseSeed("Seated Cable Row", "Back", "strength"),
  exerciseSeed("Squat", "Legs", "strength", true),
  exerciseSeed("Leg Press", "Legs", "strength"),
  exerciseSeed("Romanian Deadlift", "Legs", "strength"),
  exerciseSeed("Leg Extension", "Legs", "strength"),
  exerciseSeed("Leg Curl", "Legs", "strength"),
  exerciseSeed("Standing Calf Raise", "Legs", "strength"),
  exerciseSeed("Overhead Press", "Shoulders", "strength"),
  exerciseSeed("Lateral Raise", "Shoulders", "strength"),
  exerciseSeed("Rear Delt Fly", "Shoulders", "strength"),
  exerciseSeed("Barbell Curl", "Biceps", "strength"),
  exerciseSeed("Dumbbell Curl", "Biceps", "strength"),
  exerciseSeed("Hammer Curl", "Biceps", "strength"),
  exerciseSeed("Triceps Pushdown", "Triceps", "strength"),
  exerciseSeed("Skull Crusher", "Triceps", "strength"),
  exerciseSeed("Close-Grip Bench Press", "Triceps", "strength"),
  exerciseSeed("Hanging Leg Raise", "Abs", "reps_only"),
  exerciseSeed("Cable Crunch", "Abs", "strength"),
  exerciseSeed("Plank", "Abs", "time_only"),
  exerciseSeed("Treadmill Run", "Cardio", "distance_time"),
  exerciseSeed("Cycling", "Cardio", "distance_time"),
  exerciseSeed("Rowing Machine", "Cardio", "distance_time"),
]

async function initializeDatabaseInternal() {
  await db.transaction(
    "rw",
    db.exerciseCategories,
    db.exercises,
    db.workoutExercises,
    db.settings,
    async () => {
      const existingSettings = await db.settings.get("app")

      if (!existingSettings) {
        await db.settings.put({
          id: "app",
          keepScreenOn: true,
          skipEmptyDaysOnDayNavigation: false,
          profiles: [...defaultProfileNames],
          selectedProfile: defaultProfileName,
          exportAllProfiles: false,
          updatedAt: new Date().toISOString(),
        })
      }

      const existingCategories = await db.exerciseCategories.count()

      if (existingCategories === 0) {
        await db.exerciseCategories.bulkPut(
          defaultExerciseCategories.map((id) => ({ id })),
        )
      }

      const existingExercises = await db.exercises.toArray()

      if (existingExercises.length > 0) {
        const normalizedExercises = existingExercises.map((exercise) => {
          const id = exercise.id.trim()

          return {
            id,
            category: normalizeExerciseCategory(exercise.category),
            exerciseType: exercise.exerciseType,
            isFavorite: exercise.isFavorite,
            lastSetInput: exercise.lastSetInput,
            setIncrements: exercise.setIncrements,
          }
        })

        await db.exercises.clear()
        await db.exerciseCategories.bulkPut(
          [
            ...new Set(
              normalizedExercises.map((exercise) => exercise.category),
            ),
          ].map((id) => ({ id })),
        )
        await db.exercises.bulkPut(normalizedExercises)
        return
      }

      await db.exercises.bulkPut(exerciseSeeds)
    },
  )
}

export function initializeDatabase() {
  databaseInitialization ??= initializeDatabaseInternal().catch(
    (error: unknown) => {
      databaseInitialization = undefined
      throw error
    },
  )
  return databaseInitialization
}
