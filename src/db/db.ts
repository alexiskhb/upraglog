import Dexie, { type Table } from "dexie"
import type {
  Exercise,
  SetEntry,
  StoredAppSettings,
  Workout,
  WorkoutExercise,
} from "./schema"

class UpraglogDatabase extends Dexie {
  exercises!: Table<Exercise, string>
  workouts!: Table<Workout, string>
  workoutExercises!: Table<WorkoutExercise, string>
  sets!: Table<SetEntry, string>
  settings!: Table<StoredAppSettings, string>

  constructor() {
    super("upraglog")

    this.version(1).stores({
      exercises: "&id, name, category, isFavorite, updatedAt",
      workouts: "&id, &localDate, updatedAt",
      workoutExercises: "&id, workoutId, exerciseId, [workoutId+order]",
      sets: "&id, workoutExerciseId, [workoutExerciseId+order]",
      bodyMeasurements: "&id, localDate, measurementType, createdAt",
      settings: "&id",
    })

    this.version(2).stores({
      exercises: "&id, name, category, isFavorite, updatedAt",
      workouts: "&id, &localDate, updatedAt",
      workoutExercises: "&id, workoutId, exerciseId, [workoutId+order]",
      sets: "&id, workoutExerciseId, [workoutExerciseId+order]",
      bodyMeasurements: null,
      settings: "&id",
    })
  }
}

export const db = new UpraglogDatabase()

let databaseInitialization: Promise<void> | undefined

const exerciseSeeds: Omit<Exercise, "createdAt" | "updatedAt">[] = [
    {
      id: "seed_flat_barbell_bench_press",
      name: "Flat Barbell Bench Press",
      category: "chest",
      exerciseType: "strength",
      isFavorite: true,
    },
    {
      id: "seed_incline_barbell_bench_press",
      name: "Incline Barbell Bench Press",
      category: "chest",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_incline_dumbbell_press",
      name: "Incline Dumbbell Press",
      category: "chest",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_cable_fly",
      name: "Cable Fly",
      category: "chest",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_pull_up",
      name: "Pull Up",
      category: "back",
      exerciseType: "reps_only",
      isFavorite: true,
    },
    {
      id: "seed_lat_pulldown",
      name: "Lat Pulldown",
      category: "back",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_barbell_row",
      name: "Barbell Row",
      category: "back",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_seated_cable_row",
      name: "Seated Cable Row",
      category: "back",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_squat",
      name: "Squat",
      category: "legs",
      exerciseType: "strength",
      isFavorite: true,
    },
    {
      id: "seed_leg_press",
      name: "Leg Press",
      category: "legs",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_romanian_deadlift",
      name: "Romanian Deadlift",
      category: "legs",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_leg_extension",
      name: "Leg Extension",
      category: "legs",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_leg_curl",
      name: "Leg Curl",
      category: "legs",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_standing_calf_raise",
      name: "Standing Calf Raise",
      category: "legs",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_overhead_press",
      name: "Overhead Press",
      category: "shoulders",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_lateral_raise",
      name: "Lateral Raise",
      category: "shoulders",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_rear_delt_fly",
      name: "Rear Delt Fly",
      category: "shoulders",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_barbell_curl",
      name: "Barbell Curl",
      category: "biceps",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_dumbbell_curl",
      name: "Dumbbell Curl",
      category: "biceps",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_hammer_curl",
      name: "Hammer Curl",
      category: "biceps",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_triceps_pushdown",
      name: "Triceps Pushdown",
      category: "triceps",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_skull_crusher",
      name: "Skull Crusher",
      category: "triceps",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_close_grip_bench_press",
      name: "Close-Grip Bench Press",
      category: "triceps",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_hanging_leg_raise",
      name: "Hanging Leg Raise",
      category: "abs",
      exerciseType: "reps_only",
      isFavorite: false,
    },
    {
      id: "seed_cable_crunch",
      name: "Cable Crunch",
      category: "abs",
      exerciseType: "strength",
      isFavorite: false,
    },
    {
      id: "seed_plank",
      name: "Plank",
      category: "abs",
      exerciseType: "time_only",
      isFavorite: false,
    },
    {
      id: "seed_treadmill_run",
      name: "Treadmill Run",
      category: "cardio",
      exerciseType: "distance_time",
      isFavorite: false,
    },
    {
      id: "seed_cycling",
      name: "Cycling",
      category: "cardio",
      exerciseType: "distance_time",
      isFavorite: false,
    },
    {
      id: "seed_rowing_machine",
      name: "Rowing Machine",
      category: "cardio",
      exerciseType: "distance_time",
      isFavorite: false,
    },
]

async function initializeDatabaseInternal() {
  await db.transaction("rw", db.exercises, db.settings, async () => {
    const existingSettings = await db.settings.get("app")

    if (!existingSettings) {
      await db.settings.put({
        id: "app",
        unitSystem: "metric",
        keepScreenOnDuringTraining: true,
        updatedAt: new Date().toISOString(),
      })
    }

    const existingExercises = await db.exercises.count()

    if (existingExercises > 0) {
      return
    }

    const now = new Date().toISOString()

    await db.exercises.bulkPut(
      exerciseSeeds.map((exercise) => ({
        ...exercise,
        createdAt: now,
        updatedAt: now,
      })),
    )
  })
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
