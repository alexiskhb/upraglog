import { db } from "@/db/db"
import type { Exercise, SetEntryInput, SetFieldKey } from "@/db/schema"
import {
  addExerciseToDate,
  addSetToWorkoutExercise,
} from "@/db/repositories/workoutsRepo"
import { setFieldsForExerciseType } from "@/shared/model/setFields"

type ImportWorkoutRoutineCsvInput = {
  localDate: string
  profileName: string
  text: string
}

type RoutineColumn = "exerciseId" | SetFieldKey

type RoutineRow = {
  exerciseId: string
  setInput: SetEntryInput
}

const defaultColumns: RoutineColumn[] = [
  "exerciseId",
  "weight",
  "reps",
  "distance",
  "durationSeconds",
]

function extractCsvText(text: string) {
  const fencedBlock = text.match(/```(?:csv)?\s*([\s\S]*?)```/i)

  return (fencedBlock?.[1] ?? text).trim()
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const nextChar = text[index + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      row.push(field)
      field = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      row.push(field)
      rows.push(row)
      row = []
      field = ""

      if (char === "\r" && nextChar === "\n") {
        index += 1
      }
      continue
    }

    field += char
  }

  if (field || row.length > 0 || text.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((currentRow) =>
    currentRow.some((cell) => cell.trim().length > 0),
  )
}

function normalizeHeaderCell(cell: string) {
  return cell.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, "")
}

function resolveColumn(cell: string): RoutineColumn | undefined {
  const normalizedCell = normalizeHeaderCell(cell)

  if (
    normalizedCell === "exerciseid" ||
    normalizedCell === "exercise" ||
    normalizedCell === "exercisename"
  ) {
    return "exerciseId"
  }

  if (normalizedCell === "weight") {
    return "weight"
  }

  if (normalizedCell === "reps" || normalizedCell === "rep") {
    return "reps"
  }

  if (normalizedCell === "distance") {
    return "distance"
  }

  if (
    normalizedCell === "time" ||
    normalizedCell === "duration" ||
    normalizedCell === "durationseconds"
  ) {
    return "durationSeconds"
  }

  return undefined
}

function parseNumber(cell: string) {
  const value = Number(cell.trim())

  return Number.isFinite(value) ? value : undefined
}

function parseDurationSeconds(cell: string) {
  const text = cell.trim()

  if (!text) {
    return undefined
  }

  const parts = text.split(":").map((part) => Number(part))

  if (parts.length === 2 && parts.every(Number.isFinite)) {
    return parts[0] * 60 + parts[1]
  }

  if (parts.length === 3 && parts.every(Number.isFinite)) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }

  return parseNumber(text)
}

function hasHeader(row: string[]) {
  return resolveColumn(row[0] ?? "") === "exerciseId"
}

function buildRoutineRows(text: string): RoutineRow[] {
  const rows = parseCsv(extractCsvText(text))

  if (rows.length === 0) {
    return []
  }

  const columns = hasHeader(rows[0])
    ? rows[0].map(resolveColumn)
    : defaultColumns
  const dataRows = hasHeader(rows[0]) ? rows.slice(1) : rows

  return dataRows
    .map((row) => {
      const routineRow: RoutineRow = {
        exerciseId: "",
        setInput: {},
      }

      row.forEach((cell, index) => {
        const column = columns[index]

        if (!column) {
          return
        }

        if (column === "exerciseId") {
          routineRow.exerciseId = cell.trim()
          return
        }

        if (column === "durationSeconds") {
          const durationSeconds = parseDurationSeconds(cell)

          if (durationSeconds !== undefined) {
            routineRow.setInput.durationSeconds = durationSeconds
          }
          return
        }

        const value = parseNumber(cell)

        if (value !== undefined) {
          routineRow.setInput[column] = value
        }
      })

      return routineRow
    })
    .filter((row) => row.exerciseId)
}

function exerciseExists(exercise: Exercise | undefined): exercise is Exercise {
  return exercise !== undefined
}

function filterSetInputForExercise(exercise: Exercise, setInput: SetEntryInput) {
  const allowedFields = new Set(
    setFieldsForExerciseType(exercise.exerciseType).map((field) => field.key),
  )
  const nextSetInput: SetEntryInput = {}

  if (allowedFields.has("weight") && setInput.weight !== undefined) {
    nextSetInput.weight = setInput.weight
  }

  if (allowedFields.has("reps") && setInput.reps !== undefined) {
    nextSetInput.reps = setInput.reps
  }

  if (allowedFields.has("distance") && setInput.distance !== undefined) {
    nextSetInput.distance = setInput.distance
  }

  if (
    allowedFields.has("durationSeconds") &&
    setInput.durationSeconds !== undefined
  ) {
    nextSetInput.durationSeconds = setInput.durationSeconds
  }

  return nextSetInput
}

function hasSetValues(setInput: SetEntryInput) {
  return Object.values(setInput).some((value) => value !== undefined)
}

export async function importWorkoutRoutineCsvToDate({
  localDate,
  profileName,
  text,
}: ImportWorkoutRoutineCsvInput) {
  try {
    const routineRows = buildRoutineRows(text)
    const exerciseIds = [...new Set(routineRows.map((row) => row.exerciseId))]
    const exercises = await db.exercises.bulkGet(exerciseIds)
    const exercisesById = new Map(
      exercises.filter(exerciseExists).map((exercise) => [
        exercise.id,
        exercise,
      ]),
    )

    for (const routineRow of routineRows) {
      const exercise = exercisesById.get(routineRow.exerciseId)

      if (!exercise) {
        continue
      }

      const workoutExercise = await addExerciseToDate(
        localDate,
        profileName,
        exercise.id,
      )
      const setInput = filterSetInputForExercise(exercise, routineRow.setInput)

      if (hasSetValues(setInput)) {
        await addSetToWorkoutExercise(workoutExercise.id, setInput)
      }
    }
  } catch {
    // Routine imports are intentionally silent for now.
  }
}
