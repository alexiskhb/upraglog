import { useEffect, useMemo, useState } from "react"
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
  AppSettings,
  ExerciseType,
  SetEntry,
  SetEntryInput,
} from "@/db/schema"
import {
  addSetToWorkoutExercise,
  deleteSet,
  getWorkoutExerciseDetail,
  reorderSets,
  updateSet,
} from "@/db/repositories/workoutsRepo"
import { getSettings } from "@/db/repositories/settingsRepo"
import { useAppStore } from "@/shared/store/appStore"
import { weightUnit, distanceUnit } from "@/shared/model/units"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { ActionButton } from "@/shared/ui/ActionButton"
import { NumericStepper } from "./NumericStepper"
import { SetRow } from "./SetRow"
import { SetCommentDialog } from "./SetCommentDialog"

type TrainingDetail = NonNullable<
  Awaited<ReturnType<typeof getWorkoutExerciseDetail>>
>

type FieldKey = "weight" | "reps" | "distance" | "durationSeconds"
type InputState = Record<FieldKey, number>

const defaultInput: InputState = {
  weight: 0,
  reps: 5,
  distance: 0,
  durationSeconds: 300,
}

type FieldConfig = {
  key: FieldKey
  label: string
  step: number
  unit?: string
  isDuration?: boolean
}

function fieldsForExerciseType(
  exerciseType: ExerciseType,
  settings: AppSettings,
): FieldConfig[] {
  const weightField: FieldConfig = {
    key: "weight",
    label: "Weight",
    step: settings.unitSystem === "metric" ? 2.5 : 5,
    unit: weightUnit(settings.unitSystem),
  }
  const repsField: FieldConfig = {
    key: "reps",
    label: "Reps",
    step: 1,
  }
  const distanceField: FieldConfig = {
    key: "distance",
    label: "Distance",
    step: 0.1,
    unit: distanceUnit(settings.unitSystem),
  }
  const durationField: FieldConfig = {
    key: "durationSeconds",
    label: "Time",
    step: 30,
    isDuration: true,
  }

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

function inputFromSet(set: SetEntry): InputState {
  return {
    weight: set.weight ?? defaultInput.weight,
    reps: set.reps ?? defaultInput.reps,
    distance: set.distance ?? defaultInput.distance,
    durationSeconds: set.durationSeconds ?? defaultInput.durationSeconds,
  }
}

function setInputFromFields(fields: FieldConfig[], input: InputState) {
  const setInput: SetEntryInput = {}

  for (const field of fields) {
    setInput[field.key] = input[field.key]
  }

  return setInput
}

function useScreenWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    type WakeLockSentinel = {
      release: () => Promise<void>
    }
    type WakeLockNavigator = Navigator & {
      wakeLock?: {
        request: (type: "screen") => Promise<WakeLockSentinel>
      }
    }

    let sentinel: WakeLockSentinel | undefined
    const wakeLockNavigator = navigator as WakeLockNavigator

    wakeLockNavigator.wakeLock
      ?.request("screen")
      .then((lock) => {
        sentinel = lock
      })
      .catch(() => undefined)

    return () => {
      void sentinel?.release()
    }
  }, [enabled])
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
  const [settings, setSettings] = useState<AppSettings>({
    unitSystem: "metric",
    keepScreenOnDuringTraining: true,
  })
  const [input, setInput] = useState<InputState>(defaultInput)
  const [selectedSetId, setSelectedSetId] = useState<string | undefined>()
  const [commentSetId, setCommentSetId] = useState<string | undefined>()
  const [message, setMessage] = useState<string | undefined>()

  useScreenWakeLock(settings.keepScreenOnDuringTraining)

  useEffect(() => {
    let cancelled = false

    Promise.all([getWorkoutExerciseDetail(workoutExerciseId), getSettings()]).then(
      ([nextDetail, appSettings]) => {
        if (cancelled) {
          return
        }

        setDetail(nextDetail)
        setSettings(appSettings)

        if (nextDetail) {
          setSelectedDate(nextDetail.workout.localDate)
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [workoutExerciseId, refreshVersion, setSelectedDate])

  const fields = useMemo(
    () =>
      fieldsForExerciseType(
        detail?.exercise.exerciseType ?? "strength",
        settings,
      ),
    [detail?.exercise.exerciseType, settings],
  )
  const selectedSet = detail?.sets.find((set) => set.id === selectedSetId)
  const commentSet = detail?.sets.find((set) => set.id === commentSetId)

  const refreshDetail = async () => {
    const nextDetail = await getWorkoutExerciseDetail(workoutExerciseId)
    setDetail(nextDetail)
    bumpRefresh()
  }

  const clearForm = () => {
    setInput(defaultInput)
    setSelectedSetId(undefined)
  }

  const saveSet = async () => {
    if (!detail) {
      return
    }

    const setInput = setInputFromFields(fields, input)

    if (selectedSet) {
      await updateSet(selectedSet.id, setInput)
      setMessage("Set updated.")
    } else {
      await addSetToWorkoutExercise(detail.workoutExercise.id, setInput)
      setMessage("Set saved.")
    }

    clearForm()
    await refreshDetail()
  }

  const deleteSelectedSet = async () => {
    if (!selectedSet) {
      clearForm()
      return
    }

    await deleteSet(selectedSet.id)
    setMessage("Set deleted.")
    clearForm()
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
        <button
          className="text-left text-[17px] font-semibold text-zinc-50"
          type="button"
          onClick={() =>
            void navigate({
              to: "/day/$date",
              params: { date: detail.workout.localDate },
            })
          }
        >
          {detail.exercise.name}
        </button>
        <div className="mt-2 h-px bg-cyan-300/50" />
      </div>

      <div className="space-y-4 py-2">
        {fields.map((field) => (
          <NumericStepper
            isDuration={field.isDuration}
            key={field.key}
            label={field.label}
            step={field.step}
            unit={field.unit}
            value={input[field.key]}
            onChange={(value) =>
              setInput((current) => ({ ...current, [field.key]: value }))
            }
          />
        ))}
      </div>

      <div className="flex gap-2">
        <ActionButton tone="save" onClick={saveSet}>
          {selectedSet ? "Update" : "Save"}
        </ActionButton>
        <ActionButton
          tone={selectedSet ? "delete" : "secondary"}
          onClick={deleteSelectedSet}
        >
          {selectedSet ? "Delete" : "Clear"}
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
                <div className="px-3 py-8 text-center text-sm text-zinc-500">
                  No sets recorded
                </div>
              ) : (
                detail.sets.map((set, index) => (
                  <SetRow
                    exerciseType={detail.exercise.exerciseType}
                    index={index}
                    key={set.id}
                    selected={set.id === selectedSetId}
                    set={set}
                    unitSystem={settings.unitSystem}
                    onComment={() => setCommentSetId(set.id)}
                    onSelect={() => {
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
