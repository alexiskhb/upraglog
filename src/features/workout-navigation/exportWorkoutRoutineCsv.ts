import type { SetEntry, WorkoutExerciseDetail } from "@/db/schema"
import { getWorkoutDetailByDate } from "@/db/repositories/workoutsRepo"
import { formatDuration } from "@/shared/model/dates"

type ExportWorkoutRoutineCsvInput = {
  localDate: string
  profileName: string
}

type RoutineCsvCell = string | number | undefined
type RoutineCsvRow = RoutineCsvCell[]

const routineCsvHeaders = [
  "Exercise ID",
  "Weight",
  "Reps",
  "Distance",
  "Time",
]

function csvEscape(value: RoutineCsvCell) {
  if (value === undefined) {
    return ""
  }

  const text = String(value)

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }

  return text
}

function optionalNumber(value: number | null | undefined) {
  return value === null ? undefined : value
}

function formatSetDuration(set: SetEntry) {
  return set.durationSeconds === null || set.durationSeconds === undefined
    ? undefined
    : formatDuration(set.durationSeconds)
}

function formatSetRow(exerciseId: string, set: SetEntry): RoutineCsvRow {
  return [
    exerciseId,
    optionalNumber(set.weight),
    optionalNumber(set.reps),
    optionalNumber(set.distance),
    formatSetDuration(set),
  ]
}

function formatExerciseRows(entry: WorkoutExerciseDetail): RoutineCsvRow[] {
  if (entry.sets.length === 0) {
    return [[entry.exercise.id, undefined, undefined, undefined, undefined]]
  }

  return entry.sets.map((set) => formatSetRow(entry.exercise.id, set))
}

export async function exportWorkoutRoutineCsvByDate({
  localDate,
  profileName,
}: ExportWorkoutRoutineCsvInput) {
  const detail = await getWorkoutDetailByDate(localDate, profileName)
  const rows = detail.exercises.flatMap(formatExerciseRows)

  return [routineCsvHeaders, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n")
}
