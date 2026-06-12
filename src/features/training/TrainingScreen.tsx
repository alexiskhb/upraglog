import { useEffect, useRef, useState, type PointerEvent } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
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
  updateSetFinished,
} from "@/db/repositories/workoutsRepo"
import { getSettings } from "@/db/repositories/settingsRepo"
import { useAppStore } from "@/shared/store/appStore"
import {
  getSetIncrement,
  setFieldsForExerciseType,
} from "@/shared/model/setFields"
import { defaultAppSettings } from "@/shared/model/settings"
import { getWorkoutProgress } from "@/shared/model/workoutProgress"
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

type ExerciseDirection = -1 | 1

const horizontalSwipeIntentPx = 18
const horizontalSwipeCommitPx = 72

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

function isTrainingSwipeBlocked(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "button,input,textarea,select,a,[role='button'],[data-training-swipe-block='true']",
      ),
    )
  )
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
  const [loadedInputKey, setLoadedInputKey] = useState<string | undefined>()
  const [selectedSetId, setSelectedSetId] = useState<string | undefined>()
  const [commentSetId, setCommentSetId] = useState<string | undefined>()
  const [
    treatLongTimerAsLatestSetFinish,
    setTreatLongTimerAsLatestSetFinish,
  ] = useState(defaultAppSettings.treatLongWorkoutTimerAsLatestSetFinish)
  const [
    autoSortWorkoutExercisesByFirstFinishedSet,
    setAutoSortWorkoutExercisesByFirstFinishedSet,
  ] = useState(defaultAppSettings.autoSortWorkoutExercisesByFirstFinishedSet)
  const [
    autoFinishWorkoutTimerWhenAllSetsFinished,
    setAutoFinishWorkoutTimerWhenAllSetsFinished,
  ] = useState(defaultAppSettings.autoFinishWorkoutTimerWhenAllSetsFinished)
  const [message] = useState<string | undefined>()
  const exerciseSwipeStartRef = useRef<
    | {
        x: number
        y: number
        pointerId: number
        swiping: boolean
      }
    | undefined
  >(undefined)

  useEffect(() => {
    let cancelled = false

    Promise.all([
      getWorkoutExerciseDetail(workoutExerciseId),
      getSettings(),
    ]).then(([nextDetail, appSettings]) => {
      if (cancelled) {
        return
      }

      setDetail(nextDetail)
      setTreatLongTimerAsLatestSetFinish(
        appSettings.treatLongWorkoutTimerAsLatestSetFinish,
      )
      setAutoSortWorkoutExercisesByFirstFinishedSet(
        appSettings.autoSortWorkoutExercisesByFirstFinishedSet,
      )
      setAutoFinishWorkoutTimerWhenAllSetsFinished(
        appSettings.autoFinishWorkoutTimerWhenAllSetsFinished,
      )

      if (nextDetail) {
        setSelectedDate(nextDetail.workout.localDate)

        const inputKey = [
          nextDetail.workoutExercise.id,
          nextDetail.exercise.id,
          nextDetail.exercise.exerciseType,
        ].join(":")

        if (inputKey !== loadedInputKey) {
          setInput(inputFromExerciseSetDefaults(nextDetail.exercise.lastSetInput))
          setSelectedSetId(undefined)
          setLoadedInputKey(inputKey)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [loadedInputKey, workoutExerciseId, refreshVersion, setSelectedDate])

  const fields = setFieldsForExerciseType(
    detail?.exercise.exerciseType ?? "strength",
  ).map((field) => ({
    ...field,
    step: getSetIncrement(detail?.exercise.setIncrements, field.key),
  }))
  const selectedSet = detail?.sets.find((set) => set.id === selectedSetId)
  const commentSet = detail?.sets.find((set) => set.id === commentSetId)
  const workoutProgress = getWorkoutProgress(detail?.workoutSets ?? [])
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 350,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const refreshDetail = async () => {
    const nextDetail = await getWorkoutExerciseDetail(workoutExerciseId)
    setDetail(nextDetail)
    bumpRefresh()
  }

  const clearSelection = () => {
    setSelectedSetId(undefined)
  }

  const resolveAdjacentWorkoutExerciseId = (direction: ExerciseDirection) => {
    if (!detail) {
      return undefined
    }

    const currentIndex = detail.workoutExerciseIds.indexOf(
      detail.workoutExercise.id,
    )

    if (currentIndex < 0) {
      return undefined
    }

    return detail.workoutExerciseIds[currentIndex + direction]
  }

  const navigateAdjacentExercise = (direction: ExerciseDirection) => {
    const nextWorkoutExerciseId = resolveAdjacentWorkoutExerciseId(direction)

    if (!nextWorkoutExerciseId) {
      return
    }

    void navigate({
      to: "/training/$workoutExerciseId",
      params: { workoutExerciseId: nextWorkoutExerciseId },
    })
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

  const updateSetFinishedRow = async (setId: string, finished: boolean) => {
    await updateSetFinished(setId, finished, {
      autoSortWorkoutExercises: autoSortWorkoutExercisesByFirstFinishedSet,
      autoFinishWorkoutTimer: autoFinishWorkoutTimerWhenAllSetsFinished,
    })
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

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (
      event.button !== 0 ||
      event.pointerType === "mouse" ||
      isTrainingSwipeBlocked(event.target)
    ) {
      return
    }

    exerciseSwipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      swiping: false,
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const swipeStart = exerciseSwipeStartRef.current

    if (!swipeStart || swipeStart.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - swipeStart.x
    const deltaY = event.clientY - swipeStart.y

    if (
      !swipeStart.swiping &&
      Math.abs(deltaY) > 10 &&
      Math.abs(deltaY) > Math.abs(deltaX)
    ) {
      exerciseSwipeStartRef.current = undefined
      return
    }

    if (
      !swipeStart.swiping &&
      (Math.abs(deltaX) < horizontalSwipeIntentPx ||
        Math.abs(deltaX) < Math.abs(deltaY) * 1.35)
    ) {
      return
    }

    swipeStart.swiping = true
    event.preventDefault()
  }

  const handlePointerEnd = (event: PointerEvent<HTMLElement>) => {
    const swipeStart = exerciseSwipeStartRef.current
    exerciseSwipeStartRef.current = undefined

    if (!swipeStart || swipeStart.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - swipeStart.x
    const deltaY = event.clientY - swipeStart.y

    if (
      swipeStart.swiping &&
      Math.abs(deltaX) >= horizontalSwipeCommitPx &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.35
    ) {
      navigateAdjacentExercise(deltaX > 0 ? -1 : 1)
    }
  }

  const handlePointerCancel = () => {
    exerciseSwipeStartRef.current = undefined
  }

  if (!detail) {
    return (
      <ScreenContainer className="justify-center text-center text-sm text-zinc-400">
        Exercise not found.
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer
      className="gap-4"
      style={{ touchAction: "pan-y" }}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
    >
      <div className="pt-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
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
            <span className="block truncate">{detail.exercise.id}</span>
          </button>
          <WorkoutActiveTimer
            className="justify-self-end"
            sets={detail.workoutSets}
            size="large"
            treatLongTimerAsLatestSetFinish={treatLongTimerAsLatestSetFinish}
            workout={detail.workout}
          />
        </div>
        <div
          aria-label={`${workoutProgress.finishedSets} of ${workoutProgress.totalSets} workout sets finished`}
          aria-valuemax={Math.max(workoutProgress.totalSets, 1)}
          aria-valuemin={0}
          aria-valuenow={workoutProgress.finishedSets}
          className="-mx-4 mt-3 h-1 overflow-hidden bg-white/10 sm:-mx-5"
          role="progressbar"
          title={`${workoutProgress.finishedSets} of ${workoutProgress.totalSets} workout sets finished`}
        >
          <div
            className="h-full bg-cyan-400 transition-[width] duration-200"
            style={{ width: `${workoutProgress.percentComplete}%` }}
          />
        </div>
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

      <section className="mt-1" data-training-swipe-block="true">
        <div className="mb-2 text-xs font-semibold uppercase tracking-normal text-zinc-500">
          Set list
        </div>
        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragEnd={handleDragEnd}
        >
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
                    onFinishedChange={(finished) =>
                      void updateSetFinishedRow(set.id, finished)
                    }
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
