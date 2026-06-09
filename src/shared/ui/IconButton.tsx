import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  active?: boolean
}

export function IconButton({
  className,
  children,
  active = false,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm text-zinc-100 transition hover:bg-zinc-800 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50",
        active && "bg-cyan-500/15 text-cyan-300",
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}
