export const TIMER_TICK_MS = 1000

export interface TimerClock {
  now: () => number
  setInterval: (callback: () => void, delay: number) => number
  clearInterval: (handle: number) => void
  subscribeVisibility: (listener: (visible: boolean) => void) => () => void
}

export const browserClock: TimerClock = {
  now: () => Date.now(),
  setInterval: (callback, delay) => window.setInterval(callback, delay),
  clearInterval: (handle) => window.clearInterval(handle),
  subscribeVisibility: (listener) => {
    if (typeof document === 'undefined') return () => undefined

    const handleVisibilityChange = () => {
      listener(document.visibilityState === 'visible')
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  },
}
