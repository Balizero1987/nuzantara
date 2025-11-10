import React, { useState, useEffect, useRef } from 'react';
import { validateEmail, validatePin, sanitizePin } from '../utils/login-utils';
import { useLogin } from '../hooks/useLogin';
import { InputField } from './InputField';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';

interface LoginProps {}

export const Login: React.FC<LoginProps> = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [pinValid, setPinValid] = useState<boolean | null>(null);
  
  const emailInputRef = useRef<HTMLInputElement>(null);

  const { loading, error, success, login, clearError, clearSuccess } = useLogin();

  // Autofocus email on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Email validation
  useEffect(() => {
    if (email.length === 0) {
      setEmailValid(null);
      return;
    }
    setEmailValid(validateEmail(email));
    if (email.length > 0) {
      clearError();
    }
  }, [email, clearError]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.trim());
  };

  const handlePinChange = (value: string) => {
    setPin(value);
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Focus first PIN input
      const firstPinInput = document.querySelector('.pin-otp-wrapper input') as HTMLInputElement;
      firstPinInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, pin);
    } catch (err) {
      // Error already handled by useLogin hook
      setPin('');
      // Focus first PIN input
      const firstPinInput = document.querySelector('.pin-otp-wrapper input') as HTMLInputElement;
      firstPinInput?.focus();
    }
  };

  const pinLength = pin.length;
  const isFormValid = emailValid === true && pinValid === true;

  // PIN validation and auto-submit
  useEffect(() => {
    const sanitizedPin = sanitizePin(pin);
    if (sanitizedPin !== pin) {
      setPin(sanitizedPin);
      return;
    }

    const { isValid, length } = validatePin(sanitizedPin);
    setPinValid(isValid);
    
    if (length > 0) {
      clearError();
    }

    // Auto-submit when PIN = 8 characters
    if (length === 8 && emailValid && isValid) {
      const form = document.getElementById('loginForm') as HTMLFormElement;
      if (form) {
        setTimeout(() => {
          form.requestSubmit();
        }, 300);
      }
    }
  }, [pin, emailValid, isFormValid, clearError]);

  return (
    <div className="login-container">
      <img 
        src="assets/images/logo1-zantara.svg" 
        alt="ZANTARA" 
        className="bali-zero-logo"
      />
      
      <div className="login-form-wrapper">
        {success && (
          <div id="welcomeMessage" className={`welcome-message show success`}>
            {success}
          </div>
        )}

        <form id="loginForm" className="login-form" onSubmit={handleSubmit}>
          {/* Aria-live region for screen readers */}
          <div id="ariaLive" aria-live="polite" aria-atomic="true" className="sr-only">
            {emailValid === true && 'Email format valid'}
            {emailValid === false && 'Email format invalid'}
            {pinLength > 0 && `${pinLength} digits entered. ${pinValid ? 'PIN valid' : 'PIN must be 4-8 digits'}`}
            {error && `Error: ${error}`}
          </div>
          
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="input-wrapper">
              <InputField
                ref={emailInputRef}
                id="email"
                label=""
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={handleEmailChange}
                onKeyDown={handleEmailKeyDown}
                onBlur={clearSuccess}
                isValid={emailValid}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* PIN Field with separate boxes */}
          <div className="form-group">
            <label htmlFor="pin" className="form-label">
              Security PIN
            </label>
            <div className="pin-otp-wrapper">
              <InputOTP maxLength={8} value={pin} onChange={handlePinChange}>
                <InputOTPGroup className="pin-otp-group">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="pin-otp-slot"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          <button 
            type="submit" 
            id="loginButton" 
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={!isFormValid || loading}
          >
            <span className="button-text">SIGN IN</span>
            {loading && (
              <span className="button-spinner" aria-hidden="true"></span>
            )}
          </button>

          {error && (
            <div id="errorMessage" className="error-message show" role="alert" aria-live="assertive">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
