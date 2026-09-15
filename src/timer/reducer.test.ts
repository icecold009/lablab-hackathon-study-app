import { describe, expect, it } from 'vitest'
import type { TimerState } from '../types'
import { advanceTimer, getRemainingSeconds, timerReducer } from './reducer'

const runningTimer: TimerState = {
  blockId: 'block-1',
  remainingSeconds: 10,
  running: true,
  updatedAt: 1_000,
}

describe('timerReducer', () => {
  it('starts a timer with a fresh timestamp and normalized duration', () => {
    expect(timerReducer(null, {
      type: 'start',
      blockId: 'block-1',
      durationSeconds: 10.9,
      at: 1_000,
    })).toEqual({
      blockId: 'block-1',
      remainingSeconds: 10,
      running: true,
      updatedAt: 1_000,
    })
  })

  it('derives elapsed time from timestamps instead of interval count', () => {
    const afterDelayedTick = timerReducer(runningTimer, { type: 'tick', at: 3_500 })

    expect(afterDelayedTick).toEqual({
      ...runningTimer,
      remainingSeconds: 8,
      updatedAt: 3_000,
    })
    expect(getRemainingSeconds(afterDelayedTick, 4_000)).toBe(7)
  })

  it('does not decrement when the clock moves backwards', () => {
    expect(advanceTimer(runningTimer, 500)).toEqual(runningTimer)
  })

  it('pauses and resumes without counting paused time', () => {
    const paused = timerReducer(runningTimer, { type: 'pause', at: 3_500 })
    const resumed = timerReducer(paused, { type: 'resume', at: 10_000 })

    expect(paused).toEqual({
      blockId: 'block-1',
      remainingSeconds: 8,
      running: false,
      updatedAt: 3_500,
    })
    expect(resumed).toEqual({
      blockId: 'block-1',
      remainingSeconds: 8,
      running: true,
      updatedAt: 10_000,
    })
  })

  it('completes once and makes duplicate completion idempotent', () => {
    const completed = timerReducer(runningTimer, { type: 'complete', at: 20_000 })

    expect(completed).toEqual({
      blockId: 'block-1',
      remainingSeconds: 0,
      running: false,
      updatedAt: 20_000,
    })
    expect(timerReducer(completed, { type: 'complete', at: 30_000 })).toBe(completed)
    expect(timerReducer(completed, { type: 'resume', at: 30_000 })).toBe(completed)
  })

  it('reconciles a hydrated running timer after reload', () => {
    expect(timerReducer(runningTimer, { type: 'hydrate', at: 4_200 })).toEqual({
      ...runningTimer,
      remainingSeconds: 7,
      updatedAt: 4_000,
    })
  })

  it('reconciles on visibility and preserves the timer while hidden', () => {
    const hidden = timerReducer(runningTimer, { type: 'visibility', visible: false, at: 4_000 })
    const visible = timerReducer(hidden, { type: 'visibility', visible: true, at: 4_000 })

    expect(hidden).toBe(runningTimer)
    expect(visible).toEqual({
      ...runningTimer,
      remainingSeconds: 7,
      updatedAt: 4_000,
    })
  })

  it('handles rapid controls, reset, and zero-duration completion safely', () => {
    const started = timerReducer(null, { type: 'start', blockId: 'block-2', durationSeconds: 0, at: 1_000 })
    const resumed = timerReducer(started, { type: 'resume', at: 2_000 })
    const reset = timerReducer(resumed, { type: 'reset' })

    expect(started?.running).toBe(false)
    expect(resumed).toBe(started)
    expect(reset).toBeNull()
  })
})
