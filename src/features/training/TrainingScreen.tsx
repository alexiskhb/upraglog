import { useEffect, useState } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import type {
  ExerciseSetDefaults,
  SetFieldKey,
  SetEntry,
  SetEntryInput,
} from "@/db/schema"
import { updateExerciseSetDefaults } from "@/db/repositories/exercisesRepo"
import {
  addSetToWorkoutExercise,
  deleteSet,
  getWorkoutExerciseDetail,
  reorderSets,
  updateSet,
} from "@/db/repositories/workoutsRepo"
import { useAppStore } from "@/shared/store/appStore"
import {
  getSetIncrement,
  setFieldsForExerciseType,
} from "@/shared/model/setFields"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { ActionButton } from "@/shared/ui/ActionButton"
import { WorkoutActiveTimer } from "@/shared/ui/WorkoutActiveTimer"
import { NumericStepper } from "./NumericStepper"
import { SetRow } from "./SetRow"
import { SetCommentDialog } from "./SetCommentDialog"

type TrainingDetail = NonNullable<
  Awaited<ReturnType<typeof getWorkoutExerciseDetail>>
>

type FieldKey = SetFieldKey
type InputState = Record<FieldKey, number | null>

const defaultInput: InputState = {
  weight: null,
  reps: null,
  distance: null,
  durationSeconds: null,
}

type FieldConfig = {
  key: FieldKey
  label: string
  step: number
  isDuration?: boolean
}

function inputFromSet(set: SetEntry): InputState {
  return {
    weight: set.weight ?? null,
    reps: set.reps ?? null,
    distance: set.distance ?? null,
    durationSeconds: set.durationSeconds ?? null,
  }
}

function inputFromExerciseSetDefaults(
  lastSetInput?: ExerciseSetDefaults,
): InputState {
  return {
    weight: lastSetInput?.weight ?? null,
    reps: lastSetInput?.reps ?? null,
    distance: lastSetInput?.distance ?? null,
    durationSeconds: lastSetInput?.durationSeconds ?? null,
  }
}

function setInputFromFields(fields: FieldConfig[], input: InputState) {
  const setInput: SetEntryInput = {}

  for (const field of fields) {
    setInput[field.key] = input[field.key]
  }

  return setInput
}

