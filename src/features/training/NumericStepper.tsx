import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { IconButton } from "@/shared/ui/IconButton"
import { formatDuration } from "@/shared/model/dates"

type NumericStepperProps = {
  label: string
  value: number | null
  step: number
  min?: number
  unit?: string
  isDuration?: boolean
  onChange: (value: number | null) => void
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
  const [editing, setEditing] = useState(false)
  const [draftValue, setDraftValue] = useState("")
  const displayValue =
    value === null
      ? ""
      : isDuration
        ? formatDuration(value)
        : value.toString()
  const inputValue = editing ? draftValue : displayValue

  const toDraftValue = () => (value === null ? "" : value.toString())

  const setValue = (nextValue: number) => {
    onChange(Math.max(min, Number(nextValue.toFixed(1))))
  }

  const decreaseValue = () => {
    setValue(value === null ? min : value - step)
  }

  const increaseValue = () => {
    setValue((value ?? min) + step)
  }

  const commitInput = (rawValue: string) => {
    const nextDraftValue = rawValue.replace(",", ".")

    if (isDuration && !/^\d*$/.test(nextDraftValue)) {
      return
    }

    if (!isDuration && !/^\d*\.?\d*$/.test(nextDraftValue)) {
      return
    }

    setDraftValue(nextDraftValue)

    if (nextDraftValue === "" || nextDraftValue === ".") {
      onChange(null)
      return
    }

    const nextValue = Number(nextDraftValue)

    if (Number.isFinite(nextValue)) {
      onChange(Math.max(min, nextValue))
    }
  }

  const finishEditing = () => {
    if (draftValue === "." || draftValue === "") {
      onChange(null)
    }

    setEditing(false)
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
          onClick={decreaseValue}
        >
          <Minus className="size-5" />
        </IconButton>
        <input
          aria-label={label}
          className="h-full min-w-0 bg-transparent px-1 text-center text-3xl font-medium tabular-nums text-zinc-50 outline-none placeholder:text-zinc-600"
          enterKeyHint="done"
          inputMode={isDuration ? "numeric" : "decimal"}
          value={inputValue}
          onBlur={finishEditing}
          onChange={(event) => commitInput(event.target.value)}
          onFocus={(event) => {
            const nextDraftValue = toDraftValue()
            setDraftValue(nextDraftValue)
            setEditing(true)
            event.currentTarget.select()
          }}
        />
        <IconButton
          className="mx-auto text-zinc-100"
          title={`Increase ${label}`}
          onClick={increaseValue}
        >
          <Plus className="size-5" />
        </IconButton>
      </div>
    </div>
  )
}
