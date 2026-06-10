import { db } from "@/db/db"
import type {
  Exercise,
  SetEntry,
  UnitSystem,
  Workout,
  WorkoutExercise,
} from "@/db/schema"
import { getSettings } from "@/db/repositories/settingsRepo"
import { formatDuration, getWorkoutDurationSeconds } from "@/shared/model/dates"
import { formatExerciseCategory, formatExerciseType } from "@/shared/model/exercises"
import { distanceUnit, weightUnit } from "@/shared/model/units"

const csvHeaders = [
  "Workout Date",
  "Workout Started At",
  "Workout Ended At",
  "Workout Duration",
  "Exercise Order",
  "Exercise Name",
  "Category",
  "Exercise Type",
  "Set Number",
  "Weight",
  "Weight Unit",
  "Reps",
  "Distance",
  "Distance Unit",
  "Set Duration",
  "Comment",
]

type TrainingLogRow = Array<string | number | undefined>

function csvEscape(value: string | number | undefined) {
  if (value === undefined) {
    return ""
  }

  const text = String(value)

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }

  return text
}

function toCsv(rows: TrainingLogRow[]) {
  return [csvHeaders, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n")
}

function pad2(value: number) {
  return value.toString().padStart(2, "0")
}

function formatLocalDateTime(date: Date) {
  return [
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`,
  ].join(" ")
}

function formatDateTimeForFilename(date: Date) {
  return formatLocalDateTime(date).replace(" ", "_").replaceAll(":", "-")
}

function formatStoredDateTime(iso?: string) {
  return iso ? formatLocalDateTime(new Date(iso)) : undefined
}

function formatWorkoutDuration(workout: Workout) {
  if (!workout.startedAt) {
    return undefined
  }

  return formatDuration(
    getWorkoutDurationSeconds(workout.startedAt, workout.endedAt),
  )
}

function byWorkoutDate(a: Workout, b: Workout) {
  return a.localDate.localeCompare(b.localDate)
}

function byOrder<T extends { order: number }>(a: T, b: T) {
  return a.order - b.order
}

function buildSetRow({
  workout,
  workoutExercise,
  exercise,
  set,
  setIndex,
  unitSystem,
}: {
  workout: Workout
  workoutExercise: WorkoutExercise
  exercise: Exercise
  set?: SetEntry
  setIndex?: number
  unitSystem: UnitSystem
}): TrainingLogRow {
  return [
    workout.localDate,
    formatStoredDateTime(workout.startedAt),
    formatStoredDateTime(workout.endedAt),
    formatWorkoutDuration(workout),
    workoutExercise.order + 1,
    exercise.name,
    formatExerciseCategory(exercise.category),
    formatExerciseType(exercise.exerciseType),
    setIndex === undefined ? undefined : setIndex + 1,
    set?.weight ?? undefined,
    set?.weight == null ? undefined : weightUnit(unitSystem),
    set?.reps ?? undefined,
    set?.distance ?? undefined,
    set?.distance == null ? undefined : distanceUnit(unitSystem),
    set?.durationSeconds == null
      ? undefined
      : formatDuration(set.durationSeconds),
    set?.comment,
  ]
}

export async function exportTrainingLogCsv() {
  const [workouts, workoutExercises, sets, exercises, settings] =
    await Promise.all([
      db.workouts.toArray(),
      db.workoutExercises.toArray(),
      db.sets.toArray(),
      db.exercises.toArray(),
      getSettings(),
    ])
  const workoutExercisesByWorkoutId = new Map<string, WorkoutExercise[]>()
  const setsByWorkoutExerciseId = new Map<string, SetEntry[]>()
  const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const rows: TrainingLogRow[] = []

  for (const workoutExercise of workoutExercises) {
    const current =
      workoutExercisesByWorkoutId.get(workoutExercise.workoutId) ?? []
    current.push(workoutExercise)
    workoutExercisesByWorkoutId.set(workoutExercise.workoutId, current)
  }

  for (const set of sets) {
    const current = setsByWorkoutExerciseId.get(set.workoutExerciseId) ?? []
    current.push(set)
    setsByWorkoutExerciseId.set(set.workoutExerciseId, current)
  }

  for (const workout of workouts.sort(byWorkoutDate)) {
    const workoutExerciseRows = (
      workoutExercisesByWorkoutId.get(workout.id) ?? []
    ).sort(byOrder)

    if (workoutExerciseRows.length === 0) {
      rows.push([
        workout.localDate,
        formatStoredDateTime(workout.startedAt),
        formatStoredDateTime(workout.endedAt),
        formatWorkoutDuration(workout),
      ])
      continue
    }

    for (const workoutExercise of workoutExerciseRows) {
      const exercise = exercisesById.get(workoutExercise.exerciseId)

      if (!exercise) {
        continue
      }

      const setRows = (
        setsByWorkoutExerciseId.get(workoutExercise.id) ?? []
      ).sort(byOrder)

      if (setRows.length === 0) {
        rows.push(
          buildSetRow({
            workout,
            workoutExercise,
            exercise,
            unitSystem: settings.unitSystem,
          }),
        )
        continue
      }

      setRows.forEach((set, setIndex) => {
        rows.push(
          buildSetRow({
            workout,
            workoutExercise,
            exercise,
            set,
            setIndex,
            unitSystem: settings.unitSystem,
          }),
        )
      })
    }
  }

  return {
    filename: `upraglog-training-log-${formatDateTimeForFilename(new Date())}.csv`,
    text: `\uFEFF${toCsv(rows)}`,
  }
}
