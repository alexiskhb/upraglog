import {
  addDays,
  differenceInSeconds,
  format,
  isToday,
  parseISO,
} from "date-fns"

type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6

type IntlWithLocale = {
  Locale?: new (tag?: string) => {
    weekInfo?: {
      firstDay?: number
    }
  }
}

function getUserLocales() {
  if (typeof navigator === "undefined") {
    return undefined
  }

  return navigator.languages.length > 0
    ? navigator.languages
    : navigator.language || undefined
}

function getPrimaryUserLocale() {
  if (typeof navigator === "undefined") {
    return undefined
  }

  return navigator.languages[0] || navigator.language || undefined
}

function formatDisplayDate(date: Date, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(getUserLocales(), options).format(date)
}

function toLocaleUpper(value: string) {
  return value.toLocaleUpperCase(getUserLocales())
}

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
    return toLocaleUpper(
      new Intl.RelativeTimeFormat(getUserLocales(), {
        numeric: "auto",
      }).format(0, "day"),
    )
  }

  return toLocaleUpper(
    formatDisplayDate(date, {
      day: "numeric",
      month: "short",
      weekday: "short",
    }),
  )
}

export function formatLongDate(localDate: string) {
  return formatDisplayDate(parseLocalDate(localDate), {
    day: "numeric",
    month: "short",
    weekday: "long",
    year: "numeric",
  })
}

export function formatShortDate(localDate: string) {
  return formatDisplayDate(parseLocalDate(localDate), {
    day: "numeric",
    month: "short",
  })
}

export function formatMonthLabel(date: Date) {
  return toLocaleUpper(
    formatDisplayDate(date, {
      month: "long",
      year: "numeric",
    }),
  )
}

export function formatDayOfMonth(date: Date) {
  return formatDisplayDate(date, { day: "numeric" })
}

export function getFirstDayOfWeek(): WeekStartsOn {
  const locale = getPrimaryUserLocale()
  const LocaleConstructor = (Intl as unknown as IntlWithLocale).Locale

  if (locale && LocaleConstructor) {
    const firstDay = new LocaleConstructor(locale).weekInfo?.firstDay

    if (firstDay && firstDay >= 1 && firstDay <= 7) {
      return (firstDay % 7) as WeekStartsOn
    }
  }

  return 1
}

export function getCalendarWeekdays() {
  const firstDay = getFirstDayOfWeek()
  const formatter = new Intl.DateTimeFormat(getUserLocales(), {
    weekday: "short",
  })
  const firstSunday = new Date(2020, 5, 7)

  return Array.from({ length: 7 }, (_, index) => {
    const weekday = (firstDay + index) % 7
    return formatter.format(addDays(firstSunday, weekday))
  })
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
