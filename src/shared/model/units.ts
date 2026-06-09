import type { ExerciseType, SetEntry, UnitSystem } from "@/db/schema"
import { formatDuration } from "./dates"

export function weightUnit(unitSystem: UnitSystem) {
  return unitSystem === "metric" ? "kgs" : "lbs"
}

export function distanceUnit(unitSystem: UnitSystem) {
  return unitSystem === "metric" ? "km" : "mi"
}

export function displayNumber(value: number | undefined, fractionDigits = 1) {
  if (value === undefined || Number.isNaN(value)) {
    return "-"
  }

  return value.toFixed(fractionDigits)
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
    return formatDuration(set.durationSeconds ?? 0)
  }

  if (exerciseType === "reps_only" || exerciseType === "reps_time") {
    return `${Math.round(set.reps ?? 0)} reps`
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
    return formatDuration(set.durationSeconds ?? 0)
  }

  return `${Math.round(set.reps ?? 0)} reps`
}

export function defaultUnitForMeasurement(measurementType: string) {
  const normalized = measurementType.toLowerCase()

  if (normalized.includes("fat")) {
    return "%"
  }

  if (normalized.includes("weight")) {
    return "kg"
  }

  return "cm"
}
