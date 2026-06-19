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
  startWorkoutTimer,
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
import { formatDuration } from "@/shared/model/dates"
import { getWorkoutProgress } from "@/shared/model/workoutProgress"
import { getLatestSetFinishedAtAfterWorkoutStart } from "@/shared/model/workoutTimer"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { ActionButton } from "@/shared/ui/ActionButton"
import { WorkoutActiveTimer } from "@/shared/ui/WorkoutActiveTimer"
import { workoutTimerClassName } from "@/shared/ui/workoutTimerStyles"
import { useHorizontalSwipeNavigation } from "@/shared/ui/useHorizontalSwipeNavigation"
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
const nextActionDoubleTapMs = 360
const nextActionMaxMovePx = 12
const nextActionMaxDistancePx = 36

type NextActionTap = {
  time: number
  x: number
  y: number
}

type NextActionTapStart = NextActionTap & {
  pointerId: number
}

function timestampMs(iso?: string) {
  if (!iso) {
    return undefined
  }

  const value = new Date(iso).getTime()
  return Number.isFinite(value) ? value : undefined
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

function isTrainingNextActionBlocked(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "button,input,textarea,select,a,[role='button'],[data-training-swipe-block='true'],[data-training-next-block='true']",
      ),
    )
  )
}

function getExerciseTransitionClass(direction: ExerciseDirection) {
  return direction > 0
    ? "swipe-route-enter-next"
    : "swipe-route-enter-previous"
}

