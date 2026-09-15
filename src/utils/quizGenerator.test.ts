import { describe, expect, it } from 'vitest'
import { calculateScore, checkAnswer, generateTopicQuiz } from './quizGenerator'
import { createQuestion } from '../test/fixtures'

describe('quiz generation characterization', () => {
  it('keeps question and option order deterministic per topic', () => {
    expect(generateTopicQuiz('Cell Biology')).toEqual(generateTopicQuiz('Cell Biology'))
    expect(generateTopicQuiz('Cell Biology')).not.toEqual(generateTopicQuiz('Genetics'))
  })

  it('scores submitted questions and accepts normalized short answers', () => {
    const questions = [
      createQuestion({ isCorrect: true }),
      createQuestion({ id: 'mcq-2', isCorrect: false }),
    ]

    expect(calculateScore(questions)).toBe(1)
    expect(checkAnswer(createQuestion(), 'Mitochondria')).toBe(true)
    expect(checkAnswer(createQuestion({ type: 'short', correctAnswer: 'cell membrane' }), 'The cell membrane')).toBe(true)
    expect(checkAnswer(createQuestion(), 'Nucleus')).toBe(false)
  })
})
