import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { MoreVertical, Plus, Repeat2, Trash2 } from "lucide-react"
import type { WorkoutDayDetail, WorkoutExerciseDetail } from "@/db/schema"
import {
  deleteWorkoutExercise,
  getWorkoutDetailByDate,
  reorderWorkoutExercises,
} from "@/db/repositories/workoutsRepo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useAppStore } from "@/shared/store/appStore"
import { ActionButton } from "@/shared/ui/ActionButton"
import { SwipeToDelete } from "@/shared/ui/SwipeToDelete"

function WorkoutNavRow({
  detail,
  onOpen,
  onDelete,
  onReplace,
}: {
  detail: WorkoutExerciseDetail
  onOpen: () => void
  onDelete: () => void
  onReplace: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: detail.workoutExercise.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <SwipeToDelete
      className="border-b border-white/10"
      ref={setNodeRef}
      style={style}
      onDelete={onDelete}
    >
      <div className="grid min-h-14 grid-cols-[1fr_2.5rem] items-center gap-2 bg-[var(--app-surface)] px-2 transition hover:bg-[#1b2026]">
        <button
          className="min-w-0 text-left"
          style={{ touchAction: "none" }}
          type="button"
          title="Long press to move exercise"
          onClick={onOpen}
          {...attributes}
          {...listeners}
        >
          <div className="truncate text-sm font-medium text-zinc-50">
            {detail.exercise.id}
          </div>
          <div className="text-xs text-zinc-500">
            {detail.sets.length} {detail.sets.length === 1 ? "set" : "sets"}
          </div>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-zinc-400 hover:bg-white/10"
              type="button"
              title="Workout exercise actions"
            >
              <MoreVertical className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 rounded-md border-white/10 bg-[#1a1d22] text-zinc-100 shadow-xl"
          >
            <DropdownMenuItem
              className="gap-2 rounded-md focus:bg-cyan-400/15"
              onSelect={onReplace}
            >
              <Repeat2 className="size-4 text-cyan-300" />
              Replace
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="gap-2 text-red-300 focus:bg-red-500/10 focus:text-red-200"
              onSelect={onDelete}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </SwipeToDelete>
  )
}

export function WorkoutNavigationPanel() {
  const navigate = useNavigate()
  const selectedDate = useAppStore((state) => state.selectedDate)
  const selectedProfile = useAppStore((state) => state.selectedProfile)
  const open = useAppStore((state) => state.workoutNavOpen)
  const setOpen = useAppStore((state) => state.setWorkoutNavOpen)
  const refreshVersion = useAppStore((state) => state.refreshVersion)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const setReplaceWorkoutExerciseId = useAppStore(
    (state) => state.setReplaceWorkoutExerciseId,
  )
  const [detail, setDetail] = useState<WorkoutDayDetail>({
    workout: undefined,
    exercises: [],
  })
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

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false

    getWorkoutDetailByDate(selectedDate, selectedProfile).then((workoutDetail) => {
      if (!cancelled) {
        setDetail(workoutDetail)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, selectedDate, selectedProfile, refreshVersion])

  const handleDragEnd = async (event: DragEndEvent) => {
    if (
      !detail.workout ||
      event.active.id === event.over?.id ||
      !event.over
    ) {
      return
    }

    const oldIndex = detail.exercises.findIndex(
      (entry) => entry.workoutExercise.id === event.active.id,
    )
    const newIndex = detail.exercises.findIndex(
      (entry) => entry.workoutExercise.id === event.over?.id,
    )

    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const reorderedExercises = arrayMove(detail.exercises, oldIndex, newIndex)
    setDetail({ ...detail, exercises: reorderedExercises })
    await reorderWorkoutExercises(
      detail.workout.id,
      reorderedExercises.map((entry) => entry.workoutExercise.id),
    )
    bumpRefresh()
  }

  const deleteWorkoutExerciseRow = async (workoutExerciseId: string) => {
    await deleteWorkoutExercise(workoutExerciseId)
    setDetail((current) => ({
      ...current,
      exercises: current.exercises.filter(
        (entry) => entry.workoutExercise.id !== workoutExerciseId,
      ),
    }))
    bumpRefresh()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        className="max-h-[calc(86dvh-4rem)] rounded-t-md border-white/10 bg-[#111418] text-zinc-100 shadow-[0_-24px_60px_rgba(0,0,0,0.5)] data-[side=bottom]:bottom-16 sm:mx-auto sm:max-w-2xl"
        side="bottom"
      >
        <SheetHeader className="border-b border-white/10">
          <SheetTitle>Workout List</SheetTitle>
          <SheetDescription className="text-zinc-500">
            {selectedDate} · {selectedProfile}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          {detail.exercises.length === 0 ? (
            <div className="flex min-h-14 items-center justify-center rounded-md border border-white/10 bg-[var(--app-surface)] px-3 text-center text-sm text-zinc-500">
              No exercises in this workout
            </div>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              sensors={sensors}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={detail.exercises.map(
                  (entry) => entry.workoutExercise.id,
                )}
                strategy={verticalListSortingStrategy}
              >
                <div className="overflow-hidden rounded-md border border-white/10">
                  {detail.exercises.map((entry) => (
                    <WorkoutNavRow
                      detail={entry}
                      key={entry.workoutExercise.id}
                      onDelete={() =>
                        void deleteWorkoutExerciseRow(entry.workoutExercise.id)
                      }
                      onOpen={() => {
                        setOpen(false)
                        void navigate({
                          to: "/training/$workoutExerciseId",
                          params: {
                            workoutExerciseId: entry.workoutExercise.id,
                          },
                        })
                      }}
                      onReplace={() => {
                        setReplaceWorkoutExerciseId(entry.workoutExercise.id)
                        setOpen(false)
                        void navigate({ to: "/picker" })
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <SheetFooter className="border-t border-white/10">
          <div className="flex gap-2">
            <ActionButton
              tone="save"
              onClick={() => {
                setReplaceWorkoutExerciseId(undefined)
                setOpen(false)
                void navigate({ to: "/picker" })
              }}
            >
              <Plus className="mr-1 inline size-4" />
              Add Exercise
            </ActionButton>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
