import type {
  ExerciseSetIncrements,
  ExerciseType,
  SetFieldKey,
} from "@/db/schema"

export type SetFieldDefinition = {
  key: SetFieldKey
  label: string
  defaultIncrement: number
  isDuration?: boolean
}

export const defaultSetIncrements: Record<SetFieldKey, number> = {
  weight: 2.5,
  reps: 1,
  distance: 0.1,
  durationSeconds: 30,
}

const weightField: SetFieldDefinition = {
  key: "weight",
  label: "Weight",
  defaultIncrement: defaultSetIncrements.weight,
}

const repsField: SetFieldDefinition = {
  key: "reps",
  label: "Reps",
  defaultIncrement: defaultSetIncrements.reps,
}

const distanceField: SetFieldDefinition = {
  key: "distance",
  label: "Distance",
  defaultIncrement: defaultSetIncrements.distance,
}

const durationField: SetFieldDefinition = {
  key: "durationSeconds",
  label: "Time",
  defaultIncrement: defaultSetIncrements.durationSeconds,
  isDuration: true,
}

export function setFieldsForExerciseType(
  exerciseType: ExerciseType,
): SetFieldDefinition[] {
  if (exerciseType === "cardio" || exerciseType === "distance_time") {
    return [distanceField, durationField]
  }

  if (exerciseType === "weight_time") {
    return [weightField, durationField]
  }

  if (exerciseType === "reps_time") {
    return [repsField, durationField]
  }

  if (exerciseType === "reps_only") {
    return [repsField]
  }

  if (exerciseType === "time_only") {
    return [durationField]
  }

  return [weightField, repsField]
}

export function getSetIncrement(
  increments: ExerciseSetIncrements | undefined,
  key: SetFieldKey,
) {
  const increment = increments?.[key]

  return increment && increment > 0 ? increment : defaultSetIncrements[key]
}

