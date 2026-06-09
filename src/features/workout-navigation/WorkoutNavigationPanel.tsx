import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MoreVertical, Plus, Repeat2, Trash2 } from "lucide-react"
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
    <div
      className="grid min-h-14 grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 border-b border-zinc-800 bg-[#15191e] px-2"
      ref={setNodeRef}
      style={style}
    >
      <button
        className="inline-flex size-9 items-center justify-center rounded-sm text-zinc-500 hover:bg-zinc-800"
        type="button"
        title="Drag exercise"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <button className="min-w-0 text-left" type="button" onClick={onOpen}>
        <div className="truncate text-sm font-medium text-zinc-50">
          {detail.exercise.name}
        </div>
        <div className="text-xs text-zinc-500">
          {detail.sets.length} {detail.sets.length === 1 ? "set" : "sets"}
        </div>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex size-9 items-center justify-center rounded-sm text-zinc-400 hover:bg-zinc-800"
            type="button"
            title="Workout exercise actions"
          >
            <MoreVertical className="size-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44 border-zinc-800 bg-[#171a1f] text-zinc-100"
        >
          <DropdownMenuItem
            className="gap-2 focus:bg-cyan-500/15"
            onSelect={onReplace}
          >
            <Repeat2 className="size-4 text-cyan-300" />
            Replace
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-zinc-800" />
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
  )
}

export function WorkoutNavigationPanel() {
  const navigate = useNavigate()
  const selectedDate = useAppStore((state) => state.selectedDate)
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

  useEffect(() => {
    if (!open) {
      return
    }

    let cancelled = false

    getWorkoutDetailByDate(selectedDate).then((workoutDetail) => {
      if (!cancelled) {
        setDetail(workoutDetail)
      }
    })

    return () => {
      cancelled = true
    }
  }, [open, selectedDate, refreshVersion])

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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        className="max-h-[86dvh] rounded-t-sm border-cyan-500/25 bg-[#111418] text-zinc-100 sm:mx-auto sm:max-w-2xl"
        side="bottom"
      >
        <SheetHeader className="border-b border-cyan-500/40">
          <SheetTitle>Workout List</SheetTitle>
          <SheetDescription className="text-zinc-500">
            {selectedDate}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          {detail.exercises.length === 0 ? (
            <div className="rounded-sm bg-[#15191e] px-3 py-8 text-center text-sm text-zinc-500">
              No exercises in this workout
            </div>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={detail.exercises.map(
                  (entry) => entry.workoutExercise.id,
                )}
                strategy={verticalListSortingStrategy}
              >
                <div className="overflow-hidden rounded-sm">
                  {detail.exercises.map((entry) => (
                    <WorkoutNavRow
                      detail={entry}
                      key={entry.workoutExercise.id}
                      onDelete={async () => {
                        await deleteWorkoutExercise(entry.workoutExercise.id)
                        bumpRefresh()
                      }}
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

        <SheetFooter className="border-t border-zinc-800">
          <div className="flex gap-2">
            <ActionButton
              tone="save"
              onClick={() => {
                setOpen(false)
                void navigate({ to: "/picker" })
              }}
            >
              <Plus className="mr-1 inline size-4" />
              Add Exercise
            </ActionButton>
            <ActionButton
              tone="secondary"
              onClick={() => {
                setOpen(false)
                void navigate({
                  to: "/day/$date",
                  params: { date: selectedDate },
                })
              }}
            >
              Close
            </ActionButton>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
