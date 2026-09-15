import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Progress from './Progress'
import { createPlan, createQuizResult } from '../test/fixtures'

describe('Progress page characterization', () => {
  it('shows the empty state without stored sprint data', () => {
    render(
      <MemoryRouter initialEntries={['/progress']}>
        <Progress />
      </MemoryRouter>,
    )

    expect(screen.getByText('No Progress Yet')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeTruthy()
  })

  it('summarizes a stored plan and quiz result', () => {
    window.localStorage.setItem('icecold-setup', JSON.stringify(createPlan().setup))
    window.localStorage.setItem('icecold-plan', JSON.stringify(createPlan({
      blocks: [
        {
          ...createPlan().blocks[0],
          substantiallyCovered: true,
        },
      ],
    })))
    window.localStorage.setItem('icecold-quiz-results', JSON.stringify([createQuizResult()]))

    render(
      <MemoryRouter initialEntries={['/progress']}>
        <Progress />
      </MemoryRouter>,
    )

    expect(screen.getByText('Your Progress')).toBeTruthy()
    expect(screen.getAllByText('Cell Biology').length).toBeGreaterThan(0)
    expect(screen.getByText('Recommended Next Action')).toBeTruthy()
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0)
  })
})
