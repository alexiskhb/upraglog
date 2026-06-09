import {
  addDays,
  differenceInSeconds,
  format,
  isToday,
  parseISO,
} from "date-fns"

export function toLocalDateString(date: Date) {
  return format(date, "yyyy-MM-dd")
}

export function todayString() {
  return toLocalDateString(new Date())
}

export function parseLocalDate(localDate: string) {
  return parseISO(`${localDate}T00:00:00`)
}

export function shiftLocalDate(localDate: string, amount: number) {
  return toLocalDateString(addDays(parseLocalDate(localDate), amount))
}

export function formatDateLabel(localDate: string) {
  const date = parseLocalDate(localDate)

  if (isToday(date)) {
    return "TODAY"
  }

  return format(date, "EEE, MMM d").toUpperCase()
}

export function formatLongDate(localDate: string) {
  return format(parseLocalDate(localDate), "EEEE, MMM d, yyyy")
}

export function formatShortDate(localDate: string) {
  return format(parseLocalDate(localDate), "MMM d")
}

export function formatMonthLabel(date: Date) {
  return format(date, "MMMM yyyy").toUpperCase()
}

export function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

export function getWorkoutDurationSeconds(startedAt?: string, endedAt?: string) {
  if (!startedAt) {
    return 0
  }

  return differenceInSeconds(
    endedAt ? new Date(endedAt) : new Date(),
    new Date(startedAt),
  )
}
