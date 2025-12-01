import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { CheckInOut } from '../CheckInOut'

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('CheckInOut', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-12-01T09:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render Check In button initially', () => {
    render(<CheckInOut />)
    expect(screen.getByText('Check In')).toBeInTheDocument()
  })

  it('should load saved state from localStorage', () => {
    const savedState = {
      isCheckedIn: true,
      checkInTime: '2025-12-01T08:00:00Z',
    }
    localStorage.setItem('zantara_checkin_state', JSON.stringify(savedState))

    render(<CheckInOut />)

    expect(screen.getByText('Check Out')).toBeInTheDocument()
  })

  it('should check in when button is clicked', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    render(<CheckInOut />)

    fireEvent.click(screen.getByText('Check In'))

    await waitFor(() => {
      expect(screen.getByText('Check Out')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/productivity/calendar/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('Work Session - Check In'),
    })
  })

  it('should save state to localStorage on check in', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    render(<CheckInOut />)

    fireEvent.click(screen.getByText('Check In'))

    await waitFor(() => {
      const savedState = JSON.parse(localStorage.getItem('zantara_checkin_state') || '{}')
      expect(savedState.isCheckedIn).toBe(true)
      expect(savedState.checkInTime).toBeDefined()
    })
  })

  it('should check out when button is clicked', async () => {
    const savedState = {
      isCheckedIn: true,
      checkInTime: '2025-12-01T08:00:00Z',
    }
    localStorage.setItem('zantara_checkin_state', JSON.stringify(savedState))

    render(<CheckInOut />)

    fireEvent.click(screen.getByText('Check Out'))

    await waitFor(() => {
      expect(screen.getByText('Check In')).toBeInTheDocument()
    })

    expect(localStorage.getItem('zantara_checkin_state')).toBeNull()
  })

  it('should display duration when checked in', () => {
    const savedState = {
      isCheckedIn: true,
      checkInTime: '2025-12-01T08:00:00Z', // 1 hour ago
    }
    localStorage.setItem('zantara_checkin_state', JSON.stringify(savedState))

    render(<CheckInOut />)

    expect(screen.getByText('1h 0m')).toBeInTheDocument()
  })

  it('should show loading spinner during check in', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<CheckInOut />)

    fireEvent.click(screen.getByText('Check In'))

    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  it('should disable button during loading', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<CheckInOut />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
    })
  })

  it('should handle check in error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<CheckInOut />)

    fireEvent.click(screen.getByText('Check In'))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('[v0] Check-in error:', expect.any(Error))
    })

    // Should still show Check In button (not checked in)
    expect(screen.getByText('Check In')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should handle failed API response', async () => {
    mockFetch.mockResolvedValue({ ok: false })

    render(<CheckInOut />)

    fireEvent.click(screen.getByText('Check In'))

    await waitFor(() => {
      // Should still show Check In button (not checked in)
      expect(screen.getByText('Check In')).toBeInTheDocument()
    })
  })

  it('should format duration correctly for hours and minutes', () => {
    const savedState = {
      isCheckedIn: true,
      checkInTime: '2025-12-01T06:30:00Z', // 2.5 hours ago
    }
    localStorage.setItem('zantara_checkin_state', JSON.stringify(savedState))

    render(<CheckInOut />)

    expect(screen.getByText('2h 30m')).toBeInTheDocument()
  })

  it('should not display duration when not checked in', () => {
    render(<CheckInOut />)

    expect(screen.queryByText(/h.*m/)).not.toBeInTheDocument()
  })

  it('should handle check out error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    const savedState = {
      isCheckedIn: true,
      checkInTime: '2025-12-01T08:00:00Z',
    }
    localStorage.setItem('zantara_checkin_state', JSON.stringify(savedState))

    // Mock localStorage.removeItem to throw error
    const originalRemoveItem = localStorage.removeItem.bind(localStorage)
    localStorage.removeItem = jest.fn(() => {
      throw new Error('Storage error')
    })

    render(<CheckInOut />)

    fireEvent.click(screen.getByText('Check Out'))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('[v0] Check-out error:', expect.any(Error))
    })

    consoleSpy.mockRestore()
    localStorage.removeItem = originalRemoveItem
  })

  it('should have correct button styling for check in', () => {
    render(<CheckInOut />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-green-400')
  })

  it('should have correct button styling for check out', () => {
    const savedState = {
      isCheckedIn: true,
      checkInTime: '2025-12-01T08:00:00Z',
    }
    localStorage.setItem('zantara_checkin_state', JSON.stringify(savedState))

    render(<CheckInOut />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-red-400')
  })
})
