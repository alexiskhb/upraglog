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
        "inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-zinc-100 transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
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
