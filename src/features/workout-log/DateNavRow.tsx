import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatDateLabel } from "@/shared/model/dates"
import { IconButton } from "@/shared/ui/IconButton"

type DateNavRowProps = {
  localDate: string
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  previousDisabled?: boolean
  nextDisabled?: boolean
}

export function DateNavRow({
  localDate,
  onPrevious,
  onNext,
  onToday,
  previousDisabled = false,
  nextDisabled = false,
}: DateNavRowProps) {
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-[var(--app-bg)] px-4 pb-3 pt-1 sm:-mx-5 sm:px-5">
      <div className="grid h-12 grid-cols-[3rem_1fr_3rem] items-center rounded-md border border-white/10 bg-[var(--app-surface-muted)] shadow-[0_10px_28px_rgba(0,0,0,0.2)]">
        <IconButton
          className="text-cyan-300"
          title="Previous day"
          disabled={previousDisabled}
          onClick={onPrevious}
        >
          <ChevronLeft className="size-7" />
        </IconButton>
        <button
          aria-label="Jump to today"
          className="min-w-0 truncate text-center text-sm font-semibold uppercase tracking-normal text-zinc-100 transition hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          title="Jump to today"
          type="button"
          onClick={onToday}
        >
          {formatDateLabel(localDate)}
        </button>
        <IconButton
          className="text-cyan-300"
          title="Next day"
          disabled={nextDisabled}
          onClick={onNext}
        >
          <ChevronRight className="size-7" />
        </IconButton>
      </div>
    </div>
  )
}
