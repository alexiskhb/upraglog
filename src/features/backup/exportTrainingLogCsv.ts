import { subMonths } from "date-fns"
import { db } from "@/db/db"
import { getSettings } from "@/db/repositories/settingsRepo"
import type {
  Exercise,
  SetEntry,
  Workout,
  WorkoutExercise,
} from "@/db/schema"
import {
  formatDuration,
  getWorkoutDurationSeconds,
  toLocalDateString,
} from "@/shared/model/dates"
import { formatExerciseCategory, formatExerciseType } from "@/shared/model/exercises"
import { defaultProfileName } from "@/shared/model/profiles"

const csvHeaders = [
  "Workout Date",
  "Profile",
  "Workout Started At",
  "Workout Ended At",
  "Workout Duration",
  "Exercise Order",
  "Exercise Name",
  "Category",
  "Exercise Type",
  "Set Number",
  "Weight",
  "Reps",
  "Distance",
  "Comment",
]

type TrainingLogRow = Array<string | number | undefined>

type ExportTrainingLogCsvOptions = {
  monthLimit?: number | null
}

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

function getWorkoutProfileName(workout: Workout) {
  return workout.profileName || defaultProfileName
}

function getExportStartDate(monthLimit?: number | null) {
  if (!monthLimit || monthLimit < 1) {
    return undefined
  }

  return toLocalDateString(subMonths(new Date(), Math.floor(monthLimit)))
}

function byWorkoutExportOrder(a: Workout, b: Workout) {
  return (
    a.localDate.localeCompare(b.localDate) ||
    (a.startedAt ?? "").localeCompare(b.startedAt ?? "") ||
    getWorkoutProfileName(a).localeCompare(getWorkoutProfileName(b))
  )
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
}: {
  workout: Workout
  workoutExercise: WorkoutExercise
  exercise: Exercise
  set?: SetEntry
  setIndex?: number
}): TrainingLogRow {
  return [
    workout.localDate,
    getWorkoutProfileName(workout),
    formatStoredDateTime(workout.startedAt),
    formatStoredDateTime(workout.endedAt),
    formatWorkoutDuration(workout),
    workoutExercise.order + 1,
    exercise.id,
    formatExerciseCategory(exercise.category),
    formatExerciseType(exercise.exerciseType),
    setIndex === undefined ? undefined : setIndex + 1,
    set?.weight ?? undefined,
    set?.reps ?? undefined,
    set?.distance ?? undefined,
    set?.comment,
  ]
}

export async function exportTrainingLogCsv(
  options: ExportTrainingLogCsvOptions = {},
) {
  const [settings, workouts, workoutExercises, sets, exercises] = await Promise.all([
    getSettings(),
    db.workouts.toArray(),
    db.workoutExercises.toArray(),
    db.sets.toArray(),
    db.exercises.toArray(),
  ])
  const exportProfiles = new Set(
    settings.exportAllProfiles ? settings.profiles : [settings.selectedProfile],
  )
  const workoutExercisesByWorkoutId = new Map<string, WorkoutExercise[]>()
  const setsByWorkoutExerciseId = new Map<string, SetEntry[]>()
  const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const rows: TrainingLogRow[] = []
  const exportStartDate = getExportStartDate(options.monthLimit)

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

  for (const workout of workouts.sort(byWorkoutExportOrder)) {
    if (!exportProfiles.has(getWorkoutProfileName(workout))) {
      continue
    }

    if (exportStartDate && workout.localDate < exportStartDate) {
      continue
    }

    const workoutExerciseRows = (
      workoutExercisesByWorkoutId.get(workout.id) ?? []
    ).sort(byOrder)

    if (workoutExerciseRows.length === 0) {
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
