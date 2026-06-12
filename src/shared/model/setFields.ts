import type {
  ExerciseSetDefaults,
  ExerciseSetIncrements,
  ExerciseType,
  SetEntry,
  SetEntryInput,
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
  durationSeconds: 10,
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
  if (exerciseType === "distance_over_time") {
    return [distanceField, durationField]
  }

  if (exerciseType === "weight_over_time") {
    return [weightField, durationField]
  }

  if (exerciseType === "reps_over_time") {
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

export function setFieldKeysForExerciseType(exerciseType: ExerciseType) {
  return setFieldsForExerciseType(exerciseType).map((field) => field.key)
}

export function filterSetInputForExerciseType(
  exerciseType: ExerciseType,
  input: SetEntryInput,
): SetEntryInput {
  const allowedFields = new Set(setFieldKeysForExerciseType(exerciseType))
  const nextInput: SetEntryInput = {}

  if (allowedFields.has("weight") && input.weight !== undefined) {
    nextInput.weight = input.weight
  }

  if (allowedFields.has("reps") && input.reps !== undefined) {
    nextInput.reps = input.reps
  }

  if (allowedFields.has("distance") && input.distance !== undefined) {
    nextInput.distance = input.distance
  }

  if (
    allowedFields.has("durationSeconds") &&
    input.durationSeconds !== undefined
  ) {
    nextInput.durationSeconds = input.durationSeconds
  }

  if (input.comment !== undefined) {
    nextInput.comment = input.comment
  }

  return nextInput
}

export function filterExerciseSetDefaultsForExerciseType(
  exerciseType: ExerciseType,
  input: ExerciseSetDefaults,
): ExerciseSetDefaults {
  const setInput = filterSetInputForExerciseType(exerciseType, input)

  return {
    ...(setInput.weight !== undefined ? { weight: setInput.weight } : {}),
    ...(setInput.reps !== undefined ? { reps: setInput.reps } : {}),
    ...(setInput.distance !== undefined ? { distance: setInput.distance } : {}),
    ...(setInput.durationSeconds !== undefined
      ? { durationSeconds: setInput.durationSeconds }
      : {}),
  }
}

export function normalizeSetEntryForExerciseType<T extends SetEntry>(
  exerciseType: ExerciseType,
  set: T,
): T {
  const { weight, reps, distance, durationSeconds, ...rest } = set
  const setInput = filterSetInputForExerciseType(exerciseType, {
    weight,
    reps,
    distance,
    durationSeconds,
  })

  return {
    ...rest,
    ...setInput,
  } as T
}

export function getSetIncrement(
  increments: ExerciseSetIncrements | undefined,
  key: SetFieldKey,
) {
  const increment = increments?.[key]

  return increment && increment > 0 ? increment : defaultSetIncrements[key]
}
