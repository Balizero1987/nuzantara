import React, { forwardRef } from 'react';

interface PinInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  showPin: boolean;
  onToggleVisibility: () => void;
  isValid?: boolean | null;
  pinLength: number;
}

export const PinInput = forwardRef<HTMLInputElement, PinInputProps>(
  (
    {
      id,
      label,
      value,
      onChange,
      onKeyDown,
      showPin,
      onToggleVisibility,
      isValid,
      pinLength,
    },
    ref
  ) => {
    return (
      <div className="form-group">
        <label htmlFor={id} className="form-label">
          {label}
        </label>
        <div className="pin-input-wrapper">
          <input
            ref={ref}
            type={showPin ? 'text' : 'password'}
            id={id}
            className="form-input pin-input"
            placeholder="••••••"
            required
            pattern="[0-9]{4,8}"
            inputMode="numeric"
            maxLength={8}
            autoComplete="off"
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            id="pinToggle"
            className="pin-toggle"
            onClick={onToggleVisibility}
            aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
            aria-pressed={showPin}
          >
            <svg
              className="eye-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {showPin ? (
                <>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </>
              )}
            </svg>
          </button>
          {isValid !== null && pinLength > 0 && (
            <span
              className={`validation-icon ${isValid ? 'valid' : 'invalid'}`}
              aria-hidden="true"
            >
              {isValid ? '✓' : '✗'}
            </span>
          )}
        </div>
        <div className="pin-progress">
          <div 
            className="pin-progress-bar" 
            data-progress={pinLength}
            style={{
              width: `${(pinLength / 8) * 100}%`
            } as React.CSSProperties}
          ></div>
          <p className="pin-hint">
            <span id="pinCount">{pinLength}</span>/8 digits
          </p>
        </div>
      </div>
    );
  }
);

PinInput.displayName = 'PinInput';

