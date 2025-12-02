/**
 * @jest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'

describe('useIsMobile', () => {
  const originalMatchMedia = window.matchMedia
  const mockMatchMedia = jest.fn()

  beforeEach(() => {
    window.matchMedia = mockMatchMedia as any
    // Reset window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('should return false for desktop width', () => {
    window.innerWidth = 1024
    const mockMediaQuery = {
      matches: false,
      media: '(max-width: 767px)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }

    mockMatchMedia.mockReturnValue(mockMediaQuery)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })

  it('should return true for mobile width', () => {
    window.innerWidth = 500
    const mockMediaQuery = {
      matches: true,
      media: '(max-width: 767px)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }

    mockMatchMedia.mockReturnValue(mockMediaQuery)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it('should update when window width changes', () => {
    window.innerWidth = 1024
    let changeHandler: any = null

    const mockMediaQuery = {
      matches: false,
      media: '(max-width: 767px)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn((event, handler) => {
        if (event === 'change') {
          changeHandler = handler
        }
      }),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }

    mockMatchMedia.mockReturnValue(mockMediaQuery)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    act(() => {
      // Simulate resize and media query change
      window.innerWidth = 500
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent)
      }
    })

    // Note: useIsMobile implementation might rely on window.innerWidth or just the media query listener.
    // If it relies on listener, result.current should be true now.
    expect(result.current).toBe(true)
  })

  it('should clean up event listener on unmount', () => {
    const mockMediaQuery = {
      matches: false,
      media: '(max-width: 767px)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }

    mockMatchMedia.mockReturnValue(mockMediaQuery)

    const { unmount } = renderHook(() => useIsMobile())

    unmount()

    expect(mockMediaQuery.removeEventListener).toHaveBeenCalled()
  })

  it('should handle edge case at breakpoint (768px)', () => {
    window.innerWidth = 768
    const mockMediaQuery = {
      matches: false, // 768px is not < 768px (assuming breakpoint is 768)
      media: '(max-width: 767px)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }

    mockMatchMedia.mockReturnValue(mockMediaQuery)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it('should handle edge case just below breakpoint (767px)', () => {
    window.innerWidth = 767
    const mockMediaQuery = {
      matches: true, // 767px is < 768px
      media: '(max-width: 767px)',
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }

    mockMatchMedia.mockReturnValue(mockMediaQuery)

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })
})

