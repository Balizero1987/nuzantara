/**
 * @jest-environment node
 */

import { POST } from '../image/generate/route'

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Image Generate API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return generated image for valid request', async () => {
    const mockImageData = {
      image_url: 'https://example.com/image.png',
      prompt: 'A beautiful sunset',
    }

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockImageData,
    })

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        prompt: 'A beautiful sunset',
        style: 'realistic',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.image_url).toBe('https://example.com/image.png')
    expect(data.prompt).toBe('A beautiful sunset')
  })

  it('should forward authorization header to backend', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ image_url: 'test.png' }),
    })

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-auth-token',
      },
      body: JSON.stringify({ prompt: 'Test' }),
    })

    await POST(request)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-auth-token',
        }),
      })
    )
  })

  it('should handle backend error response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Invalid prompt' }),
    })

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid prompt')
  })

  it('should handle backend error without detail', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    })

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Image generation failed')
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to connect to Image service')
  })

  it('should use correct API URL and key', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ image_url: 'test.png' }),
    })

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test' }),
    })

    await POST(request)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/image/generate'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-API-Key': expect.any(String),
        }),
      })
    )
  })

  it('should forward request body to backend', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ image_url: 'test.png' }),
    })

    const requestBody = {
      prompt: 'A cat in space',
      style: 'cartoon',
      size: '1024x1024',
    }

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    await POST(request)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify(requestBody),
      })
    )
  })

  it('should handle empty authorization header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ image_url: 'test.png' }),
    })

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test' }),
    })

    await POST(request)

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: '',
        }),
      })
    )
  })
})
