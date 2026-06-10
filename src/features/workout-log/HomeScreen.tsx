import { useEffect, useState } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import type { AppSettings, WorkoutDayDetail } from "@/db/schema"
import {
  getWorkoutDates,
  getWorkoutDetailByDate,
  startWorkoutTimer,
} from "@/db/repositories/workoutsRepo"
import { getSettings } from "@/db/repositories/settingsRepo"
import { useAppStore } from "@/shared/store/appStore"
import {
  formatLongDate,
  shiftLocalDate,
  todayString,
} from "@/shared/model/dates"
import { ActionButton } from "@/shared/ui/ActionButton"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { WorkoutActiveTimer } from "@/shared/ui/WorkoutActiveTimer"
import {
  defaultProfileName,
  defaultProfileNames,
} from "@/shared/model/profiles"
import { DateNavRow } from "./DateNavRow"
import { ExerciseCard } from "./ExerciseCard"

type DayDirection = -1 | 1

function getDayTransitionClass(currentDate: string, previousDate: string) {
  if (currentDate > previousDate) {
    return "day-transition-next"
  }

  if (currentDate < previousDate) {
    return "day-transition-previous"
  }

  return ""
}

export function HomeScreen() {
  const { date } = useParams({ from: "/day/$date" })
  const navigate = useNavigate()
  const refreshVersion = useAppStore((state) => state.refreshVersion)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const setSelectedDate = useAppStore((state) => state.setSelectedDate)
  const selectedProfile = useAppStore((state) => state.selectedProfile)
  const [detail, setDetail] = useState<WorkoutDayDetail>({
    workout: undefined,
    exercises: [],
  })
  const [settings, setSettings] = useState<AppSettings>({
    keepScreenOn: true,
    skipEmptyDaysOnDayNavigation: false,
    profiles: [...defaultProfileNames],
    selectedProfile: defaultProfileName,
    exportAllProfiles: false,
  })
  const [workoutDates, setWorkoutDates] = useState<string[]>([])
  const [touchStartX, setTouchStartX] = useState<number | undefined>()
  const [dayTransitionClass, setDayTransitionClass] = useState("")
  const today = todayString()
  const skipEmptyDays = settings.skipEmptyDaysOnDayNavigation
  const navigationDates = [...new Set([...workoutDates, today])].sort()
  const previousNavigationDate = navigationDates.findLast(
    (navigationDate) => navigationDate < date,
  )
  const nextNavigationDate = navigationDates.find(
    (navigationDate) => navigationDate > date,
  )
  const previousDate = skipEmptyDays
    ? previousNavigationDate
    : shiftLocalDate(date, -1)
  const nextDate = skipEmptyDays ? nextNavigationDate : shiftLocalDate(date, 1)

  useEffect(() => {
    setSelectedDate(date)
  }, [date, setSelectedDate])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      getWorkoutDetailByDate(date, selectedProfile),
      getSettings(),
      getWorkoutDates(selectedProfile),
    ]).then(([workoutDetail, appSettings, nextWorkoutDates]) => {
      if (!cancelled) {
        setDetail(workoutDetail)
        setSettings(appSettings)
        setWorkoutDates(nextWorkoutDates)
      }
    })

    return () => {
      cancelled = true
    }
  }, [date, refreshVersion, selectedProfile])

  const navigateToDate = (nextDate: string) => {
    setDayTransitionClass(getDayTransitionClass(nextDate, date))
    void navigate({ to: "/day/$date", params: { date: nextDate } })
  }

  const navigateToToday = () => {
    navigateToDate(today)
  }

  const resolveAdjacentDate = (direction: DayDirection) => {
    return direction > 0 ? nextDate : previousDate
  }

  const navigateAdjacent = (direction: DayDirection) => {
    const nextAdjacentDate = resolveAdjacentDate(direction)

    if (nextAdjacentDate) {
      navigateToDate(nextAdjacentDate)
    }
  }

  const startWorkout = async () => {
    await startWorkoutTimer(date, selectedProfile)
    bumpRefresh()
    void navigate({ to: "/picker" })
  }

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX === undefined) {
      return
    }

    const delta = clientX - touchStartX

    if (Math.abs(delta) > 60) {
      navigateAdjacent(delta > 0 ? -1 : 1)
    }

    setTouchStartX(undefined)
  }
  const workoutActive = Boolean(
    detail.workout?.startedAt && !detail.workout.endedAt,
  )

  return (
    <ScreenContainer
      className={`gap-3 ${dayTransitionClass}`}
      key={date}
      onTouchStart={(event) => setTouchStartX(event.changedTouches[0].clientX)}
      onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0].clientX)}
    >
      <DateNavRow
        localDate={date || today}
        onNext={() => navigateAdjacent(1)}
        onPrevious={() => navigateAdjacent(-1)}
        onToday={navigateToToday}
        nextDisabled={!nextDate}
        previousDisabled={!previousDate}
      />

      <div className="flex items-center justify-between gap-3 px-1 text-xs uppercase tracking-normal text-zinc-500">
        <span className="min-w-0 truncate">{formatLongDate(date)}</span>
        <WorkoutActiveTimer workout={detail.workout} />
      </div>

      {detail.exercises.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-start pb-24 pt-[22dvh]">
          <ActionButton
            className="h-12 w-full max-w-64 flex-none px-5 text-sm"
            tone="save"
            onClick={() => void startWorkout()}
          >
            {workoutActive ? "Add Exercise" : "Start Workout"}
          </ActionButton>
        </div>
      ) : (
        <div className="space-y-3">
          {detail.exercises.map((entry) => (
            <ExerciseCard
              exerciseType={entry.exercise.exerciseType}
              key={entry.workoutExercise.id}
              sets={entry.sets}
              title={entry.exercise.id}
              onOpen={() =>
                void navigate({
                  to: "/training/$workoutExerciseId",
                  params: {
                    workoutExerciseId: entry.workoutExercise.id,
                  },
                })
              }
            />
          ))}
        </div>
      )}
    </ScreenContainer>
  )
}
