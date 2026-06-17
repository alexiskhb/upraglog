import { cn } from "@/lib/utils"

export type WorkoutTimerSize = "compact" | "large"

export function workoutTimerClassName({
  active,
  className,
  size,
}: {
  active: boolean
  className?: string
  size: WorkoutTimerSize
}) {
  return cn(
    "shrink-0 cursor-pointer rounded-sm font-mono font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-2",
    active || size !== "large"
      ? "text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-100 focus-visible:ring-cyan-400"
      : "text-teal-400 hover:bg-teal-400/10 hover:text-teal-200 focus-visible:ring-teal-400",
    size === "large"
      ? "px-1.5 py-0.5 text-3xl leading-9"
      : "px-1 py-0.5 text-xs leading-none",
    className,
  )
}
