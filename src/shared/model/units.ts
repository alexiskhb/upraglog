import type { ExerciseType, SetEntry, UnitSystem } from "@/db/schema"
import { formatDuration } from "./dates"

export function weightUnit(unitSystem: UnitSystem) {
  return unitSystem === "metric" ? "kgs" : "lbs"
}

export function distanceUnit(unitSystem: UnitSystem) {
  return unitSystem === "metric" ? "km" : "mi"
}

export function displayNumber(
  value: number | null | undefined,
  fractionDigits = 1,
) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-"
  }

  return value.toFixed(fractionDigits)
}

function displayReps(value: number | null | undefined) {
  return value === null || value === undefined
    ? "- reps"
    : `${Math.round(value)} reps`
}

function displayDuration(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : formatDuration(value)
}

export function formatSetPrimaryValue(
  set: SetEntry,
  exerciseType: ExerciseType,
  unitSystem: UnitSystem,
) {
  if (exerciseType === "cardio" || exerciseType === "distance_time") {
    return `${displayNumber(set.distance)} ${distanceUnit(unitSystem)}`
  }

  if (exerciseType === "time_only") {
    return displayDuration(set.durationSeconds)
  }

  if (exerciseType === "reps_only" || exerciseType === "reps_time") {
    return displayReps(set.reps)
  }

  return `${displayNumber(set.weight)} ${weightUnit(unitSystem)}`
}

export function formatSetSecondaryValue(
  set: SetEntry,
  exerciseType: ExerciseType,
) {
  if (exerciseType === "reps_only" || exerciseType === "time_only") {
    return ""
  }

  if (
    exerciseType === "cardio" ||
    exerciseType === "distance_time" ||
    exerciseType === "weight_time" ||
    exerciseType === "reps_time"
  ) {
    return displayDuration(set.durationSeconds)
  }

  return displayReps(set.reps)
}
