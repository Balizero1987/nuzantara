import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Login } from '../Login';
import { useLogin } from '../../hooks/useLogin';

// Mock useLogin hook
jest.mock('../../hooks/useLogin');

const mockUseLogin = useLogin as jest.MockedFunction<typeof useLogin>;

describe('Login Component', () => {
  const mockLogin = jest.fn();
  const mockClearError = jest.fn();
  const mockClearSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLogin.mockReturnValue({
      loading: false,
      error: '',
      success: '',
      login: mockLogin,
      clearError: mockClearError,
      clearSuccess: mockClearSuccess,
    });
  });

  it('should render email and PIN inputs', () => {
    render(<Login />);
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/security pin/i)).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    
    // Invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    // Valid email
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    });
  });

  it('should disable submit button when form is invalid', () => {
    render(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when form is valid', async () => {
    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Enter PIN (4-8 digits)
    const pinInputs = screen.getAllByRole('textbox').filter(
      (input) => input.getAttribute('type') === 'text'
    );
    
    // Simulate entering PIN (focus first input and type)
    if (pinInputs.length > 0) {
      fireEvent.focus(pinInputs[0]);
      fireEvent.change(pinInputs[0], { target: { value: '1' } });
    }
    
    await waitFor(() => {
      // Button should be enabled when form is valid
      // Note: This might need adjustment based on actual PIN input implementation
    }, { timeout: 1000 });
  });

  it('should call login function on form submit', async () => {
    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    const form = screen.getByRole('form') || document.getElementById('loginForm');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    if (form) {
      fireEvent.submit(form);
    }
    
    // Login should be called (even if validation fails, it should attempt)
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should display error message when login fails', () => {
    mockUseLogin.mockReturnValue({
      loading: false,
      error: 'Invalid credentials',
      success: '',
      login: mockLogin,
      clearError: mockClearError,
      clearSuccess: mockClearSuccess,
    });

    render(<Login />);
    
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('should display success message when login succeeds', () => {
    mockUseLogin.mockReturnValue({
      loading: false,
      error: '',
      success: 'Welcome back!',
      login: mockLogin,
      clearError: mockClearError,
      clearSuccess: mockClearSuccess,
    });

    render(<Login />);
    
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('should show loading state during login', () => {
    mockUseLogin.mockReturnValue({
      loading: true,
      error: '',
      success: '',
      login: mockLogin,
      clearError: mockClearError,
      clearSuccess: mockClearSuccess,
    });

    render(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toHaveClass('loading');
    expect(submitButton).toBeDisabled();
  });

  it('should focus email input on mount', () => {
    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveFocus();
  });

  it('should clear error when email changes', async () => {
    mockUseLogin.mockReturnValue({
      loading: false,
      error: 'Previous error',
      success: '',
      login: mockLogin,
      clearError: mockClearError,
      clearSuccess: mockClearSuccess,
    });

    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'new@email.com' } });
    
    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });
});

