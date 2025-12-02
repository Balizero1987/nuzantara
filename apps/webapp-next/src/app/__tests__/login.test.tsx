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

// Mock AuthContext
const mockLogin = jest.fn()
const mockUseAuth = jest.fn()

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default auth state
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      login: mockLogin,
    })
  })

  it('should render login form', () => {
    render(<LoginPage />)

    expect(screen.getByAltText('ZANTARA')).toBeInTheDocument()
    expect(screen.getByText('Sign in to continue')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('PIN')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('should redirect to chat if already logged in', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      login: mockLogin,
    })

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
    mockLogin.mockImplementation(() => new Promise(() => { })) // Never resolves

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()
    })
  })

  it('should handle successful login', async () => {
    mockLogin.mockResolvedValue(undefined)

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        pin: '123456',
      })
    })
  })

  it('should display error on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('should display default error message if error has no message', async () => {
    mockLogin.mockRejectedValue({})

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText('PIN'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Login failed. Please check your credentials.')).toBeInTheDocument()
    })
  })
})
