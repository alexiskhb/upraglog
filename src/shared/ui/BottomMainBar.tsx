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
import { useNavigate, useRouterState } from "@tanstack/react-router"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppStore } from "@/shared/store/appStore"
import { todayString } from "@/shared/model/dates"
import { IconButton } from "./IconButton"

export function BottomMainBar() {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const selectedDate = useAppStore((state) => state.selectedDate)
  const setWorkoutNavOpen = useAppStore((state) => state.setWorkoutNavOpen)
  const openDialog = useAppStore((state) => state.openDialog)

  const goToDay = () => {
    void navigate({
      to: "/day/$date",
      params: { date: selectedDate || todayString() },
    })
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cyan-500/25 bg-[#111418]/95 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-2xl grid-cols-5 items-center px-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton title="Choose profile">
              <UserCircle className="size-6" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-52 border-zinc-800 bg-[#171a1f] text-zinc-100"
          >
            <DropdownMenuLabel>Local Profile</DropdownMenuLabel>
            <DropdownMenuItem className="focus:bg-cyan-500/15">
              Default profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="focus:bg-cyan-500/15">
              Profile selection is local-only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <IconButton
          active={pathname.startsWith("/calendar")}
          title="Calendar"
          onClick={() => void navigate({ to: "/calendar" })}
        >
          <CalendarDays className="size-6" />
        </IconButton>

        <IconButton
          title="Workout list"
          onClick={() => {
            goToDay()
            setWorkoutNavOpen(true)
          }}
        >
          <ListChecks className="size-6" />
        </IconButton>

        <IconButton
          active={pathname.startsWith("/picker")}
          title="Add exercise"
          onClick={() => void navigate({ to: "/picker" })}
        >
          <Plus className="size-7" />
        </IconButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton title="More actions">
              <MoreVertical className="size-6" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-zinc-800 bg-[#171a1f] text-zinc-100"
          >
            <DropdownMenuItem
              className="gap-2 focus:bg-cyan-500/15"
              onSelect={() => void navigate({ to: "/settings" })}
            >
              <Settings className="size-4 text-cyan-300" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              className="gap-2 focus:bg-cyan-500/15"
              onSelect={() => openDialog("timer")}
            >
              <Clock3 className="size-4 text-cyan-300" />
              Time Workout
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 focus:bg-cyan-500/15"
              onSelect={() => openDialog("share")}
            >
              <Share2 className="size-4 text-cyan-300" />
              Share Workout
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 focus:bg-cyan-500/15"
              onSelect={() => openDialog("copyMove")}
            >
              <Copy className="size-4 text-cyan-300" />
              Copy/Move Workout
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              className="gap-2 focus:bg-cyan-500/15"
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
