import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../page'

// Mock next/navigation - must return stable reference
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
}
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
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

describe('Root Page (LoginPage)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetToken.mockReturnValue(null)
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

  it('should update email input', () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    expect(emailInput).toHaveValue('test@example.com')
  })

  it('should update password input', () => {
    render(<LoginPage />)

    const pinInput = screen.getByLabelText('PIN')
    fireEvent.change(pinInput, { target: { value: '123456' } })

    expect(pinInput).toHaveValue('123456')
  })

  it('should show loading state during login', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()
    })
  })

  it('should handle successful login', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'test-jwt-token',
        user: { id: '1', email: 'test@example.com' },
      }),
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mockSetToken).toHaveBeenCalledWith('test-jwt-token')
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/chat')
    })
  })

  it('should display string error from response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Invalid credentials',
      }),
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should display detail error from response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        detail: 'Authentication failed',
      }),
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Authentication failed')).toBeInTheDocument()
    })
  })

  it('should display object error from response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: 'Complex error' },
      }),
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText(/message.*Complex error/)).toBeInTheDocument()
    })
  })

  it('should display default error when no token returned', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument()
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
})
