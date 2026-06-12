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
import { defaultSetCommentTemplates } from "@/shared/model/setCommentTemplates"
import { defaultSpreadsheetShareMessage } from "@/shared/model/spreadsheetShare"

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
  exerciseSeed("Ab-Wheel Rollout", "Core - Anti-Extension", "reps_only"),
  exerciseSeed("Air Bike", "Cardio - Bike", "distance_over_time"),
  exerciseSeed("Alternating Dumbbell Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Arnold Dumbbell Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Assisted Pull-Up", "Back - Vertical Pull", "strength"),
  exerciseSeed("Back Extension", "Back - Lower Back / Hinge", "strength"),
  exerciseSeed("Barbell Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Barbell Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Barbell Squat", "Legs - Squat Pattern", "strength"),
  exerciseSeed("Bayesian Cable Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Behind-the-Body Cable Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Belt Squat", "Legs - Squat Pattern", "strength"),
  exerciseSeed("Bird Dog", "Core - Anti-Extension", "reps_only"),
  exerciseSeed("Bird Dog Hold", "Core - Anti-Extension", "reps_over_time"),
  exerciseSeed("Bodyweight Squat", "Legs - Squat Pattern", "reps_only"),
  exerciseSeed("Bulgarian Split Squat", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Cable Crunch", "Core - Flexion", "strength"),
  exerciseSeed("Cable Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Cable Face Pull", "Shoulders - Rear Delts", "strength"),
  exerciseSeed("Cable Hammer Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Cable Kickback", "Legs - Hip Thrust / Glutes", "strength"),
  exerciseSeed("Cable Lateral Raise", "Shoulders - Lateral Raise", "strength"),
  exerciseSeed("Cable Overhead Triceps Extension", "Arms - Triceps Extension", "strength"),
  exerciseSeed("Cable Preacher Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Cable Reverse Curl", "Arms - Forearms", "strength"),
  exerciseSeed("Cable Woodchopper", "Core - Rotation", "strength"),
  exerciseSeed("Captain's Chair Leg Raise", "Core - Leg Raise", "reps_only"),
  exerciseSeed("Chest Press", "Chest - Horizontal Press", "strength"),
  exerciseSeed("Chest-Supported Dumbbell Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Chest-Supported Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Chin Up", "Back - Vertical Pull", "reps_only"),
  exerciseSeed("Close Grip Barbell Bench Press", "Chest - Horizontal Press", "strength"),
  exerciseSeed("Close-Grip Lat Pulldown", "Back - Vertical Pull", "strength"),
  exerciseSeed("Cross-Body Cable Triceps Extension", "Arms - Triceps Extension", "strength"),
  exerciseSeed("Crunch Machine", "Core - Flexion", "strength"),
  exerciseSeed("Cycling", "Cardio - Bike", "distance_over_time"),
  exerciseSeed("Dead Bug", "Core - Anti-Extension", "reps_only"),
  exerciseSeed("Dead Bug Hold", "Core - Anti-Extension", "reps_over_time"),
  exerciseSeed("Deadlift", "Back - Lower Back / Hinge", "strength"),
  exerciseSeed("Diamond Push-Up", "Chest - Push-Up / Dip", "reps_only"),
  exerciseSeed("Dumbbell Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Dumbbell Hammer Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Dumbbell Overhead Triceps Extension", "Arms - Triceps Extension", "strength"),
  exerciseSeed("Dumbbell Romanian Deadlift", "Back - Lower Back / Hinge", "strength"),
  exerciseSeed("Dumbbell Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Dumbbell Shoulder Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Dumbbell Squat", "Legs - Squat Pattern", "strength"),
  exerciseSeed("EZ-Bar Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("EZ-Bar Preacher Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("EZ-Bar Pushdown", "Arms - Triceps Pushdown", "strength"),
  exerciseSeed("Elliptical Trainer", "Cardio - Conditioning", "distance_over_time"),
  exerciseSeed("Farmer Carry", "Core - Loaded Carry", "weight_over_time"),
  exerciseSeed("Flat Dumbbell Bench Press", "Chest - Horizontal Press", "strength"),
  exerciseSeed("Flat Dumbbell Fly", "Chest - Fly", "strength"),
  exerciseSeed("Front Dumbbell Raise", "Shoulders", "strength"),
  exerciseSeed("Front-Foot Elevated Split Squat", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Glute Kickback Machine", "Legs - Hip Thrust / Glutes", "strength"),
  exerciseSeed("Goblet Squat", "Legs - Squat Pattern", "strength"),
  exerciseSeed("Hack Squat", "Legs - Squat Pattern", "strength"),
  exerciseSeed("Hack Squat Machine", "Legs - Squat Pattern", "strength"),
  exerciseSeed("Hammer Curl (Cross-Body)", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Hammer Strength Shoulder Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Hanging Knee Raise", "Core - Leg Raise", "reps_only"),
  exerciseSeed("High Cable Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Hip Abduction", "Legs - Hip Abduction", "strength"),
  exerciseSeed("Hip Adduction", "Legs - Hip Adduction", "strength"),
  exerciseSeed("Hip Thrust", "Legs - Hip Thrust / Glutes", "strength"),
  exerciseSeed("Hollow Hold", "Core - Anti-Extension", "time_only"),
  exerciseSeed("Hyperextension", "Back - Lower Back / Hinge", "strength"),
  exerciseSeed("Incline Dumbbell Bench Press", "Chest - Incline Press", "strength"),
  exerciseSeed("Incline Dumbbell Fly", "Chest - Fly", "strength"),
  exerciseSeed("Incline Hammer Strength Chest Press", "Chest - Incline Press", "strength"),
  exerciseSeed("Incline Treadmill Walk", "Cardio - Walk / Run", "distance_over_time"),
  exerciseSeed("Jogging", "Cardio - Walk / Run", "distance_over_time"),
  exerciseSeed("Landmine Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Lat Pulldown", "Back - Vertical Pull", "strength"),
  exerciseSeed("Lateral Dumbbell Raise", "Shoulders - Lateral Raise", "strength"),
  exerciseSeed("Lateral Machine Raise", "Shoulders - Lateral Raise", "strength"),
  exerciseSeed("Lean-Away Cable Lateral Raise", "Shoulders - Lateral Raise", "strength"),
  exerciseSeed("Leg Curl", "Legs - Leg Curl / Hamstrings", "strength"),
  exerciseSeed("Leg Extension Machine", "Legs - Leg Extension", "strength"),
  exerciseSeed("Leg Press", "Legs - Leg Press", "strength"),
  exerciseSeed("Leg Press Calf Raise", "Legs - Calves", "strength"),
  exerciseSeed("Lying Leg Curl Machine", "Legs - Leg Curl / Hamstrings", "strength"),
  exerciseSeed("Lying Triceps Extension", "Arms - Triceps Extension", "strength"),
  exerciseSeed("Machine Chest Press", "Chest - Horizontal Press", "strength"),
  exerciseSeed("Machine Incline Chest Press", "Chest - Incline Press", "strength"),
  exerciseSeed("Machine Lateral Raise", "Shoulders - Lateral Raise", "strength"),
  exerciseSeed("Machine Preacher Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Machine Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Machine Shoulder Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Mountain Climber", "Cardio - Conditioning", "reps_over_time"),
  exerciseSeed("Mountain Climbers", "Core - Anti-Extension", "reps_over_time"),
  exerciseSeed("Neutral Chin Up", "Back - Vertical Pull", "reps_only"),
  exerciseSeed("Neutral-Grip Lat Pulldown", "Back - Vertical Pull", "strength"),
  exerciseSeed("One-Arm Standing Dumbbell Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Overhead Carry", "Core - Loaded Carry", "weight_over_time"),
  exerciseSeed("Overhead Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Pallof press", "Core - Anti-Rotation", "strength"),
  exerciseSeed("Pec Deck Fly", "Chest - Fly", "strength"),
  exerciseSeed("Plank", "Core - Anti-Extension", "time_only"),
  exerciseSeed("Preacher Curl Machine", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Pull Up", "Back - Vertical Pull", "reps_only"),
  exerciseSeed("Push-Up", "Chest - Push-Up / Dip", "reps_only"),
  exerciseSeed("RKC Plank", "Core - Anti-Extension", "time_only"),
  exerciseSeed("Rear Delt Cable Fly", "Shoulders - Rear Delts", "strength"),
  exerciseSeed("Rear Delt Dumbbell Raise", "Shoulders - Rear Delts", "strength"),
  exerciseSeed("Rear Delt Machine Fly", "Shoulders - Rear Delts", "strength"),
  exerciseSeed("Rear Delt Pec Deck", "Shoulders - Rear Delts", "strength"),
  exerciseSeed("Rear-Foot Elevated Split Squat", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Reverse Crunch", "Core - Flexion", "reps_only"),
  exerciseSeed("Reverse EZ-Bar Curl", "Arms - Forearms", "strength"),
  exerciseSeed("Reverse Pec Deck", "Shoulders - Rear Delts", "strength"),
  exerciseSeed("Reverse-Grip Pushdown", "Arms - Triceps Pushdown", "strength"),
  exerciseSeed("Romanian Deadlift", "Back - Lower Back / Hinge", "strength"),
  exerciseSeed("Rope Push Down", "Arms - Triceps Pushdown", "strength"),
  exerciseSeed("Rowing Machine", "Cardio - Row / Ski Erg", "distance_over_time"),
  exerciseSeed("Running (Outdoor)", "Cardio - Walk / Run", "distance_over_time"),
  exerciseSeed("Running (Treadmill)", "Cardio - Walk / Run", "distance_over_time"),
  exerciseSeed("Russian Twist", "Core - Flexion", "reps_only"),
  exerciseSeed("Scapular Pull-Up", "Back - Vertical Pull", "reps_only"),
  exerciseSeed("Seated Alternating Dumbbell Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Seated Barbell Overhead Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Seated Cable Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Seated Calf Raise Machine", "Legs - Calves", "strength"),
  exerciseSeed("Seated Dumbbell Lateral Raise", "Shoulders - Lateral Raise", "strength"),
  exerciseSeed("Seated Dumbbell Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Seated Incline Dumbbell Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Seated Leg Curl Machine", "Legs - Leg Curl / Hamstrings", "strength"),
  exerciseSeed("Seated Machine Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Side Plank", "Core - Lateral Stability", "time_only"),
  exerciseSeed("Side Plank with Hip Dip", "Core - Lateral Stability", "reps_only"),
  exerciseSeed("Single-Arm Cable Lateral Raise", "Shoulders - Lateral Raise", "strength"),
  exerciseSeed("Single-Arm Cable Pushdown", "Arms - Triceps Pushdown", "strength"),
  exerciseSeed("Single-Arm Cable Row", "Back - Single-Arm Pull", "strength"),
  exerciseSeed("Single-Arm Dumbbell Overhead Triceps Extension", "Arms - Triceps Extension", "strength"),
  exerciseSeed("Single-Arm Dumbbell Row", "Back - Horizontal Row", "strength"),
  exerciseSeed("Single-Arm Landmine Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Single-Arm Lat Pulldown", "Back - Single-Arm Pull", "strength"),
  exerciseSeed("Single-Arm Overhead Cable Triceps Extension", "Arms - Triceps Extension", "strength"),
  exerciseSeed("Single-Leg Calf Raise", "Legs - Calves", "reps_only"),
  exerciseSeed("Single-Leg Curl", "Legs - Leg Curl / Hamstrings", "strength"),
  exerciseSeed("Single-Leg Press", "Legs - Leg Press", "strength"),
  exerciseSeed("Single-Leg Romanian Deadlift", "Back - Lower Back / Hinge", "strength"),
  exerciseSeed("Spin Bike", "Cardio - Bike", "distance_over_time"),
  exerciseSeed("Split Squat", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Sprint Intervals", "Cardio - Conditioning", "distance_over_time"),
  exerciseSeed("Stair Climber", "Cardio - Stairs", "reps_over_time"),
  exerciseSeed("StairMaster", "Cardio - Stairs", "reps_over_time"),
  exerciseSeed("Standing Barbell Overhead Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Standing Calf Raise Machine", "Legs - Calves", "strength"),
  exerciseSeed("Standing Dumbbell Curl", "Arms - Biceps Curl", "strength"),
  exerciseSeed("Standing Dumbbell Shoulder Press", "Shoulders - Overhead Press", "strength"),
  exerciseSeed("Standing Hip Abduction", "Legs - Hip Abduction", "strength"),
  exerciseSeed("Standing Hip Adduction", "Legs - Hip Adduction", "strength"),
  exerciseSeed("Stationary Bike", "Cardio - Bike", "distance_over_time"),
  exerciseSeed("Step-Up", "Legs - Split Squat / Lunge", "strength"),
  exerciseSeed("Straight-Bar Pushdown", "Arms - Triceps Pushdown", "strength"),
  exerciseSeed("Suitcase Carry", "Core - Loaded Carry", "weight_over_time"),
  exerciseSeed("Tibialis Raise", "Legs - Calves", "reps_only"),
  exerciseSeed("Triceps Pushdown", "Arms - Triceps Pushdown", "strength"),
  exerciseSeed("Turkish Get-Up", "Core - Loaded Carry", "strength"),
  exerciseSeed("Underhand Lat Pulldown", "Back - Vertical Pull", "strength"),
  exerciseSeed("V-Bar Push Down", "Arms - Triceps Pushdown", "strength"),
  exerciseSeed("Walking", "Cardio - Walk / Run", "distance_over_time"),
  exerciseSeed("Weighted Plank", "Core - Anti-Extension", "weight_over_time"),
  exerciseSeed("Weighted Push-Up", "Chest - Push-Up / Dip", "strength"),
  exerciseSeed("Wide-Grip Lat Pulldown", "Back - Vertical Pull", "strength"),
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
          spreadsheetExportMonthLimit: null,
          spreadsheetShareMessage: defaultSpreadsheetShareMessage,
          spreadsheetShareIncludeMessage: true,
          spreadsheetShareIncludeAiInstructions: true,
          spreadsheetShareAttachMessageAsFile: false,
          addShareShortcutToMenu: false,
          treatLongWorkoutTimerAsLatestSetFinish: false,
          setCommentTemplates: [...defaultSetCommentTemplates],
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
