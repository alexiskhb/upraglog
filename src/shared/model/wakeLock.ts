import { useEffect } from "react"

type WakeLockSentinel = {
  release: () => Promise<void>
}

type WakeLockNavigator = Navigator & {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinel>
  }
}

export function useScreenWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined") {
      return
    }

    let cancelled = false
    let sentinel: WakeLockSentinel | undefined
    const wakeLockNavigator = navigator as WakeLockNavigator

    const releaseWakeLock = () => {
      void sentinel?.release().catch(() => undefined)
      sentinel = undefined
    }

    const requestWakeLock = async () => {
      if (cancelled || document.visibilityState !== "visible") {
        return
      }

      try {
        sentinel = await wakeLockNavigator.wakeLock?.request("screen")
      } catch {
        sentinel = undefined
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock()
        return
      }

      releaseWakeLock()
    }

    void requestWakeLock()
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      releaseWakeLock()
    }
  }, [enabled])
}
