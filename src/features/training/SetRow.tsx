import { MessageCircle } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ExerciseType, SetEntry } from "@/db/schema"
import {
  formatSetPrimaryValue,
  formatSetSecondaryValue,
} from "@/shared/model/units"
import { SwipeToDelete } from "@/shared/ui/SwipeToDelete"
import { cn } from "@/lib/utils"

type SetRowProps = {
  set: SetEntry
  index: number
  exerciseType: ExerciseType
  selected: boolean
  onSelect: () => void
  onComment: () => void
  onDelete: () => void
  onFinishedChange: (finished: boolean) => void
}

export function SetRow({
  set,
  index,
  exerciseType,
  selected,
  onSelect,
  onComment,
  onDelete,
  onFinishedChange,
}: SetRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: set.id })
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
      <div
        className={cn(
          "grid min-h-12 grid-cols-[2.25rem_2rem_minmax(0,1fr)_5.5rem_2.25rem] items-center gap-2 bg-[var(--app-surface)] px-1 text-sm tabular-nums text-zinc-100 transition hover:bg-[#1b2026]",
          selected &&
            "bg-cyan-400/15 text-cyan-50 shadow-[inset_3px_0_0_rgba(34,211,238,0.75)]",
        )}
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
          title="Long press to move set"
          onClick={onSelect}
          {...attributes}
          {...listeners}
        >
          <span className="text-center text-zinc-400">{index + 1}</span>
          <span className="text-right">
            {formatSetPrimaryValue(set, exerciseType)}
          </span>
          <span className="text-right">
            {formatSetSecondaryValue(set, exerciseType)}
          </span>
        </button>
        <input
          aria-label={`Set ${index + 1} finished`}
          checked={Boolean(set.finishedAt)}
          className="mx-auto size-5 accent-cyan-500"
          title="Set finished"
          type="checkbox"
          onChange={(event) => onFinishedChange(event.target.checked)}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </SwipeToDelete>
  )
}
