import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { QuizQuestion } from '../types'
import { createQuestion } from '../test/fixtures'
import { createProviderFake, type ProviderRequest } from '../test/fakes'
import type { QuizProvider } from './provider'
import type { QuizSession } from './reducer'
import { useQuizController } from './controller'

function createDeferredProvider() {
  const fake = createProviderFake<string, unknown>()
  const provider: QuizProvider = {
    requestQuestions: (topicName, signal) => fake.request(topicName, signal),
  }
  return { fake, provider }
}

async function resolveRequest(request: ProviderRequest<string, unknown>, value: unknown) {
  await act(async () => {
    request.deferred.resolve(value)
    await Promise.resolve()
  })
}

describe('useQuizController', () => {
  it('cancels the previous request and ignores its stale response', async () => {
    const { fake, provider } = createDeferredProvider()
    const firstQuestion = createQuestion({ id: 'first' })
    const secondQuestion = createQuestion({ id: 'second' })
    const { result } = renderHook(() => useQuizController({ provider }))

    act(() => result.current.selectTopic('topic-1', 'Cell Biology'))
    act(() => result.current.selectTopic('topic-2', 'Genetics'))

    expect(fake.requests[0]?.signal?.aborted).toBe(true)
    await resolveRequest(fake.requests[0]!, [firstQuestion])
    expect(result.current.model.loading).toBe(true)

    await resolveRequest(fake.requests[1]!, [secondQuestion])
    await waitFor(() => expect(result.current.model.questions[0]?.id).toBe('second'))
    expect(result.current.model.topicId).toBe('topic-2')
  })

  it('preserves question order, scores once, and persists the finished result', async () => {
    const { fake, provider } = createDeferredProvider()
    const questions: QuizQuestion[] = [
      createQuestion({ id: 'first', correctAnswer: 'Mitochondria' }),
      createQuestion({ id: 'second', type: 'short', options: undefined, correctAnswer: 'cell membrane' }),
    ]
    const onResult = vi.fn()
    const onProgress = vi.fn()
    const sessionChanges: unknown[] = []
    const { result } = renderHook(() => useQuizController({
      provider,
      onResult,
      onProgress,
      onSessionChange: session => sessionChanges.push(session),
      now: () => '2026-09-15T00:00:00.000Z',
    }))

    act(() => result.current.selectTopic('topic-1', 'Cell Biology'))
    await resolveRequest(fake.requests[0]!, questions)
    await waitFor(() => expect(result.current.model.stage).toBe('taking'))

    act(() => result.current.answer('first', 'Mitochondria'))
    act(() => result.current.submit())
    act(() => result.current.next())
    act(() => result.current.answer('second', 'wrong'))
    act(() => result.current.submit())
    act(() => result.current.finish())

    expect(result.current.model.stage).toBe('results')
    expect(result.current.model.score).toBe(1)
    expect(onResult).toHaveBeenCalledTimes(1)
    expect(onResult.mock.calls[0]?.[0]).toMatchObject({
      topicId: 'topic-1',
      score: 1,
      total: 2,
      completedAt: '2026-09-15T00:00:00.000Z',
    })
    expect(onResult.mock.calls[0]?.[0].questions.map((question: QuizQuestion) => question.id)).toEqual(['first', 'second'])
    expect(onProgress).toHaveBeenCalledWith({ topicId: 'topic-1', scorePct: 50 })
    expect(sessionChanges.at(-1)).toBeNull()

    act(() => result.current.finish())
    expect(onResult).toHaveBeenCalledTimes(1)
  })

  it('persists and restores an in-progress session', async () => {
    const { fake, provider } = createDeferredProvider()
    let savedSession: QuizSession | null = null
    const question = createQuestion({ id: 'first' })
    const first = renderHook(() => useQuizController({
      provider,
      onSessionChange: session => { savedSession = session },
    }))

    act(() => first.result.current.selectTopic('topic-1', 'Cell Biology'))
    await resolveRequest(fake.requests[0]!, [question])
    await waitFor(() => expect(savedSession).not.toBeNull())
    act(() => first.result.current.answer('first', 'Mitochondria'))
    if (!savedSession) throw new Error('Expected an active quiz session to be persisted')
    const restoredSession: QuizSession = savedSession
    expect(restoredSession.answers).toEqual({ first: 'Mitochondria' })
    first.unmount()

    const restored = renderHook(() => useQuizController({ initialSession: savedSession }))
    expect(restored.result.current.model.stage).toBe('taking')
    expect(restored.result.current.model.answers).toEqual({ first: 'Mitochondria' })
  })

  it('shows a retryable provider error for completely malformed data', async () => {
    const { fake, provider } = createDeferredProvider()
    const { result } = renderHook(() => useQuizController({ provider }))

    act(() => result.current.selectTopic('topic-1', 'Cell Biology'))
    await resolveRequest(fake.requests[0]!, [{ malformed: true }])
    await waitFor(() => expect(result.current.model.error).toBe('The quiz provider returned no valid questions.'))
    expect(result.current.model.stage).toBe('select')

    act(() => result.current.retry())
    expect(fake.requests).toHaveLength(2)
  })

  it('aborts an outstanding request when unmounted', () => {
    const { fake, provider } = createDeferredProvider()
    const { result, unmount } = renderHook(() => useQuizController({ provider }))

    act(() => result.current.selectTopic('topic-1', 'Cell Biology'))
    unmount()

    expect(fake.requests[0]?.signal?.aborted).toBe(true)
  })
})
