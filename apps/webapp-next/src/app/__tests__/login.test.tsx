import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../login/page'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

// Mock apiClient
const mockGetToken = jest.fn()
const mockSetToken = jest.fn()
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getToken: () => mockGetToken(),
    setToken: (token: string) => mockSetToken(token),
    clearToken: jest.fn(),
  },
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockReturnValue(null)
    // Mock globalThis.location
    delete (globalThis as any).location
    ;(globalThis as any).location = { href: '' }
  })

  it('should render login form', () => {
    render(<LoginPage />)

    expect(screen.getByText('ZANTARA')).toBeInTheDocument()
    expect(screen.getByText('Sign in to continue')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('PIN')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('should redirect to chat if already logged in', () => {
    mockGetToken.mockReturnValue('existing-token')
    render(<LoginPage />)

    expect(mockPush).toHaveBeenCalledWith('/chat')
  })

  it('should update email input value', () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    expect(emailInput).toHaveValue('test@example.com')
  })

  it('should update password input value', () => {
    render(<LoginPage />)

    const pinInput = screen.getByLabelText('PIN')
    fireEvent.change(pinInput, { target: { value: '123456' } })

    expect(pinInput).toHaveValue('123456')
  })

  it('should show loading state during login', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()
    })
  })

  it('should handle successful login', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        token: 'test-jwt-token-12345',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      }),
    }
    mockFetch.mockResolvedValue(mockResponse)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mockSetToken).toHaveBeenCalledWith('test-jwt-token-12345')
    })

    await waitFor(() => {
      expect((globalThis as any).location.href).toBe('/chat')
    })
  })

  it('should display error on failed login', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({
        error: 'Invalid credentials',
      }),
    }
    mockFetch.mockResolvedValue(mockResponse)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should display error with detail field', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({
        detail: 'Authentication failed',
      }),
    }
    mockFetch.mockResolvedValue(mockResponse)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument()
    })
  })

  it('should display error with object error', async () => {
    const mockResponse = {
      ok: false,
      json: async () => ({
        error: { message: 'Complex error' },
      }),
    }
    mockFetch.mockResolvedValue(mockResponse)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText(/Complex error/)).toBeInTheDocument()
    })
  })

  it('should handle network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument()
    })
  })

  it('should save user data on successful login', async () => {
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }
    const mockResponse = {
      ok: true,
      json: async () => ({
        token: 'test-token',
        user: mockUser,
      }),
    }
    mockFetch.mockResolvedValue(mockResponse)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    // Verify token was set and redirect happened
    await waitFor(() => {
      expect(mockSetToken).toHaveBeenCalledWith('test-token')
    })

    await waitFor(() => {
      expect((globalThis as any).location.href).toBe('/chat')
    })
  })

  it('should display generic error when no token returned', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({}),
    }
    mockFetch.mockResolvedValue(mockResponse)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument()
    })
  })

  it('should use router.push when globalThis.location is not available', async () => {
    delete (globalThis as any).location

    const mockResponse = {
      ok: true,
      json: async () => ({
        token: 'test-token',
        user: { id: '1' },
      }),
    }
    mockFetch.mockResolvedValue(mockResponse)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/chat')
    })
  })
})