function WorkoutLapTimer({
  detail,
  nowMs,
}: {
  detail: TrainingDetail
  nowMs: number
}) {
  if (!detail.workout.startedAt) {
    return null
  }

  const active = Boolean(detail.workout.startedAt && !detail.workout.endedAt)
  const latestFinishedAt = getLatestSetFinishedAtAfterWorkoutStart({
    workout: detail.workout,
    sets: detail.workoutSets,
  })
  const lapStartedMs =
    timestampMs(latestFinishedAt) ?? timestampMs(detail.workout.startedAt)
  const endedMs = timestampMs(detail.workout.endedAt)
  const displayEndMs = active || endedMs === undefined ? nowMs : endedMs
  const elapsedSeconds =
    lapStartedMs === undefined
      ? 0
      : Math.max(0, Math.floor((displayEndMs - lapStartedMs) / 1000))

  return (
    <div className="mt-1 flex justify-end">
      <div
        aria-label={`Lap timer ${formatDuration(elapsedSeconds)}`}
        className={workoutTimerClassName({
          active,
          className: active
            ? "cursor-default hover:bg-transparent hover:text-cyan-300"
            : "cursor-default hover:bg-transparent hover:text-teal-400",
          size: "large",
        })}
        title="Lap timer"
      >
        {formatDuration(elapsedSeconds)}
      </div>
    </div>
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
  const [loadedWorkoutExerciseId, setLoadedWorkoutExerciseId] = useState<
    string | undefined
  >()
  const [exerciseTransitionClass, setExerciseTransitionClass] = useState("")
  const [
    autoSortWorkoutExercisesByFirstFinishedSet,
    setAutoSortWorkoutExercisesByFirstFinishedSet,
  ] = useState(defaultAppSettings.autoSortWorkoutExercisesByFirstFinishedSet)
  const [
    autoFinishWorkoutTimerWhenAllSetsFinished,
    setAutoFinishWorkoutTimerWhenAllSetsFinished,
  ] = useState(defaultAppSettings.autoFinishWorkoutTimerWhenAllSetsFinished)
  const [message] = useState<string | undefined>()
  const [timerNowMs, setTimerNowMs] = useState(() => Date.now())
  const nextActionTapStartRef = useRef<NextActionTapStart | undefined>(
    undefined,
  )
  const previousNextActionTapRef = useRef<NextActionTap | undefined>(undefined)
  const nextActionBusyRef = useRef(false)
  const workoutTimerActive = Boolean(
    detail?.workout.startedAt && !detail.workout.endedAt,
  )

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
      setLoadedWorkoutExerciseId(workoutExerciseId)
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

  useEffect(() => {
    if (!workoutTimerActive) {
      return
    }

    const timeout = window.setTimeout(() => {
      setTimerNowMs(Date.now())
    }, 0)
    const interval = window.setInterval(() => {
      setTimerNowMs(Date.now())
    }, 1000)

    return () => {
      window.clearTimeout(timeout)
      window.clearInterval(interval)
    }
  }, [detail?.workout.startedAt, workoutTimerActive])

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

    setExerciseTransitionClass(getExerciseTransitionClass(direction))
    void navigate({
      to: "/training/$workoutExerciseId",
      params: { workoutExerciseId: nextWorkoutExerciseId },
    })
  }

  const navigateToNextExercise = () => {
    const nextWorkoutExerciseId = resolveAdjacentWorkoutExerciseId(1)

    if (!nextWorkoutExerciseId) {
      return false
    }

    setExerciseTransitionClass(getExerciseTransitionClass(1))
    void navigate({
      to: "/training/$workoutExerciseId",
      params: { workoutExerciseId: nextWorkoutExerciseId },
    })
    return true
  }

  const exerciseSwipeNavigation = useHorizontalSwipeNavigation({
    canNavigate: (direction) =>
      Boolean(resolveAdjacentWorkoutExerciseId(direction)),
    commitPx: horizontalSwipeCommitPx,
    intentPx: horizontalSwipeIntentPx,
    onNavigate: navigateAdjacentExercise,
    shouldStart: (target) => !isTrainingSwipeBlocked(target),
  })

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

  const runNextAction = async () => {
    if (!detail || nextActionBusyRef.current) {
      return
    }

    nextActionBusyRef.current = true

    try {
      if (!detail.workout.startedAt) {
        await startWorkoutTimer(
          detail.workout.localDate,
          detail.workout.profileName,
        )
        setTimerNowMs(Date.now())
        await refreshDetail()
        return
      }

      const nextUnfinishedSet = detail.sets.find((set) => !set.finishedAt)

      if (!nextUnfinishedSet) {
        navigateToNextExercise()
        return
      }

      const exerciseWillBeFinished = detail.sets.every(
        (set) => set.finishedAt || set.id === nextUnfinishedSet.id,
      )

      await updateSetFinished(nextUnfinishedSet.id, true, {
        autoSortWorkoutExercises: autoSortWorkoutExercisesByFirstFinishedSet,
        autoFinishWorkoutTimer: autoFinishWorkoutTimerWhenAllSetsFinished,
      })

      if (exerciseWillBeFinished) {
        bumpRefresh()

        if (navigateToNextExercise()) {
          return
        }
      }

      await refreshDetail()
    } finally {
      nextActionBusyRef.current = false
    }
  }

  const handleNextActionPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || isTrainingNextActionBlocked(event.target)) {
      nextActionTapStartRef.current = undefined
      previousNextActionTapRef.current = undefined
      return
    }

    nextActionTapStartRef.current = {
      pointerId: event.pointerId,
      time: window.performance.now(),
      x: event.clientX,
      y: event.clientY,
    }
  }

  const handleNextActionPointerUp = (event: PointerEvent<HTMLElement>) => {
    const tapStart = nextActionTapStartRef.current
    nextActionTapStartRef.current = undefined

    if (
      !tapStart ||
      tapStart.pointerId !== event.pointerId ||
      isTrainingNextActionBlocked(event.target)
    ) {
      return
    }

    const distanceMoved = Math.hypot(
      event.clientX - tapStart.x,
      event.clientY - tapStart.y,
    )

    if (distanceMoved > nextActionMaxMovePx) {
      previousNextActionTapRef.current = undefined
      return
    }

    const previousTap = previousNextActionTapRef.current
    const currentTap = {
      time: window.performance.now(),
      x: event.clientX,
      y: event.clientY,
    }

    if (
      previousTap &&
      currentTap.time - previousTap.time <= nextActionDoubleTapMs &&
      Math.hypot(currentTap.x - previousTap.x, currentTap.y - previousTap.y) <=
        nextActionMaxDistancePx
    ) {
      previousNextActionTapRef.current = undefined
      event.preventDefault()
      event.stopPropagation()
      void runNextAction()
      return
    }

    previousNextActionTapRef.current = currentTap
  }

  const handleNextActionPointerCancel = () => {
    nextActionTapStartRef.current = undefined
    previousNextActionTapRef.current = undefined
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

  if (loadedWorkoutExerciseId !== workoutExerciseId) {
    return (
      <ScreenContainer className="justify-center text-center text-sm text-zinc-400">
        Loading exercise...
      </ScreenContainer>
    )
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
      className={`gap-4 ${exerciseTransitionClass}`}
      key={detail.workoutExercise.id}
      {...exerciseSwipeNavigation}
      onPointerCancel={() => {
        exerciseSwipeNavigation.onPointerCancel()
        handleNextActionPointerCancel()
      }}
      onPointerDown={(event) => {
        exerciseSwipeNavigation.onPointerDown(event)
        handleNextActionPointerDown(event)
      }}
      onPointerUp={(event) => {
        exerciseSwipeNavigation.onPointerUp(event)
        handleNextActionPointerUp(event)
      }}
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
            nowMs={timerNowMs}
            size="large"
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
        <WorkoutLapTimer detail={detail} nowMs={timerNowMs} />
      </div>

      <div className="space-y-4 py-2" data-training-next-block="true">
        {fields.map((field) => (
          <NumericStepper
            isDuration={field.isDuration}
            displayFractionDigits={field.key === "weight" ? 1 : undefined}
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
