import type { ExerciseCategory } from "@/db/schema"
import { formatExerciseCategory } from "@/shared/model/exercises"
import { cn } from "@/lib/utils"

type CategoryChip = ExerciseCategory | "favorites"

type ExerciseCategoryChipsProps = {
  categories: CategoryChip[]
  activeCategory?: CategoryChip
  onChange: (category: CategoryChip | undefined) => void
}

export function ExerciseCategoryChips({
  categories,
  activeCategory,
  onChange,
}: ExerciseCategoryChipsProps) {
  return (
    <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:px-4">
      {categories.map((category) => (
        <button
          className={cn(
            "h-9 shrink-0 rounded-sm border border-zinc-700 px-3 text-sm text-zinc-200 transition hover:border-cyan-500/70",
            activeCategory === category &&
              "border-cyan-500 bg-cyan-500/15 text-cyan-100",
          )}
          key={category}
          type="button"
          onClick={() =>
            onChange(activeCategory === category ? undefined : category)
          }
        >
          {category === "favorites"
            ? "Favorites"
            : formatExerciseCategory(category)}
        </button>
      ))}
    </div>
  )
}
