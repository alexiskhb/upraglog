import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getWorkoutDates } from "@/db/repositories/workoutsRepo"
import { useAppStore } from "@/shared/store/appStore"
import {
  formatMonthLabel,
  parseLocalDate,
  toLocalDateString,
} from "@/shared/model/dates"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { IconButton } from "@/shared/ui/IconButton"
import { cn } from "@/lib/utils"

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function CalendarScreen() {
  const navigate = useNavigate()
  const selectedDate = useAppStore((state) => state.selectedDate)
  const setSelectedDate = useAppStore((state) => state.setSelectedDate)
  const refreshVersion = useAppStore((state) => state.refreshVersion)
  const [monthDate, setMonthDate] = useState(() => parseLocalDate(selectedDate))
  const [workoutDates, setWorkoutDates] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false

    getWorkoutDates().then((dates) => {
      if (!cancelled) {
        setWorkoutDates(dates)
      }
    })

    return () => {
      cancelled = true
    }
  }, [refreshVersion])

  const workoutDateSet = useMemo(() => new Set(workoutDates), [workoutDates])
  const visibleDays = useMemo(() => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    })
  }, [monthDate])

  const openDate = (date: Date) => {
    const localDate = toLocalDateString(date)

    setSelectedDate(localDate)
    void navigate({ to: "/day/$date", params: { date: localDate } })
  }

  return (
    <ScreenContainer className="gap-4">
      <div className="grid h-12 grid-cols-[3rem_1fr_3rem] items-center border-b border-cyan-500/70 pt-1">
        <IconButton
          className="text-cyan-300"
          title="Previous month"
          onClick={() => setMonthDate((current) => subMonths(current, 1))}
        >
          <ChevronLeft className="size-7" />
        </IconButton>
        <div className="text-center text-sm font-semibold uppercase tracking-normal">
          {formatMonthLabel(monthDate)}
        </div>
        <IconButton
          className="text-cyan-300"
          title="Next month"
          onClick={() => setMonthDate((current) => addMonths(current, 1))}
        >
          <ChevronRight className="size-7" />
        </IconButton>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-normal text-zinc-500">
        {weekdays.map((weekday) => (
          <div className="py-1" key={weekday}>
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {visibleDays.map((day) => {
          const localDate = toLocalDateString(day)
          const hasWorkout = workoutDateSet.has(localDate)
          const isSelected = localDate === selectedDate
          const inMonth = isSameMonth(day, monthDate)

          return (
            <button
              className={cn(
                "relative aspect-square rounded-sm border border-zinc-800 bg-[#11151a] text-sm text-zinc-200 transition hover:border-cyan-500/70",
                !inMonth && "text-zinc-700",
                isSelected && "border-cyan-500 bg-cyan-500/15 text-cyan-100",
              )}
              key={localDate}
              type="button"
              onClick={() => openDate(day)}
            >
              <span>{format(day, "d")}</span>
              {hasWorkout && (
                <span className="absolute inset-x-0 bottom-2 mx-auto h-1 w-5 rounded-full bg-cyan-400" />
              )}
            </button>
          )
        })}
      </div>
    </ScreenContainer>
  )
}
