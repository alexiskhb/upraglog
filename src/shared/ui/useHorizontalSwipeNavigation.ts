import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react"

type SwipeDirection = -1 | 1

type SwipeNavigationOptions = {
  canNavigate: (direction: SwipeDirection) => boolean
  onNavigate: (direction: SwipeDirection) => void
  shouldStart?: (target: EventTarget | null) => boolean
  allowMouse?: boolean
  axisRatio?: number
  commitPx?: number
  edgeResistance?: number
  exitDurationMs?: number
  intentPx?: number
  snapDurationMs?: number
}

type SwipeStart = {
  x: number
  y: number
  pointerId: number
  swiping: boolean
  width: number
}

type SwipeSurface = {
  deltaX: number
  transitionMs: number
}

const defaultAxisRatio = 1.35
const defaultCommitPx = 72
const defaultEdgeResistance = 0.24
const defaultExitDurationMs = 180
const defaultIntentPx = 18
const defaultSnapDurationMs = 180

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function directionFromDelta(deltaX: number): SwipeDirection {
  return deltaX > 0 ? -1 : 1
}

function exitDeltaForDirection(direction: SwipeDirection, width: number) {
  return direction > 0 ? -width : width
}

export function useHorizontalSwipeNavigation({
  allowMouse = false,
  axisRatio = defaultAxisRatio,
  canNavigate,
  commitPx = defaultCommitPx,
  edgeResistance = defaultEdgeResistance,
  exitDurationMs = defaultExitDurationMs,
  intentPx = defaultIntentPx,
  onNavigate,
  shouldStart,
  snapDurationMs = defaultSnapDurationMs,
}: SwipeNavigationOptions) {
  const swipeStartRef = useRef<SwipeStart | undefined>(undefined)
  const timeoutRef = useRef<number | undefined>(undefined)
  const clickTimeoutRef = useRef<number | undefined>(undefined)
  const suppressClickRef = useRef(false)
  const [surface, setSurface] = useState<SwipeSurface>({
    deltaX: 0,
    transitionMs: 0,
  })

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) {
        window.clearTimeout(timeoutRef.current)
      }
      if (clickTimeoutRef.current !== undefined) {
        window.clearTimeout(clickTimeoutRef.current)
      }
    }
  }, [])

  const clearAnimationTimeout = () => {
    if (timeoutRef.current !== undefined) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }

  const resetAfter = (durationMs: number) => {
    clearAnimationTimeout()
    timeoutRef.current = window.setTimeout(() => {
      setSurface({ deltaX: 0, transitionMs: 0 })
      timeoutRef.current = undefined
    }, durationMs)
  }

  const suppressNextClick = () => {
    suppressClickRef.current = true

    if (clickTimeoutRef.current !== undefined) {
      window.clearTimeout(clickTimeoutRef.current)
    }

    clickTimeoutRef.current = window.setTimeout(() => {
      suppressClickRef.current = false
      clickTimeoutRef.current = undefined
    }, 350)
  }

  const displayedDelta = (deltaX: number) => {
    const direction = directionFromDelta(deltaX)

    if (!canNavigate(direction)) {
      return deltaX * edgeResistance
    }

    const width = swipeStartRef.current?.width ?? window.innerWidth
    const maxDrag = Math.max(width * 0.58, commitPx)

    return Math.max(-maxDrag, Math.min(maxDrag, deltaX))
  }

  const settleBack = () => {
    if (prefersReducedMotion()) {
      setSurface({ deltaX: 0, transitionMs: 0 })
      return
    }

    setSurface({ deltaX: 0, transitionMs: snapDurationMs })
    resetAfter(snapDurationMs)
  }

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.pointerType === "mouse" && !allowMouse)) {
      return
    }

    if (shouldStart && !shouldStart(event.target)) {
      return
    }

    clearAnimationTimeout()
    swipeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
      swiping: false,
      width: event.currentTarget.clientWidth || window.innerWidth,
    }
    setSurface({ deltaX: 0, transitionMs: 0 })

    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Some browsers can reject capture during interrupted gestures.
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const swipeStart = swipeStartRef.current

    if (!swipeStart || swipeStart.pointerId !== event.pointerId) {
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
      return
    }

    if (
      !swipeStart.swiping &&
      (Math.abs(deltaX) < intentPx ||
        Math.abs(deltaX) < Math.abs(deltaY) * axisRatio)
    ) {
      return
    }

    swipeStart.swiping = true
    suppressNextClick()
    event.preventDefault()
    setSurface({ deltaX: displayedDelta(deltaX), transitionMs: 0 })
  }

  const handlePointerEnd = (event: PointerEvent<HTMLElement>) => {
    const swipeStart = swipeStartRef.current
    swipeStartRef.current = undefined

    if (!swipeStart || swipeStart.pointerId !== event.pointerId) {
      return
    }

    const deltaX = event.clientX - swipeStart.x
    const deltaY = event.clientY - swipeStart.y
    const direction = directionFromDelta(deltaX)
    const committed =
      swipeStart.swiping &&
      Math.abs(deltaX) >= commitPx &&
      Math.abs(deltaX) > Math.abs(deltaY) * axisRatio &&
      canNavigate(direction)

    if (swipeStart.swiping) {
      suppressNextClick()
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Capture may already have been released by the browser.
    }

    if (!committed) {
      if (swipeStart.swiping) {
        settleBack()
      }
      return
    }

    if (prefersReducedMotion()) {
      setSurface({ deltaX: 0, transitionMs: 0 })
      onNavigate(direction)
      return
    }

    clearAnimationTimeout()
    setSurface({
      deltaX: exitDeltaForDirection(direction, swipeStart.width),
      transitionMs: exitDurationMs,
    })
    timeoutRef.current = window.setTimeout(() => {
      onNavigate(direction)
      setSurface({ deltaX: 0, transitionMs: 0 })
      timeoutRef.current = undefined
    }, exitDurationMs)
  }

  const handlePointerCancel = () => {
    if (swipeStartRef.current?.swiping) {
      suppressNextClick()
      settleBack()
    }

    swipeStartRef.current = undefined
  }

  const handleClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) {
      return
    }

    suppressClickRef.current = false
    if (clickTimeoutRef.current !== undefined) {
      window.clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = undefined
    }
    event.preventDefault()
    event.stopPropagation()
  }

  const style: CSSProperties = {
    touchAction: "pan-y",
    transform:
      surface.deltaX === 0 ? undefined : `translate3d(${surface.deltaX}px,0,0)`,
    transition:
      surface.transitionMs === 0
        ? undefined
        : `transform ${surface.transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
    willChange:
      surface.deltaX !== 0 || surface.transitionMs !== 0
        ? "transform"
        : undefined,
  }

  return {
    onClickCapture: handleClickCapture,
    onPointerCancel: handlePointerCancel,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    style,
  }
}
