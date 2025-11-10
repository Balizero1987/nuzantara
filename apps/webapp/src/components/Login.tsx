import React, { useState, useEffect, useRef } from 'react';
import { validateEmail, validatePin, sanitizePin } from '../utils/login-utils';
import { useLogin } from '../hooks/useLogin';
import { InputField } from './InputField';
import { PinInput } from './PinInput';

interface LoginProps {}

export const Login: React.FC<LoginProps> = () => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [pinValid, setPinValid] = useState<boolean | null>(null);
  
  const emailInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

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

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPin(e.target.value);
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      pinInputRef.current?.focus();
    }
  };

  const handlePinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && emailValid && pinValid) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const togglePinVisibility = () => {
    setShowPin(!showPin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, pin);
    } catch (err) {
      // Error already handled by useLogin hook
      setPin('');
      pinInputRef.current?.focus();
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
    if (length === 8 && emailValid && isFormValid) {
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
          
          <InputField
            ref={emailInputRef}
            id="email"
            label="EMAIL"
            type="email"
            placeholder="zero@balizero.com"
            value={email}
            onChange={handleEmailChange}
            onKeyDown={handleEmailKeyDown}
            onBlur={clearSuccess}
            isValid={emailValid}
            required
            autoComplete="email"
          />

          <PinInput
            ref={pinInputRef}
            id="pin"
            label="PIN"
            value={pin}
            onChange={handlePinChange}
            onKeyDown={handlePinKeyDown}
            showPin={showPin}
            onToggleVisibility={togglePinVisibility}
            isValid={pinValid}
            pinLength={pinLength}
          />

          <button 
            type="submit" 
            id="loginButton" 
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={!isFormValid || loading}
          >
            <span className="button-text">Login</span>
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
