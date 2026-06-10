import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  active?: boolean
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ className, children, active = false, ...props }, ref) {
    return (
      <button
        aria-pressed={active}
        className={cn(
          "inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-md text-zinc-100 transition hover:bg-white/10 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50",
          active && "bg-cyan-400/15 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.18)]",
          className,
        )}
        ref={ref}
        type="button"
        {...props}
      >
        {children}
      </button>
    )
  },
)
