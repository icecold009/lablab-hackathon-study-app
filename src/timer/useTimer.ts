import { useCallback, useEffect, useRef } from 'react'
import type { TimerState } from '../types'
import { browserClock, TIMER_TICK_MS, type TimerClock } from './clock'
import { timerReducer, type TimerEvent } from './reducer'

export type TimerStateSetter = (value: TimerState | null | ((previous: TimerState | null) => TimerState | null)) => void

export type TimerCommand =
  | { type: 'start'; blockId: string; durationSeconds: number }
  | { type: 'tick' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'complete' }
  | { type: 'reset' }
  | { type: 'hydrate' }
  | { type: 'visibility'; visible: boolean }

export interface TimerController {
  dispatch: (command: TimerCommand) => void
  start: (blockId: string, durationSeconds: number) => void
  toggle: (blockId: string, durationSeconds: number) => void
  pause: () => void
  resume: () => void
  complete: () => void
  reset: () => void
  hydrate: () => void
}

function toTimerEvent(command: TimerCommand, at: number): TimerEvent {
  if (command.type === 'reset') return command
  return { ...command, at } as TimerEvent
}

export function useTimer(
  state: TimerState | null,
  setState: TimerStateSetter,
  clock: TimerClock = browserClock,
): TimerController {
  const hydratedRef = useRef(false)

  const dispatch = useCallback((command: TimerCommand) => {
    setState((previous) => timerReducer(previous, toTimerEvent(command, clock.now())))
  }, [clock, setState])

  const start = useCallback((blockId: string, durationSeconds: number) => {
    dispatch({ type: 'start', blockId, durationSeconds })
  }, [dispatch])

  const toggle = useCallback((blockId: string, durationSeconds: number) => {
    const at = clock.now()
    setState((previous) => {
      if (previous?.blockId !== blockId) {
        return timerReducer(previous, { type: 'start', blockId, durationSeconds, at })
      }
      return timerReducer(previous, { type: previous.running ? 'pause' : 'resume', at })
    })
  }, [clock, setState])

  const pause = useCallback(() => dispatch({ type: 'pause' }), [dispatch])
  const resume = useCallback(() => dispatch({ type: 'resume' }), [dispatch])
  const complete = useCallback(() => dispatch({ type: 'complete' }), [dispatch])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [dispatch])
  const hydrate = useCallback(() => dispatch({ type: 'hydrate' }), [dispatch])

  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    if (!state) return
    hydrate()
  }, [hydrate, state])

  useEffect(() => {
    if (!state?.running) return

    const interval = clock.setInterval(() => dispatch({ type: 'tick' }), TIMER_TICK_MS)
    const unsubscribeVisibility = clock.subscribeVisibility((visible) => {
      dispatch({ type: 'visibility', visible })
    })

    return () => {
      clock.clearInterval(interval)
      unsubscribeVisibility()
    }
  }, [clock, dispatch, state?.running])

  return { dispatch, start, toggle, pause, resume, complete, reset, hydrate }
}
