import { create } from "zustand"
import { todayString } from "@/shared/model/dates"

export type AppDialog = "timer" | undefined

type AppState = {
  selectedDate: string
  workoutNavOpen: boolean
  activeDialog: AppDialog
  replaceWorkoutExerciseId?: string
  refreshVersion: number
  setSelectedDate: (date: string) => void
  setWorkoutNavOpen: (open: boolean) => void
  openDialog: (dialog: Exclude<AppDialog, undefined>) => void
  closeDialog: () => void
  setReplaceWorkoutExerciseId: (id: string | undefined) => void
  bumpRefresh: () => void
}

export const useAppStore = create<AppState>((set) => ({
  selectedDate: todayString(),
  workoutNavOpen: false,
  activeDialog: undefined,
  replaceWorkoutExerciseId: undefined,
  refreshVersion: 0,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setWorkoutNavOpen: (workoutNavOpen) => set({ workoutNavOpen }),
  openDialog: (activeDialog) => set({ activeDialog }),
  closeDialog: () => set({ activeDialog: undefined }),
  setReplaceWorkoutExerciseId: (replaceWorkoutExerciseId) =>
    set({ replaceWorkoutExerciseId }),
  bumpRefresh: () =>
    set((state) => ({ refreshVersion: state.refreshVersion + 1 })),
}))
