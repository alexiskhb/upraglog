import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

type ActionButtonTone = "save" | "secondary" | "delete" | "neutral"

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ActionButtonTone
  children: ReactNode
}

const toneClassNames: Record<ActionButtonTone, string> = {
  save: "bg-teal-400 text-slate-950 shadow-[0_10px_28px_rgba(45,212,191,0.18)] hover:bg-teal-300",
  secondary: "bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/25 hover:bg-sky-500/25",
  delete: "bg-red-500/20 text-red-100 ring-1 ring-red-400/25 hover:bg-red-500/25",
  neutral: "bg-white/10 text-zinc-100 ring-1 ring-white/10 hover:bg-white/15",
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
        "h-11 flex-1 cursor-pointer rounded-md px-4 text-sm font-semibold uppercase tracking-normal transition active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
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
