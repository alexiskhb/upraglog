import { useEffect, useMemo, useRef, useState } from "react"
import Fuse from "fuse.js"
import { useNavigate } from "@tanstack/react-router"
import {
  MoreVertical,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react"
import type {
  Exercise,
  ExerciseCategory,
  ExerciseUsageStats,
} from "@/db/schema"
import {
  deleteExercise,
  getAllExercises,
  getExerciseUsageStats,
  toggleExerciseFavorite,
} from "@/db/repositories/exercisesRepo"
import {
  addExerciseToDate,
  replaceWorkoutExercise,
} from "@/db/repositories/workoutsRepo"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { IconButton } from "@/shared/ui/IconButton"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { useAppStore } from "@/shared/store/appStore"
import {
  exerciseCategories,
  formatExerciseCategory,
  formatExerciseType,
} from "@/shared/model/exercises"
import { formatShortDate } from "@/shared/model/dates"
import { cn } from "@/lib/utils"
import { ExerciseCategoryChips } from "./ExerciseCategoryChips"

type CategoryFilter = ExerciseCategory | "favorites"

function matchesTokens(exercise: Exercise, query: string) {
  const normalizedName = exercise.name.toLowerCase()
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  return tokens.every((token) => normalizedName.includes(token))
}

export function ExercisePickerScreen() {
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)
  const selectedDate = useAppStore((state) => state.selectedDate)
  const refreshVersion = useAppStore((state) => state.refreshVersion)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const replaceWorkoutExerciseId = useAppStore(
    (state) => state.replaceWorkoutExerciseId,
  )
  const setReplaceWorkoutExerciseId = useAppStore(
    (state) => state.setReplaceWorkoutExerciseId,
  )
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [stats, setStats] = useState<Record<string, ExerciseUsageStats>>({})
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<
    CategoryFilter | undefined
  >()
  const [pendingDelete, setPendingDelete] = useState<Exercise | undefined>()
  const [message, setMessage] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false

    Promise.all([getAllExercises(), getExerciseUsageStats()]).then(
      ([exerciseRows, usageStats]) => {
        if (!cancelled) {
          setExercises(exerciseRows)
          setStats(usageStats)
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [refreshVersion])

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const categories = useMemo<CategoryFilter[]>(() => {
    const hasFavorites = exercises.some((exercise) => exercise.isFavorite)
    return hasFavorites
      ? ["favorites", ...exerciseCategories]
      : [...exerciseCategories]
  }, [exercises])

  const filteredExercises = useMemo(() => {
    const categoryFiltered = exercises.filter((exercise) => {
      if (!categoryFilter) {
        return true
      }

      if (categoryFilter === "favorites") {
        return exercise.isFavorite
      }

      return exercise.category === categoryFilter
    })

    if (!query.trim()) {
      return categoryFiltered
    }

    const fuse = new Fuse(categoryFiltered, {
      keys: ["name"],
      threshold: 0.45,
      ignoreLocation: true,
      minMatchCharLength: 2,
    })
    const fuseResults = fuse.search(query).map((result) => result.item)
    const tokenResults = categoryFiltered.filter((exercise) =>
      matchesTokens(exercise, query),
    )
    const unique = new Map<string, Exercise>()

    for (const exercise of [...tokenResults, ...fuseResults]) {
      unique.set(exercise.id, exercise)
    }

    return [...unique.values()]
  }, [categoryFilter, exercises, query])

  const selectExercise = async (exercise: Exercise) => {
    if (replaceWorkoutExerciseId) {
      await replaceWorkoutExercise(replaceWorkoutExerciseId, exercise.id)
      setReplaceWorkoutExerciseId(undefined)
      bumpRefresh()
      void navigate({
        to: "/training/$workoutExerciseId",
        params: { workoutExerciseId: replaceWorkoutExerciseId },
      })
      return
    }

    const workoutExercise = await addExerciseToDate(selectedDate, exercise.id)
    bumpRefresh()
    void navigate({
      to: "/training/$workoutExerciseId",
      params: { workoutExerciseId: workoutExercise.id },
    })
  }

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return
    }

    try {
      await deleteExercise(pendingDelete.id)
      setMessage("Exercise deleted.")
      bumpRefresh()
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Exercise could not be deleted.",
      )
    } finally {
      setPendingDelete(undefined)
    }
  }

  return (
    <ScreenContainer className="gap-3">
      <div className="flex items-center gap-2 pt-2">
        <Input
          className="h-11 rounded-sm border-cyan-500/40 bg-[#11151a] text-base text-zinc-100 placeholder:text-zinc-600 focus-visible:border-cyan-400 focus-visible:ring-cyan-500/30"
          placeholder="Search exercises"
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <IconButton
          className="bg-cyan-600 text-white hover:bg-cyan-500"
          title="Create exercise"
          onClick={() => void navigate({ to: "/exercise/new" })}
        >
          <Plus className="size-5" />
        </IconButton>
      </div>

      <ExerciseCategoryChips
        activeCategory={categoryFilter}
        categories={categories}
        onChange={setCategoryFilter}
      />

      <div className="flex items-center justify-between px-1 text-xs uppercase tracking-normal text-zinc-500">
        <span>
          {replaceWorkoutExerciseId
            ? "Choose replacement"
            : `Add to ${formatShortDate(selectedDate)}`}
        </span>
        {categoryFilter && (
          <button
            className="text-cyan-300"
            type="button"
            onClick={() => setCategoryFilter(undefined)}
          >
            Clear filter
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-sm border border-cyan-500/25 bg-cyan-950/20 px-3 py-2 text-sm text-cyan-100">
          {message}
        </div>
      )}

      <div className="space-y-2">
        {filteredExercises.length === 0 ? (
          <div className="rounded-sm bg-[#11151a] px-3 py-8 text-center text-sm text-zinc-500">
            No exercises found
          </div>
        ) : (
          filteredExercises.map((exercise) => {
            const usage = stats[exercise.id]

            return (
              <div
                className="grid grid-cols-[1fr_3rem_3rem] items-center rounded-sm bg-[#15191e] text-left"
                key={exercise.id}
              >
                <button
                  className="min-w-0 px-3 py-3 text-left"
                  type="button"
                  onClick={() => void selectExercise(exercise)}
                >
                  <div className="truncate text-[15px] font-medium text-zinc-50">
                    {exercise.name}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
                    <span>{formatExerciseCategory(exercise.category)}</span>
                    <span>{formatExerciseType(exercise.exerciseType)}</span>
                    {usage?.workoutCount ? (
                      <span>
                        {usage.workoutCount} workouts
                        {usage.lastUsedDate
                          ? `, last ${usage.lastUsedDate}`
                          : ""}
                      </span>
                    ) : null}
                  </div>
                </button>
                <button
                  className={cn(
                    "mx-auto inline-flex size-10 items-center justify-center rounded-sm text-zinc-500 hover:bg-zinc-800",
                    exercise.isFavorite && "text-cyan-300",
                  )}
                  type="button"
                  title={
                    exercise.isFavorite ? "Unfavorite exercise" : "Favorite exercise"
                  }
                  onClick={async () => {
                    await toggleExerciseFavorite(exercise)
                    bumpRefresh()
                  }}
                >
                  <Star
                    className="size-5"
                    fill={exercise.isFavorite ? "currentColor" : "none"}
                  />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="mx-auto inline-flex size-10 items-center justify-center rounded-sm text-zinc-400 hover:bg-zinc-800"
                      type="button"
                      title="Exercise actions"
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
                      onSelect={() =>
                        void navigate({
                          to: "/exercise/$exerciseId/edit",
                          params: { exerciseId: exercise.id },
                        })
                      }
                    >
                      <Pencil className="size-4 text-cyan-300" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                      className="gap-2 text-red-300 focus:bg-red-500/10 focus:text-red-200"
                      onSelect={() => setPendingDelete(exercise)}
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          })
        )}
      </div>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(undefined)
          }
        }}
      >
        <AlertDialogContent className="rounded-sm border-zinc-800 bg-[#15191e] text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exercise?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This only works for exercises with no workout history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-zinc-800 bg-[#11151a]">
            <AlertDialogCancel className="rounded-sm border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-sm bg-red-700 text-white hover:bg-red-600"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenContainer>
  )
}
