import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import type { TimerState } from '../types'
import { type TimerClock } from './clock'
import { useTimer } from './useTimer'

function createTestClock(start = 0) {
  let current = start
  let nextHandle = 0
  const intervals = new Map<number, () => void>()
  const listeners = new Set<(visible: boolean) => void>()

  const clock: TimerClock & {
    set: (value: number) => void
    fireIntervals: () => void
    emitVisibility: (visible: boolean) => void
    intervalCount: () => number
    listenerCount: () => number
  } = {
    now: () => current,
    set: (value) => {
      current = value
    },
    setInterval: (callback) => {
      const handle = ++nextHandle
      intervals.set(handle, callback)
      return handle
    },
    clearInterval: (handle) => {
      intervals.delete(handle)
    },
    subscribeVisibility: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    fireIntervals: () => {
      for (const callback of intervals.values()) callback()
    },
    emitVisibility: (visible) => {
      for (const listener of listeners) listener(visible)
    },
    intervalCount: () => intervals.size,
    listenerCount: () => listeners.size,
  }

  return clock
}

describe('useTimer', () => {
  it('hydrates, ticks from the injected clock, and cleans up on unmount', () => {
    const clock = createTestClock(3_500)
    const initial: TimerState = {
      blockId: 'block-1',
      remainingSeconds: 10,
      running: true,
      updatedAt: 1_000,
    }

    const { result, unmount } = renderHook(() => {
      const [timer, setTimer] = useState<TimerState | null>(initial)
      return { timer, controller: useTimer(timer, setTimer, clock) }
    })

    expect(result.current.timer).toMatchObject({ remainingSeconds: 8, running: true, updatedAt: 3_000 })
    expect(clock.intervalCount()).toBe(1)
    expect(clock.listenerCount()).toBe(1)

    act(() => {
      clock.set(4_500)
      clock.fireIntervals()
    })

    expect(result.current.timer).toMatchObject({ remainingSeconds: 7, running: true, updatedAt: 4_000 })

    unmount()
    expect(clock.intervalCount()).toBe(0)
    expect(clock.listenerCount()).toBe(0)
  })

  it('toggles a new block, pauses, and does not resume a completed timer', () => {
    const clock = createTestClock(1_000)
    const { result } = renderHook(() => {
      const [timer, setTimer] = useState<TimerState | null>(null)
      return { timer, controller: useTimer(timer, setTimer, clock) }
    })

    act(() => result.current.controller.toggle('block-1', 5))
    expect(result.current.timer).toMatchObject({ blockId: 'block-1', remainingSeconds: 5, running: true })

    act(() => result.current.controller.toggle('block-1', 5))
    expect(result.current.timer).toMatchObject({ remainingSeconds: 5, running: false })

    act(() => {
      clock.set(7_000)
      clock.emitVisibility(true)
    })
    expect(result.current.timer).toMatchObject({ remainingSeconds: 5, running: false })

    act(() => result.current.controller.toggle('block-2', 7))
    expect(result.current.timer).toMatchObject({ blockId: 'block-2', remainingSeconds: 7, running: true })
  })

  it('reconciles a hidden-tab delay when visibility returns', () => {
    const clock = createTestClock(0)
    const { result } = renderHook(() => {
      const [timer, setTimer] = useState<TimerState | null>({
        blockId: 'block-1',
        remainingSeconds: 4,
        running: true,
        updatedAt: 0,
      })
      return { timer, controller: useTimer(timer, setTimer, clock) }
    })

    act(() => {
      clock.set(5_000)
      clock.emitVisibility(false)
      clock.emitVisibility(true)
    })

    expect(result.current.timer).toMatchObject({ remainingSeconds: 0, running: false })
    expect(clock.intervalCount()).toBe(0)
  })
})
