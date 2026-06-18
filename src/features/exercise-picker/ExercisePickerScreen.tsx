import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  ArrowDownAZ,
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
  getExerciseCategories,
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { IconButton } from "@/shared/ui/IconButton"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { useAppStore } from "@/shared/store/appStore"
import {
  defaultExerciseCategories,
  formatExerciseCategory,
  formatExerciseType,
} from "@/shared/model/exercises"
import { formatShortDate } from "@/shared/model/dates"
import { cn } from "@/lib/utils"
import { ExerciseCategoryChips } from "./ExerciseCategoryChips"

type CategoryFilter = ExerciseCategory | "favorites"
type ExerciseSortOption = "name" | "frequency" | "recency"

const exerciseSortLabels: Record<ExerciseSortOption, string> = {
  name: "Name",
  frequency: "Frequency",
  recency: "Recency",
}

function queryTokens(query: string) {
  return [...new Set(searchTokens(query))]
}

function searchTokens(value: string) {
  return (
    value
      .toLocaleLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .match(/[a-z0-9]+/g) ?? []
  )
}

function candidateSearchTokens(value: string) {
  const tokens = searchTokens(value)
  const tokenSet = new Set(tokens)

  for (let index = 0; index < tokens.length - 1; index += 1) {
    tokenSet.add(`${tokens[index]}${tokens[index + 1]}`)
  }

  return [...tokenSet]
}

function categorySearchText(category: CategoryFilter) {
  return category === "favorites"
    ? "favorites"
    : formatExerciseCategory(category)
}

function exerciseSearchText(exercise: Exercise) {
  return `${exercise.id} ${formatExerciseCategory(exercise.category)}`
}

function fuzzyDistanceLimit(queryToken: string) {
  if (queryToken.length < 4) {
    return 0
  }

  return queryToken.length >= 8 ? 2 : 1
}

function isWithinEditDistance(
  source: string,
  target: string,
  maxDistance: number,
) {
  if (Math.abs(source.length - target.length) > maxDistance) {
    return false
  }

  let previousRow = Array.from({ length: target.length + 1 }, (_, index) => index)

  for (let sourceIndex = 0; sourceIndex < source.length; sourceIndex += 1) {
    const currentRow = [sourceIndex + 1]
    let rowMinimum = currentRow[0]

    for (let targetIndex = 0; targetIndex < target.length; targetIndex += 1) {
      const substitutionCost =
        source[sourceIndex] === target[targetIndex] ? 0 : 1
      const distance = Math.min(
        previousRow[targetIndex + 1] + 1,
        currentRow[targetIndex] + 1,
        previousRow[targetIndex] + substitutionCost,
      )

      currentRow.push(distance)
      rowMinimum = Math.min(rowMinimum, distance)
    }

    if (rowMinimum > maxDistance) {
      return false
    }

    previousRow = currentRow
  }

  return previousRow[target.length] <= maxDistance
}

function matchesCandidateToken(candidateToken: string, queryToken: string) {
  if (candidateToken.startsWith(queryToken)) {
    return true
  }

  const maxDistance = fuzzyDistanceLimit(queryToken)

  if (maxDistance === 0 || candidateToken[0] !== queryToken[0]) {
    return false
  }

  return (
    isWithinEditDistance(
      queryToken,
      candidateToken.slice(0, queryToken.length),
      maxDistance,
    ) || isWithinEditDistance(queryToken, candidateToken, maxDistance)
  )
}

function matchesSearchText(searchText: string, query: string) {
  const tokens = queryTokens(query)
  const candidateTokens = candidateSearchTokens(searchText)

  return tokens.every((queryToken) =>
    candidateTokens.some((candidateToken) =>
      matchesCandidateToken(candidateToken, queryToken),
    ),
  )
}

function matchesTokens(exercise: Exercise, query: string) {
  return matchesSearchText(exerciseSearchText(exercise), query)
}

function compareByName(a: Exercise, b: Exercise) {
  return a.id.localeCompare(b.id)
}

function sortExercises(
  exercises: Exercise[],
  stats: Record<string, ExerciseUsageStats>,
  sortOption: ExerciseSortOption,
) {
  return [...exercises].sort((a, b) => {
    const aStats = stats[a.id]
    const bStats = stats[b.id]

    if (sortOption === "frequency") {
      const countDifference =
        (bStats?.workoutCount ?? 0) - (aStats?.workoutCount ?? 0)

      if (countDifference !== 0) {
        return countDifference
      }

      const recencyDifference = (bStats?.lastUsedDate ?? "").localeCompare(
        aStats?.lastUsedDate ?? "",
      )

      return recencyDifference || compareByName(a, b)
    }

    if (sortOption === "recency") {
      const recencyDifference = (bStats?.lastUsedDate ?? "").localeCompare(
        aStats?.lastUsedDate ?? "",
      )

      if (recencyDifference !== 0) {
        return recencyDifference
      }

      const countDifference =
        (bStats?.workoutCount ?? 0) - (aStats?.workoutCount ?? 0)

      return countDifference || compareByName(a, b)
    }

    return compareByName(a, b)
  })
}

