import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getWorkoutDates } from "@/db/repositories/workoutsRepo"
import { useAppStore } from "@/shared/store/appStore"
import {
  formatDayOfMonth,
  formatMonthLabel,
  getCalendarWeekdays,
  getFirstDayOfWeek,
  parseLocalDate,
  todayString,
  toLocalDateString,
} from "@/shared/model/dates"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { IconButton } from "@/shared/ui/IconButton"
import { cn } from "@/lib/utils"

export function CalendarScreen() {
  const navigate = useNavigate()
  const selectedDate = useAppStore((state) => state.selectedDate)
  const setSelectedDate = useAppStore((state) => state.setSelectedDate)
  const selectedProfile = useAppStore((state) => state.selectedProfile)
  const refreshVersion = useAppStore((state) => state.refreshVersion)
  const [monthDate, setMonthDate] = useState(() => parseLocalDate(selectedDate))
  const [workoutDates, setWorkoutDates] = useState<string[]>([])
  const weekStartsOn = getFirstDayOfWeek()
  const weekdays = useMemo(() => getCalendarWeekdays(), [])

  useEffect(() => {
    let cancelled = false

    getWorkoutDates(selectedProfile).then((dates) => {
      if (!cancelled) {
        setWorkoutDates(dates)
      }
    })

    return () => {
      cancelled = true
    }
  }, [refreshVersion, selectedProfile])

  const workoutDateSet = useMemo(() => new Set(workoutDates), [workoutDates])
  const visibleDays = useMemo(() => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn }),
      end: endOfWeek(monthEnd, { weekStartsOn }),
    })
  }, [monthDate, weekStartsOn])

  const openDate = (date: Date) => {
    const localDate = toLocalDateString(date)

    setSelectedDate(localDate)
    void navigate({ to: "/day/$date", params: { date: localDate } })
  }

  const jumpToToday = () => {
    const currentDay = todayString()

    setMonthDate(parseLocalDate(currentDay))
    setSelectedDate(currentDay)
  }

  return (
    <ScreenContainer className="gap-4">
      <div className="grid h-12 grid-cols-[3rem_1fr_3rem] items-center rounded-md border border-white/10 bg-[var(--app-surface-muted)] pt-1 shadow-[0_10px_28px_rgba(0,0,0,0.2)]">
        <IconButton
          className="text-cyan-300"
          title="Previous month"
          onClick={() => setMonthDate((current) => subMonths(current, 1))}
        >
          <ChevronLeft className="size-7" />
        </IconButton>
        <button
          aria-label="Jump to today"
          className="min-w-0 truncate text-center text-sm font-semibold uppercase tracking-normal text-zinc-100 transition hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          title="Jump to today"
          type="button"
          onClick={jumpToToday}
        >
          {formatMonthLabel(monthDate)}
        </button>
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
                "relative aspect-square cursor-pointer rounded-md border border-white/10 bg-[var(--app-surface)] text-sm text-zinc-200 transition hover:border-cyan-300/50 hover:bg-[#1b2026]",
                !inMonth && "text-zinc-700",
                isSelected && "border-cyan-300/50 bg-cyan-400/15 text-cyan-100",
              )}
              key={localDate}
              type="button"
              onClick={() => openDate(day)}
            >
              <span>{formatDayOfMonth(day)}</span>
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
