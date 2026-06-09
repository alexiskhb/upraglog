import type { HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

type ScreenContainerProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
}

export function ScreenContainer({
  children,
  className,
  ...props
}: ScreenContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-2xl flex-col bg-[#090b0d] px-3 pb-24 pt-3 text-zinc-100 sm:px-4",
        className,
      )}
      {...props}
    >
      {children}
    </main>
  )
}
