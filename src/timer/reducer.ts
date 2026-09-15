import type { TimerState } from '../types'

export type TimerEvent =
  | { type: 'start'; blockId: string; durationSeconds: number; at: number }
  | { type: 'tick'; at: number }
  | { type: 'pause'; at: number }
  | { type: 'resume'; at: number }
  | { type: 'complete'; at: number }
  | { type: 'reset' }
  | { type: 'hydrate'; at: number }
  | { type: 'visibility'; visible: boolean; at: number }

function effectiveTimestamp(at: number, lowerBound = 0): number {
  return Number.isFinite(at) ? Math.max(lowerBound, at) : lowerBound
}

function normalizedDuration(durationSeconds: number): number {
  return Number.isFinite(durationSeconds) ? Math.max(0, Math.floor(durationSeconds)) : 0
}

/**
 * Apply elapsed wall-clock time without counting interval callbacks.
 * The anchor advances in whole seconds so delayed callbacks do not accumulate drift.
 */
export function advanceTimer(state: TimerState, at: number): TimerState {
  if (!state.running) return state

  const timestamp = effectiveTimestamp(at, state.updatedAt)
  const elapsedSeconds = Math.floor((timestamp - state.updatedAt) / 1000)
  if (elapsedSeconds <= 0) return state

  const remainingSeconds = Math.max(0, state.remainingSeconds - elapsedSeconds)
  return {
    ...state,
    remainingSeconds,
    running: remainingSeconds > 0,
    updatedAt: state.updatedAt + elapsedSeconds * 1000,
  }
}

export function getRemainingSeconds(state: TimerState | null, at: number): number {
  if (!state) return 0
  return advanceTimer(state, at).remainingSeconds
}

export function timerReducer(state: TimerState | null, event: TimerEvent): TimerState | null {
  switch (event.type) {
    case 'start': {
      const durationSeconds = normalizedDuration(event.durationSeconds)
      return {
        blockId: event.blockId,
        remainingSeconds: durationSeconds,
        running: durationSeconds > 0,
        updatedAt: effectiveTimestamp(event.at),
      }
    }

    case 'tick':
    case 'hydrate':
      return state ? advanceTimer(state, event.at) : null

    case 'pause': {
      if (!state) return null
      const advanced = advanceTimer(state, event.at)
      if (!advanced.running) return advanced
      return {
        ...advanced,
        running: false,
        updatedAt: effectiveTimestamp(event.at, advanced.updatedAt),
      }
    }

    case 'resume': {
      if (!state) return null
      const advanced = advanceTimer(state, event.at)
      if (advanced.remainingSeconds <= 0) return advanced
      return {
        ...advanced,
        running: true,
        updatedAt: effectiveTimestamp(event.at, advanced.updatedAt),
      }
    }

    case 'complete': {
      if (!state || (state.remainingSeconds === 0 && !state.running)) return state
      const advanced = advanceTimer(state, event.at)
      return {
        ...advanced,
        remainingSeconds: 0,
        running: false,
        updatedAt: effectiveTimestamp(event.at, advanced.updatedAt),
      }
    }

    case 'reset':
      return null

    case 'visibility':
      // Hidden tabs may throttle timers; visible resumes reconcile against the clock.
      return state && event.visible ? advanceTimer(state, event.at) : state
  }
}
