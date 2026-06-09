import { useEffect, useState } from "react"
import { Outlet } from "@tanstack/react-router"
import { initializeDatabase } from "@/db/db"
import { BottomMainBar } from "@/shared/ui/BottomMainBar"
import { WorkoutNavigationPanel } from "@/features/workout-navigation/WorkoutNavigationPanel"
import { ShareWorkoutDialog } from "@/features/workout-dialogs/ShareWorkoutDialog"
import { CopyMoveWorkoutDialog } from "@/features/workout-dialogs/CopyMoveWorkoutDialog"
import { WorkoutTimerDialog } from "@/features/workout-dialogs/WorkoutTimerDialog"

export function AppShell() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | undefined>()

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
        Loading logbook
      </main>
    )
  }

  return (
    <>
      <Outlet />
      <WorkoutNavigationPanel />
      <ShareWorkoutDialog />
      <CopyMoveWorkoutDialog />
      <WorkoutTimerDialog />
      <BottomMainBar />
    </>
  )
}
