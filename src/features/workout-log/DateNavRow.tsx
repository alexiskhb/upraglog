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
    <div className="sticky top-0 z-10 -mx-3 bg-[#090b0d] px-3 pb-2 pt-1 sm:-mx-4 sm:px-4">
      <div className="grid h-12 grid-cols-[3rem_1fr_3rem] items-center border-b border-cyan-500/70">
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
