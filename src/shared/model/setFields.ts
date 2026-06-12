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

const setValueFieldKeys = [
  "weight",
  "reps",
  "distance",
  "durationSeconds",
] as const satisfies readonly SetFieldKey[]

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

  for (const key of setValueFieldKeys) {
    if (allowedFields.has(key) && input[key] !== undefined) {
      nextInput[key] = input[key]
    }
  }

  if (input.comment !== undefined) {
    nextInput.comment = input.comment
  }

  return nextInput
}

export function setInputFromSetEntryForExerciseType(
  exerciseType: ExerciseType,
  set: Pick<SetEntry, SetFieldKey | "comment">,
): SetEntryInput {
  const input: SetEntryInput = {}

  for (const key of setValueFieldKeys) {
    if (set[key] !== undefined) {
      input[key] = set[key]
    }
  }

  if (set.comment !== undefined) {
    input.comment = set.comment
  }

  return filterSetInputForExerciseType(exerciseType, input)
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
  const setInput = setInputFromSetEntryForExerciseType(exerciseType, {
    weight,
    reps,
    distance,
    durationSeconds,
    comment: rest.comment,
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
