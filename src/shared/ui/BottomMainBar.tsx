import {
  CalendarDays,
  Clock3,
  Copy,
  Dumbbell,
  ListChecks,
  MoreVertical,
  Plus,
  Settings,
  Share2,
  UserCircle,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppStore } from "@/shared/store/appStore"
import { todayString } from "@/shared/model/dates"
import { IconButton } from "./IconButton"

export function BottomMainBar() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const contextualReturnHrefRef = useRef<string | undefined>(undefined)
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const currentHref = useRouterState({
    select: (state) => state.location.href,
  })
  const selectedDate = useAppStore((state) => state.selectedDate)
  const workoutNavOpen = useAppStore((state) => state.workoutNavOpen)
  const setWorkoutNavOpen = useAppStore((state) => state.setWorkoutNavOpen)
  const openDialog = useAppStore((state) => state.openDialog)
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

  const navigateToSelectedDay = () => {
    void navigate({
      to: "/day/$date",
      params: { date: selectedOrToday },
    })
  }

  const closeTaskSurface = () => {
    setReplaceWorkoutExerciseId(undefined)
    setWorkoutNavOpen(false)
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
    setWorkoutNavOpen(false)
    setProfileMenuOpen(false)
    setMoreMenuOpen(false)
    contextualReturnHrefRef.current ??= currentHref
    void navigate({ to })
  }

  const goToDay = () => {
    contextualReturnHrefRef.current = undefined
    setReplaceWorkoutExerciseId(undefined)
    setWorkoutNavOpen(false)
    setProfileMenuOpen(false)
    setMoreMenuOpen(false)
    navigateToSelectedDay()
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
      setWorkoutNavOpen(false)
      return
    }

    setWorkoutNavOpen(true)
  }

  const toggleExercisePicker = () => {
    if (pickerActive) {
      closeTaskSurface()
      return
    }

    openTaskRoute("/picker")
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/10 bg-[#111418]/92 shadow-[0_-16px_36px_rgba(0,0,0,0.42)] backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-2xl grid-cols-5 items-center px-4">
        <DropdownMenu
          open={profileMenuOpen}
          onOpenChange={(open) => {
            setProfileMenuOpen(open)
            if (open) {
              setMoreMenuOpen(false)
              setWorkoutNavOpen(false)
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <IconButton className="text-zinc-400" title="Choose profile">
              <UserCircle className="size-6" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-52 rounded-md border-white/10 bg-[#1a1d22] text-zinc-100 shadow-xl"
          >
            <DropdownMenuItem disabled className="focus:bg-transparent">
              Default profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <IconButton
          active={calendarActive && !profileMenuOpen && !moreMenuOpen}
          title="Calendar"
          onClick={toggleCalendar}
        >
          <CalendarDays className="size-6" />
        </IconButton>

        <IconButton
          active={workoutNavOpen && !profileMenuOpen && !moreMenuOpen}
          title="Workout list"
          onClick={toggleWorkoutList}
        >
          <ListChecks className="size-6" />
        </IconButton>

        <IconButton
          active={pickerActive && !profileMenuOpen && !moreMenuOpen}
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
              setWorkoutNavOpen(false)
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <IconButton className="text-zinc-400" title="More actions">
              <MoreVertical className="size-6" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-md border-white/10 bg-[#1a1d22] text-zinc-100 shadow-xl"
          >
            <DropdownMenuItem
              className="gap-2 rounded-md focus:bg-cyan-400/15"
              onSelect={() => {
                setReplaceWorkoutExerciseId(undefined)
                setWorkoutNavOpen(false)
                void navigate({ to: "/settings" })
              }}
            >
              <Settings className="size-4 text-cyan-300" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="gap-2 rounded-md focus:bg-cyan-400/15"
              onSelect={() => {
                setWorkoutNavOpen(false)
                openDialog("timer")
              }}
            >
              <Clock3 className="size-4 text-cyan-300" />
              Time Workout
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 rounded-md focus:bg-cyan-400/15"
              onSelect={() => {
                setWorkoutNavOpen(false)
                openDialog("share")
              }}
            >
              <Share2 className="size-4 text-cyan-300" />
              Share Workout
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 rounded-md focus:bg-cyan-400/15"
              onSelect={() => {
                setWorkoutNavOpen(false)
                openDialog("copyMove")
              }}
            >
              <Copy className="size-4 text-cyan-300" />
              Copy/Move Workout
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              className="gap-2 rounded-md focus:bg-cyan-400/15"
              onSelect={goToDay}
            >
              <Dumbbell className="size-4 text-cyan-300" />
              Daily Log
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
