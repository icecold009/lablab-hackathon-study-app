import { describe, expect, it } from 'vitest'
import { createQuestion } from '../test/fixtures'
import { createSampleQuizProvider, normalizeQuizQuestions, QuizProviderError } from './provider'

describe('quiz provider boundary', () => {
  it('normalizes wrapped and partial provider data while preserving valid order', () => {
    const first = createQuestion({ id: 'same-id' })
    const duplicate = createQuestion({ id: 'same-id', question: 'A second question' })

    expect(normalizeQuizQuestions({
      questions: [first, { malformed: true }, duplicate],
    })).toEqual([
      first,
      { ...duplicate, id: 'same-id-1' },
    ])
  })

  it('rejects a provider response with no valid questions', () => {
    expect(() => normalizeQuizQuestions({ questions: [{ id: 'missing-fields' }] })).toThrow(QuizProviderError)
  })

  it('supports cancellation without invoking the sample generator after abort', async () => {
    const provider = createSampleQuizProvider(25)
    const abortController = new AbortController()
    const request = provider.requestQuestions('Cell Biology', abortController.signal)

    abortController.abort()

    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
  })
})
