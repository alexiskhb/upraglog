import { useEffect, useState } from "react"
import { Outlet, useRouterState } from "@tanstack/react-router"
import { initializeDatabase } from "@/db/db"
import type { AppSettings } from "@/db/schema"
import { getSettings } from "@/db/repositories/settingsRepo"
import { useAppStore } from "@/shared/store/appStore"
import { useScreenWakeLock } from "@/shared/model/wakeLock"
import { BottomMainBar } from "@/shared/ui/BottomMainBar"
import { WorkoutNavigationPanel } from "@/features/workout-navigation/WorkoutNavigationPanel"
import { WorkoutTimerDialog } from "@/features/workout-dialogs/WorkoutTimerDialog"

export function AppShell() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const refreshVersion = useAppStore((state) => state.refreshVersion)
  const setProfileState = useAppStore((state) => state.setProfileState)
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const [settings, setSettings] = useState<AppSettings | undefined>()

  useScreenWakeLock(ready && Boolean(settings?.keepScreenOn))

  useEffect(() => {
    if (pathname.startsWith("/picker") || pathname.startsWith("/exercise/")) {
      return
    }

    const store = useAppStore.getState()
    if (store.replaceWorkoutExerciseId) {
      store.setReplaceWorkoutExerciseId(undefined)
    }
  }, [pathname])

  useEffect(() => {
    let cancelled = false

    initializeDatabase()
      .then(() => {
        if (!cancelled) {
          setReady(true)
        }
      })
      .catch((dbError: unknown) => {
        if (!cancelled) {
          setError(
            dbError instanceof Error
              ? dbError.message
              : "IndexedDB failed to initialize.",
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) {
      return
    }

    let cancelled = false

    getSettings().then((appSettings) => {
      if (!cancelled) {
        setSettings(appSettings)
        setProfileState(appSettings.profiles, appSettings.selectedProfile)
      }
    })

    return () => {
      cancelled = true
    }
  }, [ready, refreshVersion, setProfileState])

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--app-bg)] p-6 text-zinc-100">
        <div className="max-w-sm rounded-md border border-red-400/25 bg-red-500/10 p-4 text-sm shadow-2xl">
          {error}
        </div>
      </main>
    )
  }

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[var(--app-bg)] text-sm uppercase tracking-normal text-cyan-200">
        Loading Upraglog
      </main>
    )
  }

  return (
    <>
      <Outlet />
      <WorkoutNavigationPanel />
      <WorkoutTimerDialog />
      <BottomMainBar />
    </>
  )
}
