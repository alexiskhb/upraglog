import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import type { BodyMeasurementEntry } from "@/db/schema"
import {
  addBodyMeasurement,
  deleteBodyMeasurement,
  getRecentBodyMeasurements,
} from "@/db/repositories/bodyMeasurementsRepo"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/shared/store/appStore"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { ActionButton } from "@/shared/ui/ActionButton"
import { defaultUnitForMeasurement } from "@/shared/model/units"
import { todayString } from "@/shared/model/dates"

const measurementTypes = [
  "Body weight",
  "Body fat percentage",
  "Waist",
  "Chest",
  "Arms",
  "Legs",
  "Custom",
]

export function BodyTrackerScreen() {
  const selectedDate = useAppStore((state) => state.selectedDate)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const [localDate, setLocalDate] = useState(selectedDate || todayString())
  const [measurementType, setMeasurementType] = useState("Body weight")
  const [customType, setCustomType] = useState("")
  const [value, setValue] = useState("")
  const [unit, setUnit] = useState("kg")
  const [entries, setEntries] = useState<BodyMeasurementEntry[]>([])
  const [message, setMessage] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false

    getRecentBodyMeasurements().then((recentEntries) => {
      if (!cancelled) {
        setEntries(recentEntries)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const loadEntries = async () => {
    setEntries(await getRecentBodyMeasurements())
  }

  const saveEntry = async () => {
    const parsedValue = Number(value)
    const type =
      measurementType === "Custom" ? customType.trim() : measurementType.trim()

    if (!type || Number.isNaN(parsedValue)) {
      setMessage("Enter a measurement and numeric value.")
      return
    }

    await addBodyMeasurement({
      localDate,
      measurementType: type,
      value: parsedValue,
      unit,
    })
    setValue("")
    setMessage("Measurement saved.")
    await loadEntries()
    bumpRefresh()
  }

  return (
    <ScreenContainer className="gap-4">
      <div className="pt-3">
        <h1 className="text-[17px] font-semibold text-zinc-50">Body Tracker</h1>
        <div className="mt-2 h-px bg-cyan-500/70" />
      </div>

      {message && (
        <div className="rounded-sm border border-cyan-500/25 bg-cyan-950/20 px-3 py-2 text-sm text-cyan-100">
          {message}
        </div>
      )}

      <div className="space-y-4 rounded-sm bg-[#15191e] p-3">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Date
          </Label>
          <Input
            className="h-11 rounded-sm border-cyan-500/35 bg-[#090b0d] text-base text-zinc-100 focus-visible:ring-cyan-500"
            type="date"
            value={localDate}
            onChange={(event) => setLocalDate(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-normal text-zinc-400">
            Measurement
          </Label>
          <select
            className="h-11 w-full rounded-sm border border-cyan-500/35 bg-[#090b0d] px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
            value={measurementType}
            onChange={(event) => {
              const nextType = event.target.value
              setMeasurementType(nextType)
              setUnit(defaultUnitForMeasurement(nextType))
            }}
          >
            {measurementTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {measurementType === "Custom" && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-normal text-zinc-400">
              Custom Name
            </Label>
            <Input
              className="h-11 rounded-sm border-cyan-500/35 bg-[#090b0d] text-base text-zinc-100 focus-visible:ring-cyan-500"
              value={customType}
              onChange={(event) => {
                setCustomType(event.target.value)
                setUnit(defaultUnitForMeasurement(event.target.value))
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-[1fr_6rem] gap-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-normal text-zinc-400">
              Value
            </Label>
            <Input
              className="h-11 rounded-sm border-cyan-500/35 bg-[#090b0d] text-base text-zinc-100 focus-visible:ring-cyan-500"
              inputMode="decimal"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-normal text-zinc-400">
              Unit
            </Label>
            <Input
              className="h-11 rounded-sm border-cyan-500/35 bg-[#090b0d] text-base text-zinc-100 focus-visible:ring-cyan-500"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
            />
          </div>
        </div>
      </div>

      <ActionButton tone="save" onClick={saveEntry}>
        Save
      </ActionButton>

      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-normal text-zinc-500">
          Recent entries
        </div>
        {entries.length === 0 ? (
          <div className="rounded-sm bg-[#15191e] px-3 py-8 text-center text-sm text-zinc-500">
            No measurements yet
          </div>
        ) : (
          entries.map((entry) => (
            <div
              className="grid grid-cols-[1fr_auto_2.5rem] items-center gap-2 rounded-sm bg-[#15191e] px-3 py-3"
              key={entry.id}
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-zinc-50">
                  {entry.measurementType}
                </div>
                <div className="text-xs text-zinc-500">{entry.localDate}</div>
              </div>
              <div className="text-right text-sm tabular-nums text-zinc-100">
                {entry.value} {entry.unit}
              </div>
              <button
                className="inline-flex size-9 items-center justify-center rounded-sm text-zinc-500 hover:bg-zinc-800 hover:text-red-300"
                type="button"
                title="Delete measurement"
                onClick={async () => {
                  await deleteBodyMeasurement(entry.id)
                  await loadEntries()
                }}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </section>
    </ScreenContainer>
  )
}
