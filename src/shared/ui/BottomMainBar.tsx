import {
  CalendarDays,
  Check,
  Clock3,
  House,
  ListPlus,
  ListChecks,
  MoreVertical,
  Plus,
  Share2,
  Settings,
  UserCircle,
} from "lucide-react"
import { type MutableRefObject, useEffect, useRef, useState } from "react"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSettings, updateSettings } from "@/db/repositories/settingsRepo"
import { useAppStore } from "@/shared/store/appStore"
import { todayString } from "@/shared/model/dates"
import { AddExercisesDialog } from "@/features/workout-navigation/AddExercisesDialog"
import { defaultAppSettings } from "@/shared/model/settings"
import { shareTrainingLogCsv } from "@/features/backup/shareTrainingLogCsv"
import { cn } from "@/lib/utils"
import { IconButton } from "./IconButton"

const bottomBarButtonClassName = "h-full w-full rounded-none"
const bottomBarMenuTriggerClassName =
  "text-zinc-400 hover:bg-transparent data-[state=open]:bg-cyan-400/15 data-[state=open]:text-cyan-200 data-[state=open]:shadow-[inset_0_0_0_1px_rgba(34,211,238,0.18)]"
const bottomBarMenuContentClassName =
  "z-[80] rounded-md border-white/10 bg-[#1a1d22] p-2 text-base text-zinc-100 shadow-xl"
const bottomBarMenuItemClassName =
  "min-h-12 gap-3 rounded-md px-3 py-3 text-base focus:bg-cyan-400/15"