export function TrainingScreen() {
  const { workoutExerciseId } = useParams({
    from: "/training/$workoutExerciseId",
  })
  const navigate = useNavigate()
  const refreshVersion = useAppStore((state) => state.refreshVersion)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const setSelectedDate = useAppStore((state) => state.setSelectedDate)
  const [detail, setDetail] = useState<TrainingDetail | undefined>()
  const [input, setInput] = useState<InputState>(defaultInput)
  const [loadedWorkoutExerciseId, setLoadedWorkoutExerciseId] = useState<
    string | undefined
  >()
  const [selectedSetId, setSelectedSetId] = useState<string | undefined>()
  const [commentSetId, setCommentSetId] = useState<string | undefined>()
  const [message] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false

    getWorkoutExerciseDetail(workoutExerciseId).then((nextDetail) => {
      if (cancelled) {
        return
      }

      setDetail(nextDetail)

      if (nextDetail) {
        setSelectedDate(nextDetail.workout.localDate)

        if (nextDetail.workoutExercise.id !== loadedWorkoutExerciseId) {
          setInput(inputFromExerciseSetDefaults(nextDetail.exercise.lastSetInput))
          setSelectedSetId(undefined)
          setLoadedWorkoutExerciseId(nextDetail.workoutExercise.id)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [loadedWorkoutExerciseId, workoutExerciseId, refreshVersion, setSelectedDate])

  const fields = setFieldsForExerciseType(
    detail?.exercise.exerciseType ?? "strength",
  ).map((field) => ({
    ...field,
    step: getSetIncrement(detail?.exercise.setIncrements, field.key),
  }))
  const selectedSet = detail?.sets.find((set) => set.id === selectedSetId)
  const commentSet = detail?.sets.find((set) => set.id === commentSetId)

  const refreshDetail = async () => {
    const nextDetail = await getWorkoutExerciseDetail(workoutExerciseId)
    setDetail(nextDetail)
    bumpRefresh()
  }

  const clearSelection = () => {
    setSelectedSetId(undefined)
  }

  const saveSet = async () => {
    if (!detail) {
      return
    }

    const setInput = setInputFromFields(fields, input)

    if (selectedSet) {
      await updateSet(selectedSet.id, setInput)
    } else {
      await addSetToWorkoutExercise(detail.workoutExercise.id, setInput)
    }

    await updateExerciseSetDefaults(detail.exercise.id, setInput)
    clearSelection()
    await refreshDetail()
  }

  const deleteSetRow = async (setId: string) => {
    await deleteSet(setId)
    if (setId === selectedSetId) {
      clearSelection()
    }
    await refreshDetail()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!detail || event.active.id === event.over?.id || !event.over) {
      return
    }

    const oldIndex = detail.sets.findIndex((set) => set.id === event.active.id)
    const newIndex = detail.sets.findIndex((set) => set.id === event.over?.id)

    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const reorderedSets = arrayMove(detail.sets, oldIndex, newIndex)
    setDetail({ ...detail, sets: reorderedSets })
    await reorderSets(
      detail.workoutExercise.id,
      reorderedSets.map((set) => set.id),
    )
    bumpRefresh()
  }

  if (!detail) {
    return (
      <ScreenContainer className="justify-center text-center text-sm text-zinc-400">
        Exercise not found.
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer className="gap-4">
      <div className="pt-3">
        <div className="grid grid-cols-[minmax(0,1fr)_4rem] items-start gap-2">
          <button
            className="min-w-0 text-left text-[17px] font-semibold text-zinc-50"
            type="button"
            onClick={() =>
              void navigate({
                to: "/day/$date",
                params: { date: detail.workout.localDate },
              })
            }
          >
            <span className="block truncate">{detail.exercise.name}</span>
          </button>
          <WorkoutActiveTimer
            className="justify-self-end pt-1"
            workout={detail.workout}
          />
        </div>
        <div className="mt-2 h-px bg-cyan-300/50" />
      </div>

      <div className="space-y-4 py-2">
        {fields.map((field) => (
          <NumericStepper
            isDuration={field.isDuration}
            key={field.key}
            label={field.label}
            step={field.step}
            value={input[field.key]}
            onChange={(value) =>
              setInput((current) => ({ ...current, [field.key]: value }))
            }
          />
        ))}
      </div>

      <div className="flex">
        <ActionButton tone="save" onClick={saveSet}>
          {selectedSet ? "Update" : "Add"}
        </ActionButton>
      </div>

      {message && (
        <div className="rounded-md border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
          {message}
        </div>
      )}

      <section className="mt-1">
        <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-zinc-500">
          Set list
        </div>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={detail.sets.map((set) => set.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="overflow-hidden rounded-md border border-white/10 bg-[var(--app-surface)]">
              {detail.sets.length === 0 ? (
                <div className="flex min-h-12 items-center justify-center px-3 text-center text-sm text-zinc-500">
                  No sets added
                </div>
              ) : (
                detail.sets.map((set, index) => (
                  <SetRow
                    exerciseType={detail.exercise.exerciseType}
                    index={index}
                    key={set.id}
                    selected={set.id === selectedSetId}
                    set={set}
                    onComment={() => setCommentSetId(set.id)}
                    onDelete={() => void deleteSetRow(set.id)}
                    onSelect={() => {
                      if (set.id === selectedSetId) {
                        setSelectedSetId(undefined)
                        return
                      }

                      setSelectedSetId(set.id)
                      setInput(inputFromSet(set))
                    }}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <SetCommentDialog
        open={Boolean(commentSet)}
        set={commentSet}
        onOpenChange={(open) => {
          if (!open) {
            setCommentSetId(undefined)
          }
        }}
        onSaved={refreshDetail}
      />
    </ScreenContainer>
  )
}
