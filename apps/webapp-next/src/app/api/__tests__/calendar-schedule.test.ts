// eslint-disable @typescript-eslint/no-explicit-any
/**
 * @jest-environment node
 */

/**
 * Tests for /api/productivity/calendar/schedule route handler
 */

// Mock Request for node environment
class MockRequest {
  url: string
  method: string
  headers: Map<string, string>
  private _body: string

  constructor(url: string, options: { method?: string; headers?: Record<string, string>; body?: string } = {}) {
    this.url = url
    this.method = options.method || 'GET'
    this.headers = new Map(Object.entries(options.headers || {}))
    this._body = options.body || ''
  }

  async json() {
    return JSON.parse(this._body)
  }
}

// @ts-expect-error - Mock globals
global.Request = MockRequest as any

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      json: async () => body,
      status: init?.status || 200,
    }),
  },
}))

// Mock createServerClient
const mockScheduleMeeting = jest.fn()
jest.mock('@/lib/api/client', () => ({
  createServerClient: () => ({
    productivity: {
      scheduleMeetingApiProductivityCalendarSchedulePost: mockScheduleMeeting,
    },
  }),
}))

// Import AFTER mocks
import { POST } from '../productivity/calendar/schedule/route'

describe('POST /api/productivity/calendar/schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should schedule a calendar event successfully', async () => {
    const mockResponse = {
      id: '123',
      title: 'Team Meeting',
      start_time: '2024-01-15T10:00:00Z',
      duration_minutes: 60,
      attendees: ['user@example.com'],
    }
    mockScheduleMeeting.mockResolvedValue(mockResponse)

    const request = new Request('http://localhost:3000/api/productivity/calendar/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        title: 'Team Meeting',
        start_time: '2024-01-15T10:00:00Z',
        duration_minutes: 60,
        attendees: ['user@example.com'],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.status).toBe('success')
    expect(data.data).toEqual(mockResponse)
  })

  it('should call backend with correct parameters', async () => {
    mockScheduleMeeting.mockResolvedValue({ id: '456' })

    const eventData = {
      title: 'Meeting',
      start_time: '2024-01-15T14:00:00Z',
      duration_minutes: 30,
      attendees: ['user1@example.com', 'user2@example.com'],
    }

    const request = new Request('http://localhost:3000/api/productivity/calendar/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer my-token',
      },
      body: JSON.stringify(eventData),
    })

    await POST(request)

    expect(mockScheduleMeeting).toHaveBeenCalledWith({
      requestBody: {
        title: 'Meeting',
        start_time: '2024-01-15T14:00:00Z',
        duration_minutes: 30,
        attendees: ['user1@example.com', 'user2@example.com'],
      },
    })
  })

  it('should use default values for optional parameters', async () => {
    mockScheduleMeeting.mockResolvedValue({ id: '789' })

    const request = new Request('http://localhost:3000/api/productivity/calendar/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        title: 'Quick Sync',
        start_time: '2024-01-15T10:00:00Z',
        // No duration_minutes or attendees
      }),
    })

    await POST(request)

    expect(mockScheduleMeeting).toHaveBeenCalledWith({
      requestBody: {
        title: 'Quick Sync',
        start_time: '2024-01-15T10:00:00Z',
        duration_minutes: 60, // default
        attendees: [], // default
      },
    })
  })

  it('should handle API errors with status', async () => {
    const error = {
      status: 400,
      body: { detail: 'Invalid event data' },
    }
    mockScheduleMeeting.mockRejectedValue(error)

    const request = new Request('http://localhost:3000/api/productivity/calendar/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        title: 'Meeting',
        start_time: '2024-01-15T10:00:00Z',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid event data')
  })

  it('should handle generic errors', async () => {
    mockScheduleMeeting.mockRejectedValue(new Error('Network failure'))

    const request = new Request('http://localhost:3000/api/productivity/calendar/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        title: 'Meeting',
        start_time: '2024-01-15T10:00:00Z',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create calendar event')
  })

  it('should handle missing Authorization header', async () => {
    mockScheduleMeeting.mockResolvedValue({ id: '123' })

    const request = new Request('http://localhost:3000/api/productivity/calendar/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Meeting',
        start_time: '2024-01-15T10:00:00Z',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.status).toBe('success')
  })
})
