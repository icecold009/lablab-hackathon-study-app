import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage characterization', () => {
  it('returns the initial value when storage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('empty', { ready: false }))

    expect(result.current[0]).toEqual({ ready: false })
  })

  it('hydrates JSON and persists functional updates', () => {
    window.localStorage.setItem('counter', JSON.stringify(1))
    const { result } = renderHook(() => useLocalStorage('counter', 0))

    expect(result.current[0]).toBe(1)

    act(() => {
      result.current[1]((previous) => previous + 1)
    })

    expect(result.current[0]).toBe(2)
    expect(window.localStorage.getItem('counter')).toBe('2')
  })

  it('falls back on corrupt JSON and emits a storage error event', () => {
    const errors: CustomEvent[] = []
    const handleError = (event: Event) => errors.push(event as CustomEvent)
    window.addEventListener('icecold:storage-error', handleError)
    window.localStorage.setItem('corrupt', '{not-json')

    const { result } = renderHook(() => useLocalStorage('corrupt', null))

    expect(result.current[0]).toBeNull()
    expect(errors).toHaveLength(1)
    expect(errors[0]?.detail).toEqual({ key: 'corrupt' })
    window.removeEventListener('icecold:storage-error', handleError)
  })

  it('keeps the in-memory update when a storage write fails and emits an error', () => {
    const errors: CustomEvent[] = []
    const handleError = (event: Event) => errors.push(event as CustomEvent)
    window.addEventListener('icecold:storage-error', handleError)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    const { result } = renderHook(() => useLocalStorage('quota', 'before'))

    act(() => {
      result.current[1]('after')
    })

    expect(result.current[0]).toBe('after')
    expect(errors).toHaveLength(1)
    expect(errors[0]?.detail).toEqual({ key: 'quota' })
    window.removeEventListener('icecold:storage-error', handleError)
  })

  it('hydrates valid cross-tab updates and unregisters its listener on unmount', () => {
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    const { result, unmount } = renderHook(() => useLocalStorage('shared', 'initial'))

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'shared',
        newValue: JSON.stringify('from another tab'),
      }))
    })

    expect(result.current[0]).toBe('from another tab')
    unmount()
    expect(removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
  })
})
