import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

type ActionButtonTone = "save" | "secondary" | "delete" | "neutral"

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ActionButtonTone
  children: ReactNode
}

const toneClassNames: Record<ActionButtonTone, string> = {
  save: "bg-emerald-600 text-white hover:bg-emerald-500",
  secondary: "bg-sky-700 text-white hover:bg-sky-600",
  delete: "bg-red-700 text-white hover:bg-red-600",
  neutral: "bg-zinc-700 text-white hover:bg-zinc-600",
}

export function ActionButton({
  tone = "neutral",
  className,
  children,
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={cn(
        "h-11 flex-1 rounded-sm px-4 text-sm font-semibold uppercase tracking-normal transition disabled:pointer-events-none disabled:opacity-50",
        toneClassNames[tone],
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}
