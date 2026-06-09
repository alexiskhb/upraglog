import { useEffect, useState } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import type { AppSettings, WorkoutDayDetail } from "@/db/schema"
import { getWorkoutDetailByDate } from "@/db/repositories/workoutsRepo"
import { getSettings } from "@/db/repositories/settingsRepo"
import { useAppStore } from "@/shared/store/appStore"
import {
  formatLongDate,
  shiftLocalDate,
  todayString,
} from "@/shared/model/dates"
import { ActionButton } from "@/shared/ui/ActionButton"
import { ScreenContainer } from "@/shared/ui/ScreenContainer"
import { DateNavRow } from "./DateNavRow"
import { ExerciseCard } from "./ExerciseCard"

export function HomeScreen() {
  const { date } = useParams({ from: "/day/$date" })
  const navigate = useNavigate()
  const refreshVersion = useAppStore((state) => state.refreshVersion)
  const setSelectedDate = useAppStore((state) => state.setSelectedDate)
  const [detail, setDetail] = useState<WorkoutDayDetail>({
    workout: undefined,
    exercises: [],
  })
  const [settings, setSettings] = useState<AppSettings>({
    unitSystem: "metric",
    keepScreenOnDuringTraining: true,
  })
  const [touchStartX, setTouchStartX] = useState<number | undefined>()

  useEffect(() => {
    setSelectedDate(date)
  }, [date, setSelectedDate])

  useEffect(() => {
    let cancelled = false

    Promise.all([getWorkoutDetailByDate(date), getSettings()]).then(
      ([workoutDetail, appSettings]) => {
        if (!cancelled) {
          setDetail(workoutDetail)
          setSettings(appSettings)
        }
      },
    )

    return () => {
      cancelled = true
    }
  }, [date, refreshVersion])

  const navigateToDate = (nextDate: string) => {
    void navigate({ to: "/day/$date", params: { date: nextDate } })
  }

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX === undefined) {
      return
    }

    const delta = clientX - touchStartX

    if (Math.abs(delta) > 60) {
      navigateToDate(shiftLocalDate(date, delta > 0 ? -1 : 1))
    }

    setTouchStartX(undefined)
  }

  return (
    <ScreenContainer
      className="gap-3"
      onTouchStart={(event) => setTouchStartX(event.changedTouches[0].clientX)}
      onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0].clientX)}
    >
      <DateNavRow
        localDate={date || todayString()}
        onNext={() => navigateToDate(shiftLocalDate(date, 1))}
        onPrevious={() => navigateToDate(shiftLocalDate(date, -1))}
      />

      <div className="px-1 text-xs uppercase tracking-normal text-zinc-500">
        {formatLongDate(date)}
      </div>

      {detail.exercises.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-20">
          <ActionButton
            className="max-w-xs"
            tone="save"
            onClick={() => void navigate({ to: "/picker" })}
          >
            Start New Workout
          </ActionButton>
        </div>
      ) : (
        <div className="space-y-3">
          {detail.exercises.map((entry) => (
            <ExerciseCard
              exerciseType={entry.exercise.exerciseType}
              key={entry.workoutExercise.id}
              name={entry.exercise.name}
              sets={entry.sets}
              unitSystem={settings.unitSystem}
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