export function BottomMainBar() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [addExercisesOpen, setAddExercisesOpen] = useState(false)
  const [addShareShortcutToMenu, setAddShareShortcutToMenu] = useState(
    defaultAppSettings.addShareShortcutToMenu,
  )
  const contextualReturnHrefRef = useRef<string | undefined>(undefined)
  const profileTriggerRef = useRef<HTMLButtonElement>(null)
  const moreTriggerRef = useRef<HTMLButtonElement>(null)
  const profilePointerOpenRef = useRef(false)
  const morePointerOpenRef = useRef(false)
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const currentHref = useRouterState({
    select: (state) => state.location.href,
  })
  const selectedDate = useAppStore((state) => state.selectedDate)
  const profiles =
    useAppStore((state) => state.profiles) ?? defaultAppSettings.profiles
  const selectedProfile =
    useAppStore((state) => state.selectedProfile) ??
    defaultAppSettings.selectedProfile
  const setProfileState = useAppStore((state) => state.setProfileState)
  const workoutNavOpen = useAppStore((state) => state.workoutNavOpen)
  const setWorkoutNavOpen = useAppStore((state) => state.setWorkoutNavOpen)
  const closeTaskUi = useAppStore((state) => state.closeTaskUi)
  const openDialog = useAppStore((state) => state.openDialog)
  const refreshVersion = useAppStore((state) => state.refreshVersion)
  const bumpRefresh = useAppStore((state) => state.bumpRefresh)
  const setReplaceWorkoutExerciseId = useAppStore(
    (state) => state.setReplaceWorkoutExerciseId,
  )
  const selectedOrToday = selectedDate || todayString()
  const calendarActive = pathname.startsWith("/calendar")
  const pickerActive =
    pathname.startsWith("/picker") || pathname.startsWith("/exercise/")
  const contextualRouteActive = calendarActive || pickerActive

  useEffect(() => {
    if (!contextualRouteActive && !workoutNavOpen) {
      contextualReturnHrefRef.current = undefined
    }
  }, [contextualRouteActive, currentHref, workoutNavOpen])

  useEffect(() => {
    let cancelled = false

    getSettings().then((settings) => {
      if (!cancelled) {
        setAddShareShortcutToMenu(settings.addShareShortcutToMenu)
      }
    })

    return () => {
      cancelled = true
    }
  }, [refreshVersion])

  const navigateToSelectedDay = () => {
    void navigate({
      to: "/day/$date",
      params: { date: selectedOrToday },
    })
  }

  const closeTaskSurface = () => {
    setReplaceWorkoutExerciseId(undefined)
    closeTaskUi()
    setProfileMenuOpen(false)
    setMoreMenuOpen(false)

    const returnHref = contextualReturnHrefRef.current
    contextualReturnHrefRef.current = undefined

    if (returnHref && returnHref !== currentHref) {
      void navigate({ href: returnHref })
      return
    }

    navigateToSelectedDay()
  }

  const openTaskRoute = (to: "/calendar" | "/picker") => {
    setReplaceWorkoutExerciseId(undefined)
    closeTaskUi()
    setProfileMenuOpen(false)
    setMoreMenuOpen(false)
    contextualReturnHrefRef.current ??= currentHref
    void navigate({ to })
  }

  const goToDay = () => {
    contextualReturnHrefRef.current = undefined
    setReplaceWorkoutExerciseId(undefined)
    closeTaskUi()
    setProfileMenuOpen(false)
    setMoreMenuOpen(false)
    navigateToSelectedDay()
  }

  const selectProfile = async (profileName: string) => {
    const updated = await updateSettings({ selectedProfile: profileName })

    setProfileState(updated.profiles, updated.selectedProfile)
    setReplaceWorkoutExerciseId(undefined)
    closeTaskUi()
    setProfileMenuOpen(false)
    bumpRefresh()

    if (pathname.startsWith("/training")) {
      navigateToSelectedDay()
    }
  }

  const toggleCalendar = () => {
    if (calendarActive) {
      closeTaskSurface()
      return
    }

    openTaskRoute("/calendar")
  }

  const toggleWorkoutList = () => {
    setReplaceWorkoutExerciseId(undefined)
    setProfileMenuOpen(false)
    setMoreMenuOpen(false)

    if (workoutNavOpen) {
      closeTaskUi()
      return
    }

    closeTaskUi()
    setWorkoutNavOpen(true)
  }

  const toggleExercisePicker = () => {
    if (pickerActive) {
      closeTaskSurface()
      return
    }

    openTaskRoute("/picker")
  }

  const shareSpreadsheet = async () => {
    closeTaskUi()
    setProfileMenuOpen(false)
    setMoreMenuOpen(false)

    try {
      await shareTrainingLogCsv()
    } catch {
      window.alert("Spreadsheet could not be shared.")
    }
  }

  const handlePointerCloseAutoFocus = (
    event: Event,
    trigger: HTMLButtonElement | null,
    pointerOpenRef: MutableRefObject<boolean>,
  ) => {
    if (!pointerOpenRef.current) {
      return
    }

    event.preventDefault()
    trigger?.blur()
    pointerOpenRef.current = false
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#111418]/92 shadow-[0_-16px_36px_rgba(0,0,0,0.42)] backdrop-blur-md">
        <div className="grid h-16 w-full grid-cols-5 items-stretch">
        <DropdownMenu
          open={profileMenuOpen}
          onOpenChange={(open) => {
            setProfileMenuOpen(open)
            if (open) {
              setMoreMenuOpen(false)
              closeTaskUi()
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <IconButton
              className={cn(
                bottomBarButtonClassName,
                bottomBarMenuTriggerClassName,
              )}
              ref={profileTriggerRef}
              title={`Choose profile: ${selectedProfile}`}
              onKeyDown={() => {
                profilePointerOpenRef.current = false
              }}
              onPointerDown={() => {
                profilePointerOpenRef.current = true
              }}
            >
              <UserCircle className="size-6" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            sideOffset={12}
            collisionPadding={12}
            className={cn(bottomBarMenuContentClassName, "w-64")}
            onCloseAutoFocus={(event) =>
              handlePointerCloseAutoFocus(
                event,
                profileTriggerRef.current,
                profilePointerOpenRef,
              )
            }
          >
            {profiles.map((profileName) => (
              <DropdownMenuItem
                className={bottomBarMenuItemClassName}
                key={profileName}
                onSelect={() => void selectProfile(profileName)}
              >
                <Check
                  className={cn(
                    "size-5 text-cyan-300",
                    profileName !== selectedProfile && "opacity-0",
                  )}
                />
                <span className="min-w-0 truncate">{profileName}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <IconButton
          active={calendarActive && !profileMenuOpen && !moreMenuOpen}
          className={bottomBarButtonClassName}
          title="Calendar"
          onClick={toggleCalendar}
        >
          <CalendarDays className="size-6" />
        </IconButton>

        <IconButton
          active={workoutNavOpen && !profileMenuOpen && !moreMenuOpen}
          className={bottomBarButtonClassName}
          title="Workout list"
          onClick={toggleWorkoutList}
        >
          <ListChecks className="size-6" />
        </IconButton>

        <IconButton
          active={pickerActive && !profileMenuOpen && !moreMenuOpen}
          className={bottomBarButtonClassName}
          title="Add exercise"
          onClick={toggleExercisePicker}
        >
          <Plus className="size-7" />
        </IconButton>

        <DropdownMenu
          open={moreMenuOpen}
          onOpenChange={(open) => {
            setMoreMenuOpen(open)
            if (open) {
              setProfileMenuOpen(false)
              closeTaskUi()
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <IconButton
              className={cn(
                bottomBarButtonClassName,
                bottomBarMenuTriggerClassName,
              )}
              ref={moreTriggerRef}
              title="More actions"
              onKeyDown={() => {
                morePointerOpenRef.current = false
              }}
              onPointerDown={() => {
                morePointerOpenRef.current = true
              }}
            >
              <MoreVertical className="size-6" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            sideOffset={12}
            collisionPadding={12}
            className={cn(bottomBarMenuContentClassName, "w-64")}
            onCloseAutoFocus={(event) =>
              handlePointerCloseAutoFocus(
                event,
                moreTriggerRef.current,
                morePointerOpenRef,
              )
            }
          >
            <DropdownMenuItem
              className={bottomBarMenuItemClassName}
              onSelect={() => {
                setReplaceWorkoutExerciseId(undefined)
                closeTaskUi()
                void navigate({ to: "/settings" })
              }}
            >
              <Settings className="size-5 text-cyan-300" />
              Settings
            </DropdownMenuItem>
            {addShareShortcutToMenu && (
              <>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  className={bottomBarMenuItemClassName}
                  onSelect={() => void shareSpreadsheet()}
                >
                  <Share2 className="size-5 text-cyan-300" />
                  Share...
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className={bottomBarMenuItemClassName}
              onSelect={() => {
                closeTaskUi()
                openDialog("timer")
              }}
            >
              <Clock3 className="size-5 text-cyan-300" />
              Time Workout
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className={bottomBarMenuItemClassName}
              onSelect={() => {
                closeTaskUi()
                setAddExercisesOpen(true)
              }}
            >
              <ListPlus className="size-5 text-cyan-300" />
              Add Exercises
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className={bottomBarMenuItemClassName}
              onSelect={goToDay}
            >
              <House className="size-5 text-cyan-300" />
              Home
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </nav>
      <AddExercisesDialog
        localDate={selectedOrToday}
        open={addExercisesOpen}
        profileName={selectedProfile}
        onAdded={() => {
          bumpRefresh()
          navigateToSelectedDay()
        }}
        onOpenChange={setAddExercisesOpen}
      />
    </>
  )
}
