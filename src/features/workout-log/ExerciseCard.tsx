import type { ExerciseType, SetEntry, UnitSystem } from "@/db/schema"
import {
  formatSetPrimaryValue,
  formatSetSecondaryValue,
} from "@/shared/model/units"

type ExerciseCardProps = {
  name: string
  exerciseType: ExerciseType
  sets: SetEntry[]
  unitSystem: UnitSystem
  onOpen: () => void
}

export function ExerciseCard({
  name,
  exerciseType,
  sets,
  unitSystem,
  onOpen,
}: ExerciseCardProps) {
  return (
    <button
      className="app-surface w-full cursor-pointer rounded-md p-3.5 text-left transition hover:border-cyan-300/30 hover:bg-[#1b2026] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
      type="button"
      onClick={onOpen}
    >
      <div className="truncate text-[15px] font-medium text-zinc-50">{name}</div>
      <div className="mt-2 h-px bg-cyan-300/50" />
      <div className="mt-3 space-y-1">
        {sets.length === 0 ? (
          <div className="text-right text-sm text-zinc-500">No sets logged</div>
        ) : (
          sets.map((set) => (
            <div
              className="grid grid-cols-[1fr_7rem_6rem] items-center gap-2 text-sm tabular-nums text-zinc-100"
              key={set.id}
            >
              <span />
              <span className="text-right">
                {formatSetPrimaryValue(set, exerciseType, unitSystem)}
              </span>
              <span className="text-right">
                {formatSetSecondaryValue(set, exerciseType)}
              </span>
            </div>
          ))
        )}
      </div>
    </button>
  )
}