export function ExercisePickerScreen() {
  const navigate = useNavigate()
  const searchRef = useRef<HTMLInputElement>(null)
  const selectedDate = useAppStore((state) => state.selectedDate)
  const selectedProfile = useAppStore((state) => state.selectedProfile)
  const refreshVersion = useAppStore((state) => state.refreshVersion)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const replaceWorkoutExerciseId = useAppStore(
    (state) => state.replaceWorkoutExerciseId,
  )
  const setReplaceWorkoutExerciseId = useAppStore(
    (state) => state.setReplaceWorkoutExerciseId,
  )
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exerciseCategories, setExerciseCategories] = useState<
    ExerciseCategory[]
  >([...defaultExerciseCategories])
  const [stats, setStats] = useState<Record<string, ExerciseUsageStats>>({})
  const [query, setQuery] = useState("")
  const [sortOption, setSortOption] = useState<ExerciseSortOption>("name")
  const [categoryFilter, setCategoryFilter] = useState<
    CategoryFilter | undefined
  >()
  const [pendingDelete, setPendingDelete] = useState<Exercise | undefined>()
  const [message, setMessage] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false

    Promise.all([
      getAllExercises(),
      getExerciseUsageStats(selectedProfile),
      getExerciseCategories(),
    ]).then(
      ([exerciseRows, usageStats, categoryRows]) => {
        if (!cancelled) {
          setExercises(exerciseRows)
          setStats(usageStats)
          if (categoryRows.length > 0) {
            setExerciseCategories(categoryRows)
          }
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [refreshVersion, selectedProfile])

  useEffect(() => {
    const focusSearchInput = () => {
      searchRef.current?.focus({ preventScroll: true })
    }
    const timeouts = [80, 220, 420].map((delay) =>
      window.setTimeout(focusSearchInput, delay),
    )
    const animationFrame = window.requestAnimationFrame(focusSearchInput)

    focusSearchInput()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      for (const timeout of timeouts) {
        window.clearTimeout(timeout)
      }
    }
  }, [replaceWorkoutExerciseId])

  const categories = useMemo<CategoryFilter[]>(() => {
    const hasFavorites = exercises.some((exercise) => exercise.isFavorite)
    const categoryOptions = hasFavorites
      ? ["favorites", ...exerciseCategories]
      : [...exerciseCategories]

    if (!query.trim()) {
      return categoryOptions
    }

    return categoryOptions.filter((category) =>
      matchesSearchText(categorySearchText(category), query),
    )
  }, [exerciseCategories, exercises, query])

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
      return sortExercises(categoryFiltered, stats, sortOption)
    }

    const tokenResults = categoryFiltered.filter((exercise) =>
      matchesTokens(exercise, query),
    )

    return sortExercises(tokenResults, stats, sortOption)
  }, [categoryFilter, exercises, query, sortOption, stats])

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

    const workoutExercise = await addExerciseToDate(
      selectedDate,
      selectedProfile,
      exercise.id,
    )
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
          className="h-11 rounded-md border-white/10 bg-[var(--app-surface)] text-base text-zinc-100 placeholder:text-zinc-600 focus-visible:border-cyan-300/60 focus-visible:ring-cyan-400/25"
          placeholder="Search exercises"
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton title={`Sort: ${exerciseSortLabels[sortOption]}`}>
              <ArrowDownAZ className="size-5" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 rounded-md border-white/10 bg-[#1a1d22] text-zinc-100 shadow-xl"
          >
            <DropdownMenuRadioGroup
              value={sortOption}
              onValueChange={(value) =>
                setSortOption(value as ExerciseSortOption)
              }
            >
              <DropdownMenuRadioItem
                className="rounded-md focus:bg-cyan-400/15"
                value="name"
              >
                Name
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                className="rounded-md focus:bg-cyan-400/15"
                value="frequency"
              >
                Frequency
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                className="rounded-md focus:bg-cyan-400/15"
                value="recency"
              >
                Recency
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <IconButton
          className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"
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
            className="cursor-pointer text-cyan-300"
            type="button"
            onClick={() => setCategoryFilter(undefined)}
          >
            Clear filter
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-md border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-100">
          {message}
        </div>
      )}

      <div className="space-y-2">
        {filteredExercises.length === 0 ? (
          <div className="rounded-md border border-white/10 bg-[var(--app-surface)] px-3 py-8 text-center text-sm text-zinc-500">
            No exercises found
          </div>
        ) : (
          filteredExercises.map((exercise) => {
            const usage = stats[exercise.id]

            return (
              <div
                className="grid grid-cols-[1fr_3rem_3rem] items-center rounded-md border border-white/10 bg-[var(--app-surface)] text-left shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                key={exercise.id}
              >
                <button
                  className="min-w-0 cursor-pointer px-3 py-3 text-left"
                  type="button"
                  onClick={() => void selectExercise(exercise)}
                >
                  <div className="truncate text-[15px] font-medium text-zinc-50">
                    {exercise.id}
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
                    "mx-auto inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-zinc-500 hover:bg-white/10",
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
                      className="mx-auto inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-zinc-400 hover:bg-white/10"
                      type="button"
                      title="Exercise actions"
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
                    <DropdownMenuSeparator className="bg-white/10" />
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
        <AlertDialogContent className="rounded-md border-white/10 bg-[var(--app-surface-raised)] text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exercise?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This only works for exercises with no workout history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-white/10 bg-[var(--app-surface)]">
            <AlertDialogCancel className="rounded-md border-white/10 bg-white/10 text-zinc-100 hover:bg-white/15">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-md bg-red-500/20 text-red-100 ring-1 ring-red-400/25 hover:bg-red-500/30"
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
