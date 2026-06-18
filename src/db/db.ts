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
  defaultExerciseCategories,
  normalizeExerciseCategory,
} from "@/shared/model/exercises"
import {
  appSettingsId,
  createDefaultStoredAppSettings,
} from "@/shared/model/settings"

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

    this.version(7)
      .stores({
        exerciseCategories: "&id",
        exercises: "&id, category, isFavorite",
        workouts: "&id, localDate, profileName, [localDate+profileName], updatedAt",
        workoutExercises: "&id, workoutId, exerciseId, [workoutId+order]",
        sets: "&id, workoutExerciseId, [workoutExerciseId+order]",
        settings: "&id",
      })
      .upgrade(async (transaction) => {
        const exercises = transaction.table("exercises") as Table<
          Exercise,
          string
        >
        const exerciseCategories = transaction.table(
          "exerciseCategories",
        ) as Table<ExerciseCategoryEntry, string>
        const existingExerciseIds = new Set(
          (await exercises.toCollection().primaryKeys()).map(String),
        )
        const missingExerciseSeeds = exerciseSeeds.filter(
          (exercise) => !existingExerciseIds.has(exercise.id),
        )

        if (missingExerciseSeeds.length === 0) {
          return
        }

        await exerciseCategories.bulkPut(
          [
            ...new Set(
              missingExerciseSeeds.map((exercise) => exercise.category),
            ),
          ].map((id) => ({ id })),
        )
        await exercises.bulkPut(missingExerciseSeeds)
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
  exerciseSeed("90/90 Hip Switch", "Mobility - Warm-Up / Rehab", "reps_only"),
  exerciseSeed("Ab-Wheel Rollout", "Core - Anti-Extension", "reps_only"),
  exerciseSeed("Air Bike", "Cardio - Bike", "distance_over_time"),
  exerciseSeed("Alternating Dumbbell Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Arnold Dumbbell Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Assisted Dip", "Chest - Press", "strength"),
  exerciseSeed("Assisted Pull-Up", "Back - Vertical Pull", "strength"),
  exerciseSeed("Back Extension", "Legs - Hip Hinge / Posterior Chain", "strength"),
  exerciseSeed("Band Pull-Apart", "Mobility - Warm-Up / Rehab", "reps_only"),
  exerciseSeed(
    "Band Shoulder Dislocate",
    "Mobility - Warm-Up / Rehab",
    "reps_only",
  ),
  exerciseSeed("Banded Lateral Walk", "Legs - Glutes / Hip Isolation", "reps_only"),
  exerciseSeed("Barbell Bench Press", "Chest - Press", "strength"),
  exerciseSeed("Barbell Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Barbell Hip Thrust", "Legs - Glutes / Hip Isolation", "strength"),
  exerciseSeed("Barbell Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Barbell Shrug", "Back - Horizontal Row", "strength"),
  exerciseSeed("Barbell Squat", "Legs - Quad Dominant", "strength"),
  exerciseSeed("Bayesian Cable Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Behind-the-Body Cable Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Bench Dip", "Chest - Press", "reps_only"),
  exerciseSeed("Belt Squat", "Legs - Quad Dominant", "strength"),
  exerciseSeed("Bicycle Crunch", "Core - Rotation / Lateral Stability", "reps_only"),
  exerciseSeed("Bird Dog", "Core - Anti-Extension", "reps_only"),
  exerciseSeed("Bird Dog Hold", "Core - Anti-Extension", "reps_over_time"),
  exerciseSeed("Bodyweight Squat", "Legs - Quad Dominant", "reps_only"),
  exerciseSeed("Bulgarian Split Squat", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Cable External Rotation", "Mobility - Warm-Up / Rehab", "strength"),
  exerciseSeed("Cable Crunch", "Core - Flexion / Leg Raise", "strength"),
  exerciseSeed("Cable Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Cable Face Pull", "Shoulders - Rear Delts", "strength"),
  exerciseSeed("Cable Fly", "Chest - Fly", "strength"),
  exerciseSeed("Cable Glute Kickback", "Legs - Glutes / Hip Isolation", "strength"),
  exerciseSeed("Cable Hammer Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Cable Lateral Raise", "Shoulders - Front / Lateral Raise", "strength"),
  exerciseSeed("Cable Overhead Triceps Extension", "Arms - Triceps", "strength"),
  exerciseSeed("Cable Preacher Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Cable Pull-Through", "Legs - Hip Hinge / Posterior Chain", "strength"),
  exerciseSeed("Cable Pullover", "Back - Vertical Pull", "strength"),
  exerciseSeed("Cable Reverse Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Cable Woodchopper", "Core - Rotation / Lateral Stability", "strength"),
  exerciseSeed("Captain's Chair Leg Raise", "Core - Flexion / Leg Raise", "reps_only"),
  exerciseSeed("Cat-Cow", "Mobility - Warm-Up / Rehab", "reps_only"),
  exerciseSeed("Chest-Supported Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Child's Pose", "Mobility - Warm-Up / Rehab", "time_only"),
  exerciseSeed("Chin-Up", "Back - Vertical Pull", "reps_only"),
  exerciseSeed("Clamshell", "Legs - Glutes / Hip Isolation", "reps_only"),
  exerciseSeed("Close Grip Barbell Bench Press", "Chest - Press", "strength"),
  exerciseSeed("Close-Grip Lat Pulldown", "Back - Vertical Pull", "strength"),
  exerciseSeed("Close-Grip Push-Up", "Chest - Press", "reps_only"),
  exerciseSeed("Couch Stretch", "Mobility - Warm-Up / Rehab", "time_only"),
  exerciseSeed("Cross-Body Cable Triceps Extension", "Arms - Triceps", "strength"),
  exerciseSeed("Crunch Machine", "Core - Flexion / Leg Raise", "strength"),
  exerciseSeed("Cycling", "Cardio - Bike", "distance_over_time"),
  exerciseSeed("Dead Bug", "Core - Anti-Extension", "reps_only"),
  exerciseSeed("Dead Bug Hold", "Core - Anti-Extension", "reps_over_time"),
  exerciseSeed("Deadlift", "Legs - Hip Hinge / Posterior Chain", "strength"),
  exerciseSeed("Decline Barbell Bench Press", "Chest - Press", "strength"),
  exerciseSeed("Diamond Push-Up", "Chest - Press", "reps_only"),
  exerciseSeed("Dip", "Chest - Press", "reps_only"),
  exerciseSeed("Downward Dog", "Mobility - Warm-Up / Rehab", "time_only"),
  exerciseSeed("Dumbbell Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Dumbbell Hammer Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Dumbbell Overhead Triceps Extension", "Arms - Triceps", "strength"),
  exerciseSeed("Dumbbell Romanian Deadlift", "Legs - Hip Hinge / Posterior Chain", "strength"),
  exerciseSeed("Dumbbell Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Dumbbell Shoulder Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Dumbbell Shrug", "Back - Horizontal Row", "strength"),
  exerciseSeed("Dumbbell Skull Crusher", "Arms - Triceps", "strength"),
  exerciseSeed("Dumbbell Squat", "Legs - Quad Dominant", "strength"),
  exerciseSeed("Dumbbell Triceps Kickback", "Arms - Triceps", "strength"),
  exerciseSeed("Elliptical Trainer", "Cardio - Conditioning / Machines", "distance_over_time"),
  exerciseSeed("External Rotation", "Mobility - Warm-Up / Rehab", "reps_only"),
  exerciseSeed("EZ-Bar Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("EZ-Bar Preacher Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("EZ-Bar Pushdown", "Arms - Triceps", "strength"),
  exerciseSeed("Farmer Carry", "Core - Carry / Get-Up", "weight_over_time"),
  exerciseSeed("Flat Dumbbell Bench Press", "Chest - Press", "strength"),
  exerciseSeed("Flat Dumbbell Fly", "Chest - Fly", "strength"),
  exerciseSeed("Front Dumbbell Raise", "Shoulders - Front / Lateral Raise", "strength"),
  exerciseSeed("Front Squat", "Legs - Quad Dominant", "strength"),
  exerciseSeed("Front-Foot Elevated Split Squat", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Glute Bridge", "Legs - Glutes / Hip Isolation", "reps_only"),
  exerciseSeed("Glute Kickback Machine", "Legs - Glutes / Hip Isolation", "strength"),
  exerciseSeed("Goblet Squat", "Legs - Quad Dominant", "strength"),
  exerciseSeed("Good Morning", "Legs - Hip Hinge / Posterior Chain", "strength"),
  exerciseSeed("Hack Squat", "Legs - Quad Dominant", "strength"),
  exerciseSeed("Hammer Curl (Cross-Body)", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Hammer Strength Shoulder Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Hanging Knee Raise", "Core - Flexion / Leg Raise", "reps_only"),
  exerciseSeed("Hanging Leg Raise", "Core - Flexion / Leg Raise", "reps_only"),
  exerciseSeed("High Cable Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("High-to-Low Cable Fly", "Chest - Fly", "strength"),
  exerciseSeed("Hip Abduction", "Legs - Glutes / Hip Isolation", "strength"),
  exerciseSeed("Hip Adduction", "Legs - Glutes / Hip Isolation", "strength"),
  exerciseSeed("Hip Flexor Stretch", "Mobility - Warm-Up / Rehab", "time_only"),
  exerciseSeed("Hip Thrust", "Legs - Glutes / Hip Isolation", "strength"),
  exerciseSeed("Hollow Hold", "Core - Anti-Extension", "time_only"),
  exerciseSeed("Hyperextension", "Legs - Hip Hinge / Posterior Chain", "strength"),
  exerciseSeed("Incline Barbell Bench Press", "Chest - Press", "strength"),
  exerciseSeed("Incline Dumbbell Bench Press", "Chest - Press", "strength"),
  exerciseSeed("Incline Dumbbell Fly", "Chest - Fly", "strength"),
  exerciseSeed("Incline Hammer Strength Chest Press", "Chest - Press", "strength"),
  exerciseSeed("Incline Treadmill Walk", "Cardio - Walk / Run", "distance_over_time"),
  exerciseSeed("Inverted Row", "Back - Horizontal Row", "reps_only"),
  exerciseSeed("Jogging", "Cardio - Walk / Run", "distance_over_time"),
  exerciseSeed("Jump Rope", "Cardio - Conditioning / Machines", "reps_over_time"),
  exerciseSeed("Kettlebell Swing", "Legs - Hip Hinge / Posterior Chain", "strength"),
  exerciseSeed("Landmine Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Lat Pulldown", "Back - Vertical Pull", "strength"),
  exerciseSeed("Lateral Dumbbell Raise", "Shoulders - Front / Lateral Raise", "strength"),
  exerciseSeed("Lateral Lunge", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Lean-Away Cable Lateral Raise", "Shoulders - Front / Lateral Raise", "strength"),
  exerciseSeed("Leg Curl", "Legs - Hamstrings / Leg Curl", "strength"),
  exerciseSeed("Leg Extension Machine", "Legs - Quad Dominant", "strength"),
  exerciseSeed("Leg Press", "Legs - Quad Dominant", "strength"),
  exerciseSeed("Leg Press Calf Raise", "Legs - Calves", "strength"),
  exerciseSeed("Low-to-High Cable Fly", "Chest - Fly", "strength"),
  exerciseSeed("Lying Leg Curl Machine", "Legs - Hamstrings / Leg Curl", "strength"),
  exerciseSeed("Lying Leg Raise", "Core - Flexion / Leg Raise", "reps_only"),
  exerciseSeed("Lying Triceps Extension", "Arms - Triceps", "strength"),
  exerciseSeed("Machine Chest Press", "Chest - Press", "strength"),
  exerciseSeed("Machine Incline Chest Press", "Chest - Press", "strength"),
  exerciseSeed("Machine Lateral Raise", "Shoulders - Front / Lateral Raise", "strength"),
  exerciseSeed("Machine Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Machine Shoulder Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Monster Walk", "Legs - Glutes / Hip Isolation", "reps_only"),
  exerciseSeed("Mountain Climbers", "Core - Anti-Extension", "reps_over_time"),
  exerciseSeed("Neutral-Grip Chin-Up", "Back - Vertical Pull", "reps_only"),
  exerciseSeed("Neutral-Grip Lat Pulldown", "Back - Vertical Pull", "strength"),
  exerciseSeed("One-Arm Standing Dumbbell Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed(
    "Open Book Thoracic Rotation",
    "Mobility - Warm-Up / Rehab",
    "reps_only",
  ),
  exerciseSeed("Overhead Carry", "Core - Carry / Get-Up", "weight_over_time"),
  exerciseSeed("Overhead Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Pallof Press", "Core - Rotation / Lateral Stability", "strength"),
  exerciseSeed("Pec Deck Fly", "Chest - Fly", "strength"),
  exerciseSeed("Pendlay Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Plank", "Core - Anti-Extension", "time_only"),
  exerciseSeed("Preacher Curl Machine", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Prone Y-T-W Raise", "Mobility - Warm-Up / Rehab", "reps_only"),
  exerciseSeed("Pull-Up", "Back - Vertical Pull", "reps_only"),
  exerciseSeed("Push-Up", "Chest - Press", "reps_only"),
  exerciseSeed("Rear Delt Cable Fly", "Shoulders - Rear Delts", "strength"),
  exerciseSeed("Rear Delt Dumbbell Raise", "Shoulders - Rear Delts", "strength"),
  exerciseSeed("Rear Delt Machine Fly", "Shoulders - Rear Delts", "strength"),
  exerciseSeed("Rear Delt Pec Deck", "Shoulders - Rear Delts", "strength"),
  exerciseSeed("Rear-Foot Elevated Split Squat", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Reverse Crunch", "Core - Flexion / Leg Raise", "reps_only"),
  exerciseSeed("Reverse EZ-Bar Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Reverse Lunge", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Reverse Pec Deck", "Shoulders - Rear Delts", "strength"),
  exerciseSeed("Reverse-Grip Pushdown", "Arms - Triceps", "strength"),
  exerciseSeed("RKC Plank", "Core - Anti-Extension", "time_only"),
  exerciseSeed("Romanian Deadlift", "Legs - Hip Hinge / Posterior Chain", "strength"),
  exerciseSeed("Rope Pushdown", "Arms - Triceps", "strength"),
  exerciseSeed("Rowing Machine", "Cardio - Conditioning / Machines", "distance_over_time"),
  exerciseSeed("Running (Outdoor)", "Cardio - Walk / Run", "distance_over_time"),
  exerciseSeed("Running (Treadmill)", "Cardio - Walk / Run", "distance_over_time"),
  exerciseSeed("Russian Twist", "Core - Rotation / Lateral Stability", "reps_only"),
  exerciseSeed("Scapular Pull-Up", "Back - Vertical Pull", "reps_only"),
  exerciseSeed("Scapular Push-Up", "Mobility - Warm-Up / Rehab", "reps_only"),
  exerciseSeed("Scapular Wall Slide", "Mobility - Warm-Up / Rehab", "reps_only"),
  exerciseSeed("Seated Alternating Dumbbell Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Seated Barbell Overhead Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Seated Cable Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Seated Calf Raise Machine", "Legs - Calves", "strength"),
  exerciseSeed("Seated Dumbbell Lateral Raise", "Shoulders - Front / Lateral Raise", "strength"),
  exerciseSeed("Seated Dumbbell Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Seated Incline Dumbbell Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Seated Leg Curl Machine", "Legs - Hamstrings / Leg Curl", "strength"),
  exerciseSeed("Seated Machine Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Side Plank", "Core - Rotation / Lateral Stability", "time_only"),
  exerciseSeed("Side Plank with Hip Dip", "Core - Rotation / Lateral Stability", "reps_only"),
  exerciseSeed("Single-Arm Cable Lateral Raise", "Shoulders - Front / Lateral Raise", "strength"),
  exerciseSeed("Single-Arm Cable Pushdown", "Arms - Triceps", "strength"),
  exerciseSeed("Single-Arm Cable Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Single-Arm Dumbbell Overhead Triceps Extension", "Arms - Triceps", "strength"),
  exerciseSeed("Single-Arm Dumbbell Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Single-Arm Landmine Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Single-Arm Lat Pulldown", "Back - Vertical Pull", "strength"),
  exerciseSeed("Single-Arm Overhead Cable Triceps Extension", "Arms - Triceps", "strength"),
  exerciseSeed("Single-Leg Calf Raise", "Legs - Calves", "strength"),
  exerciseSeed("Single-Leg Curl", "Legs - Hamstrings / Leg Curl", "strength"),
  exerciseSeed("Single-Leg Glute Bridge", "Legs - Glutes / Hip Isolation", "reps_only"),
  exerciseSeed("Single-Leg Press", "Legs - Quad Dominant", "strength"),
  exerciseSeed("Single-Leg Romanian Deadlift", "Legs - Hip Hinge / Posterior Chain", "strength"),
  exerciseSeed("Smith Machine Bench Press", "Chest - Press", "strength"),
  exerciseSeed("Smith Machine Romanian Deadlift", "Legs - Hip Hinge / Posterior Chain", "strength"),
  exerciseSeed("Smith Machine Squat", "Legs - Quad Dominant", "strength"),
  exerciseSeed("Spin Bike", "Cardio - Bike", "distance_over_time"),
  exerciseSeed("Split Squat", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Sprint Intervals", "Cardio - Conditioning / Machines", "distance_over_time"),
  exerciseSeed("Stair Climber", "Cardio - Conditioning / Machines", "reps_over_time"),
  exerciseSeed("Standing Barbell Overhead Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Standing Calf Raise Machine", "Legs - Calves", "strength"),
  exerciseSeed("Standing Dumbbell Curl", "Arms - Curl / Forearms", "strength"),
  exerciseSeed("Standing Dumbbell Shoulder Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Standing Hip Abduction", "Legs - Glutes / Hip Isolation", "strength"),
  exerciseSeed("Standing Hip Adduction", "Legs - Glutes / Hip Isolation", "strength"),
  exerciseSeed("Stationary Bike", "Cardio - Bike", "distance_over_time"),
  exerciseSeed("Step-Up", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Straight-Arm Pulldown", "Back - Vertical Pull", "strength"),
  exerciseSeed("Straight-Bar Pushdown", "Arms - Triceps", "strength"),
  exerciseSeed("Suitcase Carry", "Core - Carry / Get-Up", "weight_over_time"),
  exerciseSeed("Sumo Deadlift", "Legs - Hip Hinge / Posterior Chain", "strength"),
  exerciseSeed("T-Bar Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Thread the Needle", "Mobility - Warm-Up / Rehab", "reps_only"),
  exerciseSeed("Tibialis Raise", "Legs - Calves", "reps_only"),
  exerciseSeed("Trap Bar Deadlift", "Legs - Hip Hinge / Posterior Chain", "strength"),
  exerciseSeed("Triceps Pushdown", "Arms - Triceps", "strength"),
  exerciseSeed("Turkish Get-Up", "Core - Carry / Get-Up", "strength"),
  exerciseSeed("Underhand Lat Pulldown", "Back - Vertical Pull", "strength"),
  exerciseSeed("V-Bar Pushdown", "Arms - Triceps", "strength"),
  exerciseSeed("Walking Lunge", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Walking", "Cardio - Walk / Run", "distance_over_time"),
  exerciseSeed("Wall Slide", "Mobility - Warm-Up / Rehab", "reps_only"),
  exerciseSeed("Weighted Plank", "Core - Anti-Extension", "weight_over_time"),
  exerciseSeed("Weighted Push-Up", "Chest - Press", "strength"),
  exerciseSeed("Wide-Grip Lat Pulldown", "Back - Vertical Pull", "strength"),
  exerciseSeed("World's Greatest Stretch", "Mobility - Warm-Up / Rehab", "time_only"),
  exerciseSeed("Y Raise", "Shoulders - Rear Delts", "strength"),
]

async function initializeDatabaseInternal() {
  await db.transaction(
    "rw",
    db.exerciseCategories,
    db.exercises,
    db.workoutExercises,
    db.settings,
    async () => {
      const existingSettings = await db.settings.get(appSettingsId)

      if (!existingSettings) {
        await db.settings.put(createDefaultStoredAppSettings())
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
