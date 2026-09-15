import { describe, expect, it } from 'vitest'
import { createFakeClock, createProviderFake, MemoryStorage } from './fakes'

describe('test harness fakes', () => {
  it('provides a controllable clock and browser-like storage', () => {
    const clock = createFakeClock(1_000)
    const storage = new MemoryStorage({ setup: '{"ready":true}' })

    clock.advance(2_500)
    storage.setItem('plan', '{"blocks":[]}')

    expect(clock.now()).toBe(3_500)
    expect(storage.length).toBe(2)
    expect(storage.getItem('setup')).toBe('{"ready":true}')
    expect(storage.getItem('plan')).toBe('{"blocks":[]}')
  })

  it('models deferred provider responses without making a network call', async () => {
    const provider = createProviderFake<string, string>()
    const pending = provider.request('quiz:cell-biology')

    expect(provider.requests).toHaveLength(1)
    expect(provider.requests[0]?.input).toBe('quiz:cell-biology')

    provider.requests[0]?.deferred.resolve('fixture response')
    await expect(pending).resolves.toBe('fixture response')
    await expect(fetch('/provider')).rejects.toThrow('Network access is disabled in unit tests')
  })
})
