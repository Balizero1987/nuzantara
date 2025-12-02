import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { ThinkingIndicator } from '../ThinkingIndicator'

describe('ThinkingIndicator', () => {
  let randomSpy: jest.SpyInstance

  beforeEach(() => {
    jest.useFakeTimers()
    // Mock Math.random to return 0 for predictable message index (0) and delay
    randomSpy = jest.spyOn(global.Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    jest.useRealTimers()
    randomSpy.mockRestore()
  })

  it('should render thinking indicator with dots', () => {
    render(<ThinkingIndicator />)

    // Check for bouncing dots (3 dots)
    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })

  it('should display initial thinking message', () => {
    render(<ThinkingIndicator />)

    expect(screen.getByText('Memahami pertanyaan Anda...')).toBeInTheDocument()
  })

  it('should cycle through thinking messages', () => {
    render(<ThinkingIndicator />)

    expect(screen.getByText('Memahami pertanyaan Anda...')).toBeInTheDocument()

    // Mock random to return next index (1)
    // The implementation uses: Math.floor(Math.random() * length)
    // To get index 1 from length 6, random needs to be >= 1/6 and < 2/6. e.g. 0.2
    randomSpy.mockReturnValue(0.2)

    // Advance timer by 3 seconds (max delay is 3000ms)
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    expect(screen.getByText('Mencari informasi terkait...')).toBeInTheDocument()
  })

  it('should render dots with correct animation delays', () => {
    render(<ThinkingIndicator />)

    const dots = document.querySelectorAll('.animate-bounce')

    expect(dots[0]).toHaveStyle({ animationDelay: '0ms' })
    expect(dots[1]).toHaveStyle({ animationDelay: '150ms' })
    expect(dots[2]).toHaveStyle({ animationDelay: '300ms' })
  })

  it('should have correct styling on message', () => {
    render(<ThinkingIndicator />)

    const message = screen.getByText('Memahami pertanyaan Anda...')
    expect(message).toHaveClass('text-sm', 'text-gray-300')
  })
})
