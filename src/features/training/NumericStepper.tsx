import { Minus, Plus } from "lucide-react"
import { IconButton } from "@/shared/ui/IconButton"
import { formatDuration } from "@/shared/model/dates"

type NumericStepperProps = {
  label: string
  value: number
  step: number
  min?: number
  unit?: string
  isDuration?: boolean
  onChange: (value: number) => void
}

export function NumericStepper({
  label,
  value,
  step,
  min = 0,
  unit,
  isDuration = false,
  onChange,
}: NumericStepperProps) {
  const displayValue = isDuration
    ? formatDuration(value)
    : Number.isInteger(value)
      ? value.toString()
      : value.toFixed(1)

  const setValue = (nextValue: number) => {
    onChange(Math.max(min, Number(nextValue.toFixed(1))))
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-normal text-zinc-400">
        {label}
        {unit ? <span className="text-zinc-500"> ({unit})</span> : null}
      </div>
      <div className="grid h-16 grid-cols-[4rem_1fr_4rem] items-center rounded-md border border-cyan-300/25 bg-[var(--app-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <IconButton
          className="mx-auto text-zinc-100"
          title={`Decrease ${label}`}
          onClick={() => setValue(value - step)}
        >
          <Minus className="size-5" />
        </IconButton>
        <div className="min-w-0 text-center text-3xl font-medium tabular-nums text-zinc-50">
          {displayValue}
        </div>
        <IconButton
          className="mx-auto text-zinc-100"
          title={`Increase ${label}`}
          onClick={() => setValue(value + step)}
        >
          <Plus className="size-5" />
        </IconButton>
      </div>
    </div>
  )
}
