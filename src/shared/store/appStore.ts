import { create } from "zustand"
import { todayString } from "@/shared/model/dates"
import { createDefaultAppSettings } from "@/shared/model/settings"

export type AppDialog = "timer" | undefined

type AppState = {
  selectedDate: string
  profiles: string[]
  selectedProfile: string
  workoutNavOpen: boolean
  activeDialog: AppDialog
  replaceWorkoutExerciseId?: string
  refreshVersion: number
  setSelectedDate: (date: string) => void
  setProfiles: (profiles: string[]) => void
  setSelectedProfile: (profile: string) => void
  setProfileState: (profiles: string[], selectedProfile: string) => void
  setWorkoutNavOpen: (open: boolean) => void
  closeTaskUi: () => void
  openDialog: (dialog: Exclude<AppDialog, undefined>) => void
  closeDialog: () => void
  setReplaceWorkoutExerciseId: (id: string | undefined) => void
  bumpRefresh: () => void
}

const initialAppSettings = createDefaultAppSettings()

export const useAppStore = create<AppState>((set) => ({
  selectedDate: todayString(),
  profiles: [...initialAppSettings.profiles],
  selectedProfile: initialAppSettings.selectedProfile,
  workoutNavOpen: false,
  activeDialog: undefined,
  replaceWorkoutExerciseId: undefined,
  refreshVersion: 0,
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setProfiles: (profiles) => set({ profiles }),
  setSelectedProfile: (selectedProfile) => set({ selectedProfile }),
  setProfileState: (profiles, selectedProfile) =>
    set({ profiles, selectedProfile }),
  setWorkoutNavOpen: (workoutNavOpen) => set({ workoutNavOpen }),
  closeTaskUi: () => set({ workoutNavOpen: false, activeDialog: undefined }),
  openDialog: (activeDialog) => set({ activeDialog }),
  closeDialog: () => set({ activeDialog: undefined }),
  setReplaceWorkoutExerciseId: (replaceWorkoutExerciseId) =>
    set({ replaceWorkoutExerciseId }),
  bumpRefresh: () =>
    set((state) => ({ refreshVersion: state.refreshVersion + 1 })),
}))
