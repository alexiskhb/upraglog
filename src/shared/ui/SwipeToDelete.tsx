import {
  forwardRef,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
  useRef,
  useState,
} from "react"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

type SwipeToDeleteProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onDelete: () => void | Promise<void>
}

const deleteThreshold = 72
const maxSwipeOffset = 108

export const SwipeToDelete = forwardRef<HTMLDivElement, SwipeToDeleteProps>(
  function SwipeToDelete({ children, className, style, onDelete }, ref) {
    const [offset, setOffset] = useState(0)
    const offsetRef = useRef(0)
    const swipeStartRef = useRef<
      | {
          x: number
          y: number
          swiping: boolean
        }
      | undefined
    >(undefined)
    const suppressClickRef = useRef(false)

    const setSwipeOffset = (nextOffset: number) => {
      offsetRef.current = nextOffset
      setOffset(nextOffset)
    }

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return
      }

      swipeStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        swiping: false,
      }
    }

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
      const swipeStart = swipeStartRef.current

      if (!swipeStart) {
        return
      }

      const deltaX = event.clientX - swipeStart.x
      const deltaY = event.clientY - swipeStart.y

      if (
        !swipeStart.swiping &&
        Math.abs(deltaY) > 10 &&
        Math.abs(deltaY) > Math.abs(deltaX)
      ) {
        swipeStartRef.current = undefined
        setSwipeOffset(0)
        return
      }

      if (deltaX >= -8 && !swipeStart.swiping) {
        return
      }

      swipeStart.swiping = true
      event.preventDefault()
      setSwipeOffset(Math.max(-maxSwipeOffset, Math.min(0, deltaX)))
    }

    const handlePointerEnd = () => {
      const swipeStart = swipeStartRef.current
      swipeStartRef.current = undefined

      if (!swipeStart?.swiping) {
        return
      }

      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 0)

      if (offsetRef.current <= -deleteThreshold) {
        setSwipeOffset(-maxSwipeOffset)
        void onDelete()
        return
      }

      setSwipeOffset(0)
    }

    return (
      <div
        className={cn(
          "relative overflow-hidden bg-[var(--app-surface)]",
          className,
        )}
        ref={ref}
        style={{ ...style, touchAction: "pan-y" }}
        onClickCapture={(event) => {
          if (suppressClickRef.current) {
            event.preventDefault()
            event.stopPropagation()
          }
        }}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
      >
        <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-end gap-2 bg-red-500/25 px-4 text-sm font-semibold text-red-100">
          <Trash2 className="size-4" />
          Delete
        </div>
        <div
          className="relative bg-[var(--app-surface)] transition-transform"
          style={{ transform: `translateX(${offset}px)` }}
        >
          {children}
        </div>
      </div>
    )
  },
)
