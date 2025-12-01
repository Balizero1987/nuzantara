import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { CalendarWidget } from '../CalendarWidget'

// Mock calendarAPI
const mockListEvents = jest.fn()
jest.mock('@/lib/api/calendar', () => ({
  calendarAPI: {
    listEvents: (limit: number) => mockListEvents(limit),
  },
}))

describe('CalendarWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show loading state initially', () => {
    mockListEvents.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<CalendarWidget />)

    // Check for loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should display events after loading', async () => {
    const mockEvents = [
      { title: 'Team Meeting', start_time: '2025-12-01T10:00:00Z' },
      { title: 'Client Call', start_time: '2025-12-01T14:00:00Z' },
    ]
    mockListEvents.mockResolvedValue(mockEvents)

    render(<CalendarWidget />)

    await waitFor(() => {
      expect(screen.getByText('Upcoming Events')).toBeInTheDocument()
      expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      expect(screen.getByText('Client Call')).toBeInTheDocument()
    })
  })

  it('should display "No upcoming events" when empty', async () => {
    mockListEvents.mockResolvedValue([])

    render(<CalendarWidget />)

    await waitFor(() => {
      expect(screen.getByText('No upcoming events')).toBeInTheDocument()
    })
  })

  it('should call listEvents with limit of 5', async () => {
    mockListEvents.mockResolvedValue([])

    render(<CalendarWidget />)

    await waitFor(() => {
      expect(mockListEvents).toHaveBeenCalledWith(5)
    })
  })

  it('should handle API error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    mockListEvents.mockRejectedValue(new Error('API Error'))

    render(<CalendarWidget />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        '[v0] Failed to load calendar events:',
        expect.any(Error)
      )
    })

    // Should still render empty state
    expect(screen.getByText('No upcoming events')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })

  it('should format event dates correctly', async () => {
    const mockEvents = [
      { title: 'Test Event', start_time: '2025-12-15T09:30:00Z' },
    ]
    mockListEvents.mockResolvedValue(mockEvents)

    render(<CalendarWidget />)

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
      // The date formatting depends on locale, so we check for partial content
      expect(screen.getByText(/Dec/)).toBeInTheDocument()
    })
  })

  it('should render multiple events', async () => {
    const mockEvents = [
      { title: 'Event 1', start_time: '2025-12-01T10:00:00Z' },
      { title: 'Event 2', start_time: '2025-12-02T11:00:00Z' },
      { title: 'Event 3', start_time: '2025-12-03T12:00:00Z' },
    ]
    mockListEvents.mockResolvedValue(mockEvents)

    render(<CalendarWidget />)

    await waitFor(() => {
      expect(screen.getByText('Event 1')).toBeInTheDocument()
      expect(screen.getByText('Event 2')).toBeInTheDocument()
      expect(screen.getByText('Event 3')).toBeInTheDocument()
    })
  })

  it('should show 3 skeleton items during loading', () => {
    mockListEvents.mockImplementation(() => new Promise(() => {}))

    render(<CalendarWidget />)

    const skeletonItems = document.querySelectorAll('.bg-gray-700\\/50')
    expect(skeletonItems.length).toBe(3)
  })
})
