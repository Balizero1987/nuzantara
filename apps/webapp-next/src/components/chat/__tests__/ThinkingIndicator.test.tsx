import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { ThinkingIndicator } from '../ThinkingIndicator'

describe('ThinkingIndicator', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render thinking indicator with dots', () => {
    render(<ThinkingIndicator />)

    // Check for bouncing dots (3 dots)
    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots).toHaveLength(3)
  })

  it('should display initial thinking message', () => {
    render(<ThinkingIndicator />)

    expect(screen.getByText('Consulting Knowledge Base...')).toBeInTheDocument()
  })

  it('should cycle through thinking messages', () => {
    render(<ThinkingIndicator />)

    expect(screen.getByText('Consulting Knowledge Base...')).toBeInTheDocument()

    // Advance timer by 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(screen.getByText('Analyzing regulations...')).toBeInTheDocument()

    // Advance timer by another 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(screen.getByText('Formulating answer...')).toBeInTheDocument()
  })

  it('should loop back to first message after all messages', () => {
    render(<ThinkingIndicator />)

    // There are 5 messages, so after 5 * 2000ms = 10000ms it should loop
    act(() => {
      jest.advanceTimersByTime(10000)
    })

    expect(screen.getByText('Consulting Knowledge Base...')).toBeInTheDocument()
  })

  it('should clean up interval on unmount', () => {
    const { unmount } = render(<ThinkingIndicator />)

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it('should render dots with correct animation delays', () => {
    render(<ThinkingIndicator />)

    const dots = document.querySelectorAll('.animate-bounce')

    expect(dots[0]).toHaveStyle({ animationDelay: '0ms' })
    expect(dots[1]).toHaveStyle({ animationDelay: '150ms' })
    expect(dots[2]).toHaveStyle({ animationDelay: '300ms' })
  })

  it('should have pulse animation on message', () => {
    render(<ThinkingIndicator />)

    const message = screen.getByText('Consulting Knowledge Base...')
    expect(message).toHaveClass('animate-pulse')
  })

  it('should cycle through all 5 messages in order', () => {
    render(<ThinkingIndicator />)

    const messages = [
      'Consulting Knowledge Base...',
      'Analyzing regulations...',
      'Formulating answer...',
      'Connecting to Oracle...',
      'Synthesizing context...'
    ]

    messages.forEach((message, index) => {
      if (index > 0) {
        act(() => {
          jest.advanceTimersByTime(2000)
        })
      }
      expect(screen.getByText(message)).toBeInTheDocument()
    })
  })
})
