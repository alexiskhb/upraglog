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
            "h-9 shrink-0 cursor-pointer rounded-md border border-white/10 bg-white/5 px-3 text-sm text-zinc-200 transition hover:border-cyan-300/50 hover:bg-white/10",
            activeCategory === category &&
              "border-cyan-300/50 bg-cyan-400/15 text-cyan-100 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12)]",
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
