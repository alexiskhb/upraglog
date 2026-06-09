import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatDateLabel } from "@/shared/model/dates"
import { IconButton } from "@/shared/ui/IconButton"

type DateNavRowProps = {
  localDate: string
  onPrevious: () => void
  onNext: () => void
}

export function DateNavRow({ localDate, onPrevious, onNext }: DateNavRowProps) {
  return (
    <div className="sticky top-0 z-10 -mx-4 bg-[var(--app-bg)] px-4 pb-3 pt-1 sm:-mx-5 sm:px-5">
      <div className="grid h-12 grid-cols-[3rem_1fr_3rem] items-center rounded-md border border-white/10 bg-[var(--app-surface-muted)] shadow-[0_10px_28px_rgba(0,0,0,0.2)]">
        <IconButton
          className="text-cyan-300"
          title="Previous day"
          onClick={onPrevious}
        >
          <ChevronLeft className="size-7" />
        </IconButton>
        <div className="truncate text-center text-sm font-semibold uppercase tracking-normal text-zinc-100">
          {formatDateLabel(localDate)}
        </div>
        <IconButton className="text-cyan-300" title="Next day" onClick={onNext}>
          <ChevronRight className="size-7" />
        </IconButton>
      </div>
    </div>
  )
}
