import { MessageCircle, GripVertical } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ExerciseType, SetEntry } from "@/db/schema"
import {
  formatSetPrimaryValue,
  formatSetSecondaryValue,
} from "@/shared/model/units"
import { cn } from "@/lib/utils"

type SetRowProps = {
  set: SetEntry
  index: number
  exerciseType: ExerciseType
  selected: boolean
  onSelect: () => void
  onComment: () => void
}

export function SetRow({
  set,
  index,
  exerciseType,
  selected,
  onSelect,
  onComment,
}: SetRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: set.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      className={cn(
        "grid min-h-12 grid-cols-[2.5rem_2.5rem_1fr_6rem_2rem] items-center gap-2 border-b border-white/10 px-1 text-sm tabular-nums text-zinc-100 transition hover:bg-white/5",
        selected && "bg-cyan-400/15 text-cyan-50 shadow-[inset_3px_0_0_rgba(34,211,238,0.75)]",
      )}
      ref={setNodeRef}
      style={style}
    >
      <button
        className={cn(
          "inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-cyan-300",
          set.comment && "text-cyan-300",
        )}
        type="button"
        title="Set comment"
        onClick={(event) => {
          event.stopPropagation()
          onComment()
        }}
      >
        <MessageCircle className="size-4" />
      </button>
      <button
        className="contents"
        type="button"
        onClick={onSelect}
      >
        <span className="text-center text-zinc-400">{index + 1}</span>
        <span className="text-right">
          {formatSetPrimaryValue(set, exerciseType)}
        </span>
        <span className="text-right">
          {formatSetSecondaryValue(set, exerciseType)}
        </span>
      </button>
      <button
        className="inline-flex size-8 cursor-grab items-center justify-center rounded-md text-zinc-500 hover:bg-white/10 active:cursor-grabbing"
        type="button"
        title="Drag set"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
    </div>
  )
}
